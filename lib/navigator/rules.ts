// Pure rules for the nurse navigator dashboard (docs: NUSA11 Dashboard navigator, v1, 25 Okt 2026).
// The navigator never sees variants and never suggests treatment: it shows status, keeps safety locks,
// and routes danger signs to the doctor on call.
import { getPatient } from "../data";
import { formatNumber } from "../format";
import { runCase } from "../rules";
import { NOT_NEGATIVE_WARNING } from "../rules/sentinel";
import type { Tone } from "../rules/sentinel";
import type {
  Checkin,
  CheckinAnswers,
  ConsentKind,
  ConsentStatus,
  Journey,
  NavPatient,
  SummaryStatus,
  Task,
  Urgency,
} from "./types";

// ---------- labels ----------

/** Stage line shown on the patient detail: Tes, Hasil, Konsultasi hasil, Didampingi, Selesai. */
export const STAGE_LINE = ["Tes", "Hasil", "Konsultasi hasil", "Didampingi", "Selesai"] as const;

export const JOURNEY_LABEL: Record<Journey, string> = {
  menunggu_tes: "Menunggu tes",
  menunggu_hasil: "Menunggu hasil",
  menunggu_konsultasi: "Menunggu konsultasi",
  didampingi: "Didampingi",
  selesai: "Selesai",
};

/** Index into STAGE_LINE for the current journey step. */
export function stageIndex(j: Journey): number {
  return { menunggu_tes: 0, menunggu_hasil: 1, menunggu_konsultasi: 2, didampingi: 3, selesai: 4 }[j];
}

export const CONSENT_LABEL: Record<ConsentKind, string> = {
  pendampingan: "Pendampingan navigator",
  whatsapp: "Kontak WhatsApp dari nomor RS",
  registri: "Data untuk registri",
  germline: "Data germline (bila dirujuk)",
};

export const CONSENT_STATUS_LABEL: Record<ConsentStatus, string> = { ya: "Ya", belum: "Belum", tidak_berlaku: "Tidak berlaku" };

export const SUMMARY_LABEL: Record<SummaryStatus, string> = {
  belum_ada: "Belum ada hasil",
  menunggu_dokter: "Menunggu dokter menjelaskan hasil",
  dirilis: "Dirilis dokter, siap diserahkan",
  diserahkan: "Sudah diserahkan",
};

export const URGENCY_LABEL: Record<Urgency, string> = { mendesak: "Mendesak", hari_ini: "Hari ini", rutin: "Rutin" };

// ---------- check-in flagging (thresholds are DEMO assumptions; align with the hospital's escalation SOP) ----------

export type CheckinFlag = "mendesak" | "dipantau" | "normal";

export const CHECKIN_THRESHOLDS = {
  FEVER_URGENT_C: 38.0,
  FEVER_WATCH_C: 37.5,
  DIARRHEA_URGENT_PER_DAY: 7,
  DIARRHEA_WATCH_PER_DAY: 4,
} as const;

export const LEMAS_LABEL = ["Tidak", "Ringan", "Sedang", "Berat (sulit beraktivitas)"] as const;
export const RUAM_LABEL = { tidak: "Tidak", ringan: "Ringan", luas: "Luas" } as const;

export interface FlagResult {
  flag: CheckinFlag;
  tone: Tone;
  label: string;
  reasons: string[];
}

