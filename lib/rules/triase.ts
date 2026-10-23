// TRIASE therapy report. docs/rules_spec.md section 4.
import type { Clinical, DrugAccess, DrugAccessFile, EvidenceRecord } from "../types";
import { formatDate, formatRupiah } from "../format";
import { classifyVariant, ESR1_SPECIFIC_DRUGS, type IndicationRule, type VariantEvidence } from "./evidence";
import { EVIDENCE_VERSION, type SentinelResult, type VariantReadout } from "./sentinel";

export type TherapyGroupId = "A" | "B" | "C";

export const GROUP_TITLES: Record<TherapyGroupId, string> = {
  A: "Sesuai dan tersedia",
  B: "Sesuai tetapi belum terdaftar / tidak tersedia",
  C: "Tidak sesuai",
};

export const REPORT_FOOTER =
  "Laporan draf berbasis aturan untuk dokter. Keputusan terapi tetap pada dokter. SIMULASI.";

export interface TherapyOption {
  drug: string;
  brand: string | null;
  regimen: string;
  /** OncoKB level ("1", "2"), or null for the fulvestrant fallback. */
  level: string | null;
  supportingVariants: string[];
  group: TherapyGroupId;
  /** Short status shown as a label, for example "Belum terdaftar di BPOM". */
  statusLabel: string;
  reason: string;
  bpomText: string;
  jknText: string;
  jknCovered: boolean;
  priceText: string;
  price: number | null;
  accessCheckedDate: string;
  indicationNote?: string;
  isFallback?: boolean;
  researchLevelOnly?: boolean;
}

export interface VariantFinding {
  readout: VariantReadout;
  evidence: VariantEvidence;
}

export type TriaseResult =
  | { issued: false; reason: string; warning?: string }
  | {
      issued: true;
      findings: VariantFinding[];
      reviewVariants: VariantReadout[];
      notAssessed: string[];
      /** Set when no actionable variant was found. */
      noActionableText?: string;
      groups: Record<TherapyGroupId, TherapyOption[]>;
      evidenceVersion: string;
      accessCheckedDate: string;
      footer: string;
    };

// ---------- access text helpers ----------

export function bpomText(a: DrugAccess | undefined): string {
  if (!a) return "Belum dinilai";
  const s = a.bpom.status;
  if (s === "terdaftar") {
    if (a.bpom.validFrom && a.bpom.validUntil) {
      return `Terdaftar BPOM (${formatDate(a.bpom.validFrom)} s.d. ${formatDate(a.bpom.validUntil)})`;
    }
    if (a.bpom.validUntil) return `Terdaftar BPOM (berlaku s.d. ${formatDate(a.bpom.validUntil)})`;
    return "Terdaftar BPOM";
  }
  if (s === "tidak ditemukan") return "Tidak ditemukan di BPOM";
  return capitalize(s);
}

export function isJknCovered(a: DrugAccess | undefined): boolean {
  if (!a) return false;
  const s = a.jkn.status.toLowerCase();
  return s.includes("fornas") && !s.includes("tidak");
}

export function jknText(a: DrugAccess | undefined): string {
  if (!a) return "Belum dinilai";
  const s = a.jkn.status;
  if (isJknCovered(a)) return `Dijamin JKN: ${s}`;
  if (s.toLowerCase().startsWith("tidak")) return `Tidak dijamin JKN (${s})`;
  if (s === "-" || s.trim() === "") return "Tidak ada data JKN";
  return `JKN: ${s}`;
}

