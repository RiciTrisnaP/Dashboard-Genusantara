// SENTINEL quality gate. docs/rules_spec.md section 2.
// S1 and S2 need only clinical and specimen data; S3 to S5 need a test result.
import type { Clinical, Panel, Patient, Specimen, TargetResult, TestMethod, Variant } from "../types";
import { formatNumber } from "../format";
import { THRESHOLDS as T } from "./thresholds";

export type Tone = "ok" | "warn" | "block" | "neutral";

export interface LayerResult<S extends string> {
  id: "S1" | "S2" | "S3" | "S4" | "S5";
  name: string;
  status: S;
  tone: Tone;
  reason: string;
  /** Extra lines, for example every cause of a hold. */
  details: string[];
}

// ---------- S1 Klinis ----------

export type S1Status = "LAYAK" | "KONTEKS_KURANG" | "DI_LUAR_INDIKASI";

export function evaluateS1(clinical: Clinical): LayerResult<S1Status> {
  const missing: string[] = [];
  if (clinical.diagnosisConfirmed === undefined) missing.push("konfirmasi diagnosis");
  if (!clinical.subtype) missing.push("subtipe");
  if (!clinical.stage) missing.push("stadium");
  if (clinical.priorTherapies === undefined) missing.push("riwayat terapi");

  const base = { id: "S1" as const, name: "Klinis" };
  if (clinical.diagnosisConfirmed === false) {
    return {
      ...base,
      status: "KONTEKS_KURANG",
      tone: "warn",
      reason: "Diagnosis belum terkonfirmasi; hasil tidak dapat diinterpretasi.",
      details: missing.map((m) => `Belum diisi: ${m}`),
    };
  }
  if (missing.length > 0) {
    return {
      ...base,
      status: "KONTEKS_KURANG",
      tone: "warn",
      reason: `Konteks klinis kurang: ${missing.join(", ")} belum diisi.`,
      details: missing.map((m) => `Belum diisi: ${m}`),
    };
  }
  if (clinical.subtype !== "HR+/HER2-") {
    return {
      ...base,
      status: "DI_LUAR_INDIKASI",
      tone: "warn",
      reason: `Subtipe ${clinical.subtype}: obat pada panel ini hanya berindikasi untuk HR+/HER2-. Tes tetap dapat dibaca.`,
      details: [],
    };
  }
  return {
    ...base,
    status: "LAYAK",
    tone: "ok",
    reason: `Diagnosis terkonfirmasi, ${clinical.subtype}, stadium ${clinical.stage}; konteks cukup untuk interpretasi.`,
    details: [],
  };
}

// ---------- S2 Spesimen ----------

export type S2Status = "LANJUT" | "TAHAN" | "AMBIL_ULANG";
export type S2CauseCode = "DECALCIFIED" | "DNA_DAMAGED" | "LOW_TUMOR_CONTENT" | "PLASMA_TOO_LATE";

export interface S2Result extends LayerResult<S2Status> {
  causes: { code: S2CauseCode; text: string }[];
  warnings: string[];
}