export function flagCheckin(a: CheckinAnswers): FlagResult {
  const T = CHECKIN_THRESHOLDS;
  const urgent: string[] = [];
  const watch: string[] = [];

  if (a.demamC != null && a.demamC >= T.FEVER_URGENT_C) urgent.push(`Demam ${formatNumber(a.demamC)}°C`);
  else if (a.demamC != null && a.demamC >= T.FEVER_WATCH_C) watch.push(`Suhu ${formatNumber(a.demamC)}°C`);

  if (a.diarePerHari >= T.DIARRHEA_URGENT_PER_DAY) urgent.push(`Diare ${a.diarePerHari} kali sehari`);
  else if (a.diarePerHari >= T.DIARRHEA_WATCH_PER_DAY) watch.push(`Diare ${a.diarePerHari} kali sehari`);

  if (a.ruam === "luas") urgent.push("Ruam luas");
  else if (a.ruam === "ringan") watch.push("Ruam ringan");

  if (a.lemas === 3) urgent.push("Lemas berat, sulit beraktivitas");
  else if (a.lemas === 2) watch.push("Lemas sedang");

  if (a.sangatHaus) watch.push("Sangat haus");

  if (urgent.length > 0) return { flag: "mendesak", tone: "block", label: "Mendesak", reasons: [...urgent, ...watch] };
  if (watch.length > 0) return { flag: "dipantau", tone: "warn", label: "Perlu dipantau", reasons: watch };
  return { flag: "normal", tone: "ok", label: "Normal", reasons: ["Tidak ada tanda yang perlu ditindaklanjuti"] };
}

export type CheckinState = "baru" | "ditinjau" | "dieskalasi";

export function checkinState(c: Checkin): CheckinState {
  if (c.escalatedAt) return "dieskalasi";
  if (c.reviewedAt) return "ditinjau";
  return "baru";
}

/** Open urgent check-ins: the only thing that turns the nav badge red. */
export function openUrgentCount(checkins: Checkin[]): number {
  return checkins.filter((c) => checkinState(c) === "baru" && flagCheckin(c.answers).flag === "mendesak").length;
}

/** Newest first; within the same time, urgent first. */
export function sortCheckins(checkins: Checkin[]): Checkin[] {
  const rank: Record<CheckinFlag, number> = { mendesak: 0, dipantau: 1, normal: 2 };
  return [...checkins].sort((a, b) => {
    const open = Number(checkinState(a) !== "baru") - Number(checkinState(b) !== "baru");
    if (open !== 0) return open;
    const f = rank[flagCheckin(a.answers).flag] - rank[flagCheckin(b.answers).flag];
    if (f !== 0) return f;
    return b.at.localeCompare(a.at);
  });
}

// ---------- test and sample status (no variant data for the nurse) ----------

export interface GateView {
  status: "belum_dites" | "lulus" | "tinjau" | "ditahan";
  tone: Tone;
  label: string;
  detail: string;
  /** Next step for the nurse (coordination only; clinical decisions stay with the doctor). */
  next?: string;
  warning?: string;
}

export function gateView(p: NavPatient): GateView {
  if (p.gate) {
    const g = p.gate;
    if (g.status === "ditahan") {
      return { status: "ditahan", tone: "block", label: "Ditahan", detail: `${g.readable} dari ${g.total} target terbaca.`, warning: NOT_NEGATIVE_WARNING };
    }
    return {
      status: g.status,
      tone: g.status === "lulus" ? "ok" : "warn",
      label: g.status === "lulus" ? "Lulus mutu" : "Perlu ditinjau",
      detail: `${g.readable} dari ${g.total} target terbaca.`,
    };
  }
  const base = getPatient(p.id);
  if (!base) return { status: "belum_dites", tone: "neutral", label: "Belum dites", detail: "Tidak ada data tes." };
  const r = runCase(base);
  if (!r.sentinel.tested) {
    return {
      status: "belum_dites",
      tone: "neutral",
      label: "Belum dites",
      detail: "Sampel belum diambil.",
      next: r.trigger.suggestedSpecimen,
    };
  }
  const s = r.sentinel;
  const read = `${s.s3.readableCount} dari ${s.s3.totalTargets} target terbaca.`;
  if (s.verdict !== "LANJUT") {
    const advice = r.reflex.items.find((i) => i.id === "MUTU_GAGAL")?.advice[0];
    return {
      status: "ditahan",
      tone: "block",
      label: "Ditahan",
      detail: read,
      next: advice ? `Saran tes lanjutan (menunggu persetujuan dokter): ${advice}` : undefined,
      warning: NOT_NEGATIVE_WARNING,
    };
  }
  if (s.s3.status === "SEBAGIAN" || s.s4.status === "TINJAU") {
    return { status: "tinjau", tone: "warn", label: "Perlu ditinjau", detail: `${read} Dokter meninjau bagian yang tidak dinilai.` };
  }
  return { status: "lulus", tone: "ok", label: "Lulus mutu", detail: read };
}

