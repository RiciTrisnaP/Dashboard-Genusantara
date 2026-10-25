// Lab dashboard rules: S2 specimen check, per-reaction internal controls (S3/S4), per-target calls, and lab KPIs.
// Pure functions; the UI only renders what these return. Thresholds and reaction grouping are demo values (data/lab.json, data/panel.json).
import { formatNumber } from "../format";
import { median } from "../navigator/rules";
import type { Panel, PanelTarget } from "../types";
import type { Gate, LabSample, LabThresholds, ReleasedSample, Stage, TargetCall } from "./types";

export const GATE_LABEL: Record<Gate, string> = { ok: "LULUS", warn: "TINJAU", bad: "TAHAN", wait: "MENUNGGU" };
export const GATE_TONE = { ok: "ok", warn: "warn", bad: "block", wait: "neutral" } as const;

export const CALL_LABEL: Record<TargetCall, string> = {
  terdeteksi: "Terdeteksi",
  tidak_terdeteksi: "Tidak terdeteksi",
  belum_pasti: "Belum pasti",
  tidak_terbaca: "Tidak terbaca",
};

const WORST: Gate[] = ["bad", "warn", "wait", "ok"];
function worst(gates: Gate[]): Gate {
  return WORST.find((g) => gates.includes(g)) ?? "ok";
}

function ct(value: number): string {
  return formatNumber(Math.round(value * 10) / 10);
}

// ---------- S2: specimen, decided before DNA extraction ----------

export interface S2Result {
  status: Gate;
  reasons: string[];
}

export function evaluateLabS2(s: LabSample, t: LabThresholds): S2Result {
  if (s.specimen === "FFPE" && s.block == null) {
    return { status: "wait", reasons: ["Blok belum diterima dari patologi RS pengirim."] };
  }
  const reasons: string[] = [];
  if (s.tumorPct != null && s.tumorPct < t.minTumorPct) reasons.push(`Kadar tumor ${s.tumorPct}%, di bawah ${t.minTumorPct}%.`);
  if (s.blockAgeMonths != null && s.blockAgeMonths > t.maxBlockAgeMonths) {
    reasons.push(`Blok berumur ${Math.round(s.blockAgeMonths / 12)} tahun, lebih dari ${t.maxBlockAgeMonths / 12} tahun.`);
  }
  if (s.decalcified) reasons.push("Jaringan tulang didekalsifikasi; DNA sering rusak.");
  if (s.dnaNgUl != null && s.dnaNgUl < t.minDnaNgUl) reasons.push(`DNA ${ct(s.dnaNgUl)} ng/µL, di bawah ${t.minDnaNgUl} ng/µL.`);
  if (reasons.length) return { status: "warn", reasons };
  return { status: "ok", reasons: [s.specimen === "FFPE" ? "Kadar tumor, umur blok, dan jenis jaringan memenuhi syarat." : "Plasma memenuhi syarat."] };
}

/** Intake grouping, same pattern as Mendesak / Hari ini / Rutin in the navigator dashboard. */
export const INTAKE_GROUPS: { status: Gate; label: string }[] = [
  { status: "warn", label: "Perlu dicek" },
  { status: "wait", label: "Menunggu blok" },
  { status: "ok", label: "Siap diterima" },
];

export const REJECT_REASONS = [
  "Kadar tumor kurang dari 20%, minta blok lain",
  "Identitas sampel tidak cocok dengan permintaan",
  "Blok rusak atau jaringan tidak cukup",
  "Jaringan tulang didekalsifikasi asam",
] as const;

export function suggestedRejectReason(s: LabSample, t: LabThresholds): (typeof REJECT_REASONS)[number] {
  if (s.decalcified) return REJECT_REASONS[3];
  if (s.tumorPct != null && s.tumorPct < t.minTumorPct) return REJECT_REASONS[0];
  return REJECT_REASONS[2];
}

// ---------- S3/S4: run and per-reaction internal controls ----------

export function icStatus(value: number | undefined, t: LabThresholds): Gate {
  if (value == null) return "wait";
  if (value <= t.icPassMaxCt) return "ok";
  if (value <= t.icReviewMaxCt) return "warn";
  return "bad";
}

export interface Reaction {
  id: string;
  /** "Reaksi 4" */
  label: string;
  targets: PanelTarget[];
}

export function reactions(panel: Panel): Reaction[] {
  const ids = [...new Set(panel.targets.map((t) => t.reaction))].sort();
  return ids.map((id) => ({ id, label: `Reaksi ${id.replace(/^R/, "")}`, targets: panel.targets.filter((t) => t.reaction === id) }));
}

export interface TargetCallResult {
  target: PanelTarget;
  call: TargetCall;
  reason: string;
}

export interface ReactionResult {
  reaction: Reaction;
  ct: number | undefined;
  status: Gate;
  reason: string;
  targets: TargetCallResult[];
}

/**
 * Per-target call. "Tidak terdeteksi" only when the reaction's internal control passed and the specimen is fit;
 * a failed reaction is "Tidak terbaca" and a doubtful one is "Belum pasti", never negative.
 */