export function evaluateS2(specimen: Specimen): S2Result {
  const causes: S2Result["causes"] = [];
  const warnings: string[] = [];
  const isTissue = specimen.type === "jaringan_FFPE";

  if (isTissue && specimen.decalcified) {
    causes.push({ code: "DECALCIFIED", text: "Jaringan sudah didekalsifikasi; DNA biasanya rusak." });
  }
  if (specimen.dnaIntegrity === "rusak") {
    causes.push({ code: "DNA_DAMAGED", text: "Integritas DNA rusak." });
  }
  if (isTissue) {
    if (specimen.tumorContentPct == null) {
      warnings.push("Kadar sel tumor belum diisi.");
    } else if (specimen.tumorContentPct < T.MIN_TUMOR_CONTENT_TISSUE) {
      causes.push({
        code: "LOW_TUMOR_CONTENT",
        text: `Kadar sel tumor ${specimen.tumorContentPct}%, di bawah batas demo ${T.MIN_TUMOR_CONTENT_TISSUE}%.`,
      });
    }
  }
  if (!isTissue && specimen.plasmaProcessingHours != null) {
    const h = specimen.plasmaProcessingHours;
    if (h > T.PLASMA_RESAMPLE_HOURS) {
      causes.push({
        code: "PLASMA_TOO_LATE",
        text: `Plasma diproses ${h} jam setelah pengambilan, lebih dari ${T.PLASMA_RESAMPLE_HOURS} jam.`,
      });
    } else if (h > T.MAX_PLASMA_PROCESSING_HOURS) {
      warnings.push(`Plasma diproses ${h} jam setelah pengambilan, lebih dari ${T.MAX_PLASMA_PROCESSING_HOURS} jam; mutu bisa turun.`);
    }
  }

  const base = { id: "S2" as const, name: "Spesimen" };
  const specimenLabel = describeSpecimen(specimen);
  if (causes.some((c) => c.code === "PLASMA_TOO_LATE")) {
    return {
      ...base,
      status: "AMBIL_ULANG",
      tone: "block",
      reason: `${specimenLabel}: sampel harus diambil ulang.`,
      details: [...causes.map((c) => c.text), ...warnings],
      causes,
      warnings,
    };
  }
  if (causes.length > 0) {
    return {
      ...base,
      status: "TAHAN",
      tone: "block",
      reason: `${specimenLabel}: mutu spesimen belum cukup (${causes.length} penyebab).`,
      details: [...causes.map((c) => c.text), ...warnings],
      causes,
      warnings,
    };
  }
  return {
    ...base,
    status: "LANJUT",
    tone: warnings.length > 0 ? "warn" : "ok",
    reason:
      warnings.length > 0
        ? `${specimenLabel}: boleh lanjut dengan catatan.`
        : `${specimenLabel}: mutu spesimen cukup.`,
    details: warnings,
    causes,
    warnings,
  };
}

export function describeSpecimen(specimen: Specimen): string {
  if (specimen.type === "plasma_ctDNA") return "Plasma ctDNA (darah)";
  const parts = [`Jaringan FFPE${specimen.site ? ` dari ${specimen.site}` : ""}`];
  if (specimen.tumorContentPct != null) parts.push(`sel tumor ${specimen.tumorContentPct}%`);
  return parts.join(", ");
}

// ---------- S3 Analitik ----------

export type S3Status = "TERBACA" | "SEBAGIAN" | "TAHAN";

export interface TargetReadout {
  /** Panel target id, for example "PIK3CA H1047R". */
  target: string;
  gene: string;
  codon: string;
  allele: string;
  site: string;
  readable: boolean;
  depth?: number;
  internalControlPass?: boolean;
  reason: string;
}

export interface S3Result extends LayerResult<S3Status> {
  readouts: TargetReadout[];
  readableCount: number;
  totalTargets: number;
  unreadable: string[];
}

function readTarget(method: TestMethod, result: TargetResult | undefined): { readable: boolean; reason: string } {
  if (!result) return { readable: false, reason: "Tidak ada data untuk target ini." };
  if (method === "PCR") {
    return result.internalControlPass
      ? { readable: true, reason: "Kontrol internal lulus." }
      : { readable: false, reason: "Kontrol internal gagal." };
  }
  if (result.depth == null) return { readable: false, reason: "Cakupan baca tidak tercatat." };
  return result.depth >= T.MIN_DEPTH
    ? { readable: true, reason: `Cakupan ${result.depth}x.` }
    : { readable: false, reason: `Cakupan ${result.depth}x, di bawah ${T.MIN_DEPTH}x.` };
}