// ---------- safety locks ----------

export function canSendWhatsApp(p: NavPatient): { ok: boolean; reason: string } {
  return p.consents.whatsapp === "ya"
    ? { ok: true, reason: "Persetujuan kontak WhatsApp tercatat." }
    : { ok: false, reason: "Persetujuan kontak WhatsApp belum ada. Catat persetujuan dari formulir RS dulu, atau hubungi lewat telepon." };
}

export function canHandOverSummary(s: SummaryStatus): { ok: boolean; reason: string } {
  switch (s) {
    case "dirilis":
      return { ok: true, reason: "Dokter sudah merilis ringkasan. Serahkan sebagai dokumen, bukan lewat chat." };
    case "diserahkan":
      return { ok: false, reason: "Ringkasan sudah diserahkan." };
    case "menunggu_dokter":
      return { ok: false, reason: "Terkunci sampai dokter menjelaskan hasil dan merilis ringkasan." };
    default:
      return { ok: false, reason: "Belum ada hasil." };
  }
}

// ---------- tasks ----------

export const URGENCY_ORDER: Urgency[] = ["mendesak", "hari_ini", "rutin"];

export function groupTasks(tasks: Task[]): Record<Urgency, Task[]> {
  return {
    mendesak: tasks.filter((t) => t.urgency === "mendesak"),
    hari_ini: tasks.filter((t) => t.urgency === "hari_ini"),
    rutin: tasks.filter((t) => t.urgency === "rutin"),
  };
}

function parseDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Adds working days (Monday to Friday). */
export function addWorkdays(iso: string, n: number): string {
  const d = parseDay(iso);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d.toISOString().slice(0, 10);
}

/** Overdue = still open more than 1 working day after its due date. */
export function isOverdue(task: Task, today: string, done: boolean): boolean {
  return !done && addWorkdays(task.due, 1) < today.slice(0, 10);
}

// ---------- performance ----------

export const MINUTES_LIMIT = 90;
export const RESPONSE_STANDARD_HOURS = 4;

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function contactsInMonth(patients: NavPatient[], month: string): number {
  return patients.reduce((n, p) => n + p.contacts.filter((c) => c.at.startsWith(month) && c.channel !== "eskalasi").length, 0);
}

// ---------- message templates (results are never sent through chat) ----------

export interface MessageTemplate {
  id: "checkin" | "jadwal" | "kabar";
  label: string;
  body: (p: NavPatient) => string;
}

function firstName(p: NavPatient): string {
  return p.displayName.replace(/\s*\(simulasi\)\s*$/, "");
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "checkin",
    label: "Check-in gejala",
    body: (p) =>
      `${firstName(p)}, bagaimana kondisi Ibu minggu ini? Mohon jawab singkat:\n1. Demam 38°C atau lebih?\n2. Diare lebih dari 3 kali sehari?\n3. Ruam kulit?\n4. Sangat haus atau sering buang air kecil?\n5. Lemas sampai sulit beraktivitas?`,
  },
  {
    id: "jadwal",
    label: "Pengingat jadwal",
    body: (p) =>
      `Selamat pagi ${firstName(p)}, ini pengingat jadwal kontrol dengan ${p.dpjp} pada Kamis, 29 Okt pukul 10.00 di RS.\nBalas YA untuk konfirmasi, atau UBAH bila perlu jadwal lain.`,
  },
  {
    id: "kabar",
    label: "Kabar hasil",
    body: (p) =>
      `${firstName(p)}, pemeriksaan Ibu sedang diproses atau ditinjau dokter.\nDokter akan menjelaskan hasilnya langsung saat konsultasi; hasil tidak dikirim lewat pesan ini.`,
  },
];