export function reactionResults(s: LabSample, panel: Panel, t: LabThresholds): ReactionResult[] {
  const s2 = evaluateLabS2(s, t);
  return reactions(panel).map((r) => {
    const value = s.ic?.[r.id];
    const status = icStatus(value, t);
    const reason =
      status === "wait"
        ? "Belum ada hasil run."
        : status === "ok"
          ? `Kontrol internal Ct ${ct(value!)}, lulus (batas ${t.icPassMaxCt}).`
          : status === "warn"
            ? `Kontrol internal Ct ${ct(value!)}, zona tinjau (${t.icPassMaxCt} sampai ${t.icReviewMaxCt}).`
            : `Kontrol internal Ct ${ct(value!)}, gagal (di atas ${t.icReviewMaxCt}).`;
    const targets = r.targets.map((target): TargetCallResult => {
      if (status === "wait") return { target, call: "tidak_terbaca", reason: "Belum ada hasil run." };
      if (status === "bad") return { target, call: "tidak_terbaca", reason: `Reaksi gagal; ${target.id} tidak terbaca, bukan negatif.` };
      if (s.detected?.includes(target.id)) return { target, call: "terdeteksi", reason: `${target.id} terdeteksi.` };
      if (status === "warn") return { target, call: "belum_pasti", reason: "Kontrol internal reaksi di zona tinjau." };
      if (s2.status === "warn") return { target, call: "belum_pasti", reason: "Spesimen di bawah syarat S2; tidak terdeteksi belum pasti." };
      return { target, call: "tidak_terdeteksi", reason: "Kontrol internal lulus; alel tidak terdeteksi." };
    });
    return { reaction: r, ct: value, status, reason, targets };
  });
}

/** S4 = worst internal control across reactions. */
export function evaluateLabS4(s: LabSample, panel: Panel, t: LabThresholds): Gate {
  if (!s.ic) return "wait";
  return worst(reactionResults(s, panel, t).map((r) => r.status));
}

/** Overall sample status after the run: worst of S2 and S4. */
export function overallStatus(s: LabSample, panel: Panel, t: LabThresholds): Gate {
  if (!s.ic) return "wait";
  const s2 = evaluateLabS2(s, t).status;
  return worst([s2 === "wait" ? "ok" : s2, evaluateLabS4(s, panel, t)]);
}

export interface GateBox {
  id: "S1" | "S2" | "S3" | "S4" | "S5";
  title: string;
  detail: string;
  status: Gate;
}

export function labGates(s: LabSample, panel: Panel, t: LabThresholds): GateBox[] {
  return [
    { id: "S1", title: "S1 Klinis", detail: "Indikasi dan persetujuan dokter", status: "ok" },
    { id: "S2", title: "S2 Spesimen", detail: "Kadar tumor, umur blok, DNA", status: evaluateLabS2(s, t).status },
    { id: "S3", title: "S3 Analitik", detail: "Kontrol run (+, -, NTC)", status: s.ic ? "ok" : "wait" },
    { id: "S4", title: "S4 Varian", detail: "Kontrol internal per reaksi", status: evaluateLabS4(s, panel, t) },
    { id: "S5", title: "S5 Pelaporan", detail: "Tanda tangan patolog", status: s.stage === "rilis" ? "ok" : "wait" },
  ];
}

const SENTINEL_ORDER: Record<Gate, number> = { bad: 0, warn: 1, ok: 2, wait: 3 };

/** TAHAN first, then TINJAU, then LULUS: the sample that most needs a decision is on top. */
export function sortForSentinel(samples: LabSample[], panel: Panel, t: LabThresholds): LabSample[] {
  return [...samples].sort((a, b) => SENTINEL_ORDER[overallStatus(a, panel, t)] - SENTINEL_ORDER[overallStatus(b, panel, t)]);
}

/** One-paragraph quality note generated from the gates. */
export function sentinelNote(s: LabSample, panel: Panel, t: LabThresholds): string {
  const rx = reactionResults(s, panel, t);
  const parts: string[] = [];
  const failed = rx.filter((r) => r.status === "bad");
  const doubtful = rx.filter((r) => r.status === "warn");
  const list = (rs: ReactionResult[]) => rs.flatMap((r) => r.targets.map((x) => x.target.id)).join(", ");
  if (failed.length) {
    parts.push(
      `Kontrol internal gagal di ${failed.map((r) => `${r.reaction.label.toLowerCase()} (Ct ${ct(r.ct!)})`).join(", ")}: ${list(failed)} tidak terbaca, bukan negatif.`,
    );
  }
  if (doubtful.length) {
    parts.push(
      `Kontrol internal ${doubtful.map((r) => `${r.reaction.label.toLowerCase()} (Ct ${ct(r.ct!)})`).join(", ")} di zona tinjau: ${list(doubtful)} belum pasti, belum boleh dibaca sebagai tidak ada mutasi.`,
    );
  }
  const s2 = evaluateLabS2(s, t);
  if (s2.status === "warn") parts.push(`Spesimen: ${s2.reasons.join(" ")}`);
  if (!parts.length) parts.push("Semua kontrol dalam rentang.");
  return parts.join(" ");
}