export function evaluateS3(method: TestMethod, targets: TargetResult[], panel: Panel): S3Result {
  const readouts: TargetReadout[] = panel.targets.map((t) => {
    // Read quality is recorded per codon site; every allele at that site shares it.
    const result = targets.find((r) => r.target === t.site) ?? targets.find((r) => r.target === t.id);
    const { readable, reason } = readTarget(method, result);
    return {
      target: t.id,
      gene: t.gene,
      codon: t.codon,
      allele: t.allele,
      site: t.site,
      readable,
      depth: result?.depth,
      internalControlPass: result?.internalControlPass,
      reason,
    };
  });
  const unreadable = readouts.filter((r) => !r.readable).map((r) => r.target);
  const total = readouts.length;
  const readableCount = total - unreadable.length;
  const base = { id: "S3" as const, name: "Analitik", readouts, readableCount, totalTargets: total, unreadable };
  const counts = `${readableCount} dari ${total} target terbaca`;

  if (unreadable.length === 0) {
    return { ...base, status: "TERBACA", tone: "ok", reason: `Semua target terbaca (${counts}).`, details: [] };
  }
  if (unreadable.length <= T.MAX_UNREADABLE_BEFORE_HOLD) {
    return {
      ...base,
      status: "SEBAGIAN",
      tone: "warn",
      reason: `${counts}. Tidak dinilai: ${unreadable.join(", ")}.`,
      details: [],
    };
  }
  return {
    ...base,
    status: "TAHAN",
    tone: "block",
    reason: `Hanya ${counts}; lebih dari ${T.MAX_UNREADABLE_BEFORE_HOLD} target tidak terbaca. Tidak dinilai: ${unreadable.join(", ")}.`,
    details: [],
  };
}

// ---------- S4 Varian ----------

export type VariantCall = "LULUS" | "TINJAU";

export interface VariantReadout {
  variant: Variant;
  key: string;
  target: string;
  call: VariantCall;
  reason: string;
}

export interface S4Result extends LayerResult<"LULUS" | "TINJAU" | "TIDAK_ADA_VARIAN"> {
  variants: VariantReadout[];
  passed: VariantReadout[];
}

export function variantKey(v: Pick<Variant, "gene" | "protein">): string {
  return `${v.gene} ${v.protein}`;
}

/** "PIK3CA" + "H1047R" -> "PIK3CA H1047" (the codon-level panel target). */
export function variantTarget(v: Pick<Variant, "gene" | "protein">): string {
  const m = /^([A-Z])(\d+)/.exec(v.protein);
  return m ? `${v.gene} ${m[1]}${m[2]}` : `${v.gene} ${v.protein}`;
}

export function evaluateS4(variants: Variant[], specimen: Specimen, panel?: Panel): S4Result {
  const isPlasma = specimen.type === "plasma_ctDNA";
  const minVaf = isPlasma ? T.MIN_VAF_PLASMA : T.MIN_VAF_TISSUE;
  const panelIds = panel ? new Set(panel.targets.map((t) => t.id)) : null;
  const readouts: VariantReadout[] = variants.map((v) => {
    const problems: string[] = [];
    if (panelIds && !panelIds.has(variantKey(v))) problems.push(`alel tidak termasuk panel ${panel?.shortName}`);
    if (v.vaf < minVaf) problems.push(`VAF ${formatNumber(v.vaf)}% di bawah ${formatNumber(minVaf)}% (${isPlasma ? "plasma" : "jaringan"})`);
    if (v.altReads < T.MIN_ALT_READS) problems.push(`hanya ${v.altReads} baca pendukung (minimum ${T.MIN_ALT_READS})`);
    return {
      variant: v,
      key: variantKey(v),
      target: panelIds?.has(variantKey(v)) ? variantKey(v) : variantTarget(v),
      call: problems.length ? "TINJAU" : "LULUS",
      reason: problems.length
        ? `Perlu ditinjau: ${problems.join("; ")}.`
        : `VAF ${formatNumber(v.vaf)}%, ${v.altReads} baca pendukung.`,
    };
  });
  const passed = readouts.filter((r) => r.call === "LULUS");
  const review = readouts.filter((r) => r.call === "TINJAU");
  const base = { id: "S4" as const, name: "Varian", variants: readouts, passed };

  if (readouts.length === 0) {
    return {
      ...base,
      status: "TIDAK_ADA_VARIAN",
      tone: "neutral",
      reason: "Tidak ada varian yang dipanggil pada target yang terbaca.",
      details: [],
    };
  }
  if (review.length > 0) {
    return {
      ...base,
      status: "TINJAU",
      tone: "warn",
      reason: `${passed.length} varian lulus, ${review.length} perlu ditinjau. Hanya varian lulus yang masuk TRIASE.`,
      details: review.map((r) => `${r.key}: ${r.reason}`),
    };
  }
  return {
    ...base,
    status: "LULUS",
    tone: "ok",
    reason: `${passed.length} varian lulus: ${passed.map((p) => p.key).join(", ")}.`,
    details: [],
  };
}