export function priceText(a: DrugAccess | undefined): string {
  if (!a) return "Belum dinilai";
  const m = a.market;
  if (m.price != null) {
    return `${formatRupiah(m.price)}${m.unit ? ` ${m.unit}` : ""}${m.source ? ` (${m.source})` : ""}`;
  }
  if (m.found === false) return m.note ? capitalize(m.note) : "Tidak ditemukan di pasar";
  if (m.found === true) return "Ada di pasar; harga belum dicek";
  return "Harga belum dicek";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const FALLBACK_REGIMENS: Record<string, string> = {
  vepdegestrant: "vepdegestrant",
};

// ---------- grouping ----------

function levelRank(level: string | null): number {
  if (!level) return 99;
  const m = /^(\d)([AB])?$/.exec(level);
  if (!m) return 98;
  return Number(m[1]) * 2 + (m[2] === "B" ? 1 : 0);
}

export function sortOptions(options: TherapyOption[]): TherapyOption[] {
  return [...options].sort((a, b) => {
    const byLevel = levelRank(a.level) - levelRank(b.level);
    if (byLevel !== 0) return byLevel;
    const pa = a.price ?? Number.POSITIVE_INFINITY;
    const pb = b.price ?? Number.POSITIVE_INFINITY;
    return pa - pb;
  });
}

function accessFields(a: DrugAccess | undefined, checked: string) {
  return {
    // "-" and "(...)" placeholders in drug_access.json mean the brand is not confirmed.
    brand: a && a.brand !== "-" && !a.brand.startsWith("(") ? a.brand : null,
    bpomText: bpomText(a),
    jknText: jknText(a),
    jknCovered: isJknCovered(a),
    priceText: priceText(a),
    price: a?.market.price ?? null,
    accessCheckedDate: checked,
  };
}

function groupByAccess(a: DrugAccess | undefined): { group: TherapyGroupId; statusLabel: string } {
  switch (a?.accessGroup) {
    case "tersedia":
      return { group: "A", statusLabel: "Tersedia" };
    case "terdaftar_tidak_di_pasar":
      return { group: "B", statusLabel: "Terdaftar BPOM, tidak ditemukan di pasar" };
    case "belum_terdaftar":
      return { group: "B", statusLabel: "Belum terdaftar di BPOM" };
    default:
      return { group: "B", statusLabel: "Status akses belum dinilai" };
  }
}

interface Candidate {
  drug: string;
  level: string;
  variants: string[];
  indication: IndicationRule;
  indicationNote?: string;
  researchLevelOnly?: boolean;
}

export function buildTherapyOptions(
  findings: VariantFinding[],
  clinical: Clinical,
  access: DrugAccessFile,
): Record<TherapyGroupId, TherapyOption[]> {
  const checked = formatDate(access.checkedDate);
  const byDrug = new Map<string, Candidate>();

  for (const f of findings) {
    if (!f.evidence.actionable || !f.evidence.indication) continue;
    for (const d of f.evidence.drugs) {
      const existing = byDrug.get(d.drug);
      if (existing) {
        existing.variants.push(f.evidence.key);
        if (levelRank(d.level) < levelRank(existing.level)) existing.level = d.level;
      } else {
        byDrug.set(d.drug, {
          drug: d.drug,
          level: d.level,
          variants: [f.evidence.key],
          indication: f.evidence.indication,
          indicationNote: d.indicationNote,
          researchLevelOnly: f.evidence.researchLevelOnly,
        });
      }
    }
  }

  const options: TherapyOption[] = [];
  for (const c of byDrug.values()) {
    const a = access.drugs.find((x) => x.drug === c.drug);
    const regimen = a?.regimen ?? FALLBACK_REGIMENS[c.drug] ?? c.drug;
    const unmet = c.indication.unmet(clinical);
    const common = {
      drug: c.drug,
      regimen,
      level: c.level,
      supportingVariants: c.variants,
      indicationNote: c.indicationNote,
      researchLevelOnly: c.researchLevelOnly,
      ...accessFields(a, checked),
    };
    if (unmet.length > 0) {
      options.push({
        ...common,
        group: "C",
        statusLabel: "Tidak sesuai",
        reason: `${unmet.join(". ")}.`,
        indicationNote: undefined,
      });
      continue;
    }
    const { group, statusLabel } = groupByAccess(a);
    options.push({
      ...common,
      group,
      statusLabel,
      reason: `Sesuai indikasi (${c.indication.text}). ${statusLabel}.`,
    });
  }

  // Fulvestrant fallback when ESR1 was found and no ESR1-specific drug is available.
  const hasEsr1 = findings.some((f) => f.evidence.variantClass === "ESR1_LBD");
  const esr1Options = options.filter((o) => ESR1_SPECIFIC_DRUGS.includes(o.drug));
  if (hasEsr1 && esr1Options.length > 0 && esr1Options.every((o) => o.group === "B")) {
    const a = access.drugs.find((x) => x.drug === "fulvestrant");
    options.push({
      drug: "fulvestrant",
      regimen: a?.regimen ?? "fulvestrant",
      level: null,
      supportingVariants: [],
      group: "A",
      statusLabel: "Pilihan endokrin yang tersedia; bukan terapi khusus ESR1",
      reason: "Semua obat khusus ESR1 belum tersedia di Indonesia; fulvestrant adalah pilihan endokrin yang tersedia.",
      isFallback: true,
      ...accessFields(a, checked),
    });
  }

  return {
    A: sortOptions(options.filter((o) => o.group === "A")),
    B: sortOptions(options.filter((o) => o.group === "B")),
    C: sortOptions(options.filter((o) => o.group === "C")),
  };
}

// ---------- report ----------

export function noActionableText(readableCount: number, totalTargets: number): string {
  if (readableCount === totalTargets) {
    return `Tidak terdeteksi varian yang dapat ditindaklanjuti pada ${totalTargets} target yang diperiksa.`;
  }
  return `Tidak terdeteksi varian yang dapat ditindaklanjuti pada ${readableCount} target yang terbaca (dari ${totalTargets} target panel). Target lain tidak dinilai.`;
}

export function evaluateTriase(
  sentinel: SentinelResult,
  clinical: Clinical,
  evidenceRecords: EvidenceRecord[],
  access: DrugAccessFile,
): TriaseResult {
  if (!sentinel.tested) {
    return { issued: false, reason: "Belum ada hasil tes; laporan terapi belum dapat dibuat." };
  }
  if (sentinel.verdict !== "LANJUT") {
    return {
      issued: false,
      reason: `Laporan terapi tidak diterbitkan: SENTINEL ${sentinel.verdict.replace("_", " ")}.`,
      warning: sentinel.warning,
    };
  }

  const findings: VariantFinding[] = sentinel.s4.passed.map((readout) => ({
    readout,
    evidence: classifyVariant(readout.variant, evidenceRecords),
  }));
  const reviewVariants = sentinel.s4.variants.filter((v) => v.call === "TINJAU");
  const anyActionable = findings.some((f) => f.evidence.actionable);

  return {
    issued: true,
    findings,
    reviewVariants,
    notAssessed: sentinel.s3.unreadable,
    noActionableText: anyActionable ? undefined : noActionableText(sentinel.s3.readableCount, sentinel.s3.totalTargets),
    groups: buildTherapyOptions(findings, clinical, access),
    evidenceVersion: EVIDENCE_VERSION,
    accessCheckedDate: formatDate(access.checkedDate),
    footer: REPORT_FOOTER,
  };
}