/** Note printed with the result when the analyst forwards a TINJAU sample instead of repeating the reaction. */
export function reviewNote(s: LabSample, panel: Panel, t: LabThresholds): string | null {
  const doubtful = reactionResults(s, panel, t).filter((r) => r.targets.some((x) => x.call === "belum_pasti"));
  if (!doubtful.length) return null;
  return doubtful
    .map((r) => `${r.reaction.label} (${r.targets.map((x) => x.target.id).join(", ")}): belum pasti`)
    .join("; ");
}

/** Reactions to repeat for a TINJAU sample: only the doubtful ones, not the whole sample. */
export function reactionsToRepeat(s: LabSample, panel: Panel, t: LabThresholds): string[] {
  return reactionResults(s, panel, t)
    .filter((r) => r.status === "warn")
    .map((r) => r.reaction.label);
}

export interface ReflexOption {
  id: "blok_lain" | "ctdna" | "ngs";
  label: string;
  checked: boolean;
}

/** Lab-side follow-up suggestions (REFLEX) for a held sample. The requesting doctor decides. */
export function labReflexOptions(s: LabSample): ReflexOption[] {
  return [
    {
      id: "blok_lain",
      label: s.decalcified ? "Ulang ekstraksi dari blok lain (bukan jaringan tulang)" : "Ulang ekstraksi dari blok lain yang lebih layak",
      checked: s.specimen === "FFPE",
    },
    { id: "ctdna", label: "Tes darah (ctDNA) bila tidak ada blok lain yang layak", checked: s.specimen === "FFPE" },
    { id: "ngs", label: "Profil lebih luas (NGS) di lab rujukan", checked: s.specimen !== "FFPE" },
  ];
}

/** Pathologist summary. Wording matches the doctor report: "tidak terdeteksi pada N target", never "negatif". */
export function resultSummary(s: LabSample, panel: Panel, t: LabThresholds): string {
  const calls = reactionResults(s, panel, t).flatMap((r) => r.targets);
  const det = calls.filter((c) => c.call === "terdeteksi").map((c) => `${c.target.id} terdeteksi`);
  const unsure = calls.filter((c) => c.call === "belum_pasti").length;
  const unread = calls.filter((c) => c.call === "tidak_terbaca").length;
  const parts: string[] = [];
  if (det.length) parts.push(det.join(", "));
  else if (!unsure && !unread) parts.push(`Tidak terdeteksi pada ${panel.targets.length} target yang diperiksa`);
  else parts.push("Tidak ada mutasi terdeteksi pada target yang terbaca dengan baik");
  if (unsure) parts.push(`${unsure} target belum pasti`);
  if (unread) parts.push(`${unread} target tidak terbaca`);
  return `${parts.join("; ")}.`;
}

// ---------- runs ----------

export const RUN_STEPS = ["Ekstraksi", "Kuantifikasi", "qPCR", "Analisis"] as const;

/** Below the minimum, kit and control costs are shared by fewer samples. The lab still decides. */
export function runSizeWarning(count: number, minSamples: number): string | null {
  if (count === 0 || count >= minSamples) return null;
  return `Baru ${count} sampel. Di bawah ${minSamples} sampel per run, biaya kit dan kontrol per tes naik; pertimbangkan menunggu satu hari bila waktu tunggu pasien masih aman.`;
}

// ---------- performance ----------

function parseDay(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

/** Working days from receipt to release (receipt day not counted). */
export function workdaysBetween(fromIso: string, toIso: string): number {
  const d = parseDay(fromIso);
  const end = parseDay(toIso);
  let n = 0;
  while (d < end) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) n++;
  }
  return n;
}

export function medianTat(released: ReleasedSample[]): number | null {
  return median(released.map((r) => r.tatDays));
}

export function retestPct(retests: number, samples: number): number {
  return samples ? Math.round((retests / samples) * 100) : 0;
}

/** Why samples missed the turnaround target, grouped by cause. */
export function delayNote(released: ReleasedSample[], targetDays: number): string | null {
  const late = released.filter((r) => r.tatDays > targetDays);
  if (!late.length) return null;
  const causes = [...new Set(late.map((r) => r.delay ?? "penyebab belum dicatat"))];
  if (causes.length === 1 && late[0].delay) {
    const who = late.length === 1 ? "Satu sampel di atas target" : `${late.length} sampel di atas target sama-sama`;
    return `${who} tertunda karena ${causes[0]}. Pilihan untuk lab: jadwal run tetap dua kali seminggu, berapa pun jumlah sampelnya.`;
  }
  return `${late.length} sampel di atas target. Penyebab: ${causes.join("; ")}.`;
}

export const STAGE_LABEL: Record<Stage, string> = {
  masuk: "Sampel masuk",
  antri: "Menunggu run",
  run_b: "Draf run berikutnya",
  run: "Dalam run",
  sentinel: "Gerbang mutu SENTINEL",
  patolog: "Menunggu patolog",
  rilis: "Dirilis ke dokter",
  ditolak: "Ditolak",
  ditahan: "Ditahan, saran dikirim ke dokter",
};