// ---------- S5 Pelaporan ----------

export type S5Status = "DRAF" | "TERBIT" | "ULANG";

export const EVIDENCE_VERSION = "OncoKB v7.6 (data 30 Sep 2026), CIViC dan ClinVar, dicek 23 Okt 2026";

export function evaluateS5(verdict: Verdict, signedOff: boolean, accessCheckedDate: string): LayerResult<S5Status> {
  const base = { id: "S5" as const, name: "Pelaporan" };
  const details = [`Basis bukti: ${EVIDENCE_VERSION}`, `Cek akses obat: ${accessCheckedDate}`];
  if (verdict !== "LANJUT") {
    return {
      ...base,
      status: "ULANG",
      tone: "block",
      reason: "Laporan terapi tidak diterbitkan karena mutu belum cukup.",
      details,
    };
  }
  if (signedOff) {
    return { ...base, status: "TERBIT", tone: "ok", reason: "Laporan sudah ditandatangani dokter (simulasi).", details };
  }
  return { ...base, status: "DRAF", tone: "warn", reason: "Draf, menunggu tanda tangan dokter.", details };
}

// ---------- Overall ----------

export type Verdict = "LANJUT" | "TAHAN" | "AMBIL_ULANG";

export const NOT_NEGATIVE_WARNING = 'Hasil tidak boleh dibaca sebagai "tidak ada mutasi".';

export type SentinelResult =
  | {
      tested: false;
      s1: LayerResult<S1Status>;
      reason: string;
    }
  | {
      tested: true;
      s1: LayerResult<S1Status>;
      s2: S2Result;
      s3: S3Result;
      s4: S4Result;
      verdict: Verdict;
      reason: string;
      /** Set when the verdict is not LANJUT. */
      warning?: string;
    };

export function evaluateSentinel(patient: Patient, panel: Panel): SentinelResult {
  const s1 = evaluateS1(patient.clinical);
  const test = patient.molecularTest;
  if (!test.done) {
    return { tested: false, s1, reason: "Belum ada spesimen dan hasil tes; S2 sampai S5 belum dapat dinilai." };
  }
  const s2 = evaluateS2(test.specimen);
  const s3 = evaluateS3(test.method, test.targets, panel);
  const s4 = evaluateS4(test.variants, test.specimen, panel);

  let verdict: Verdict;
  let reason: string;
  if (s2.status === "AMBIL_ULANG") {
    verdict = "AMBIL_ULANG";
    reason = `Ambil ulang sampel. ${s2.causes.map((c) => c.text).join(" ")}`;
  } else if (s2.status === "TAHAN" || s3.status === "TAHAN") {
    verdict = "TAHAN";
    const causes = [...s2.causes.map((c) => c.text)];
    if (s3.status === "TAHAN") causes.push(`Hanya ${s3.readableCount} dari ${s3.totalTargets} target terbaca.`);
    reason = `Hasil ditahan. ${causes.join(" ")}`;
  } else {
    verdict = "LANJUT";
    const notes: string[] = [];
    if (s3.status === "SEBAGIAN") notes.push(`${s3.unreadable.length} target tidak dinilai`);
    if (s1.status !== "LAYAK") notes.push("catatan klinis pada S1");
    if (s2.warnings.length) notes.push("catatan spesimen pada S2");
    reason = notes.length
      ? `Mutu cukup untuk dibaca, dengan catatan: ${notes.join(", ")}.`
      : "Mutu cukup; hasil boleh dibaca.";
  }

  return {
    tested: true,
    s1,
    s2,
    s3,
    s4,
    verdict,
    reason,
    warning: verdict === "LANJUT" ? undefined : NOT_NEGATIVE_WARNING,
  };
}
