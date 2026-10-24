// Types for the static demo data in data/. Shapes follow the JSON files exactly.

// ---------- data/patients.json ----------

export type Subtype = "HR+/HER2-" | "HR+/HER2+" | "HR-/HER2+" | "triple-negatif" | (string & {});
export type Setting = "metastatik" | "kambuh" | "dini" | (string & {});
export type SpecimenType = "jaringan_FFPE" | "plasma_ctDNA";
export type DnaIntegrity = "baik" | "sedang" | "rusak";
export type TestMethod = "NGS_amplikon" | "PCR";

export interface Clinical {
  diagnosisConfirmed?: boolean;
  histology?: string;
  subtype?: Subtype;
  er?: string;
  pr?: string;
  her2?: string;
  stage?: string;
  setting?: Setting;
  priorTherapies?: string[];
  progressedOnEndocrine?: boolean;
  familyHistory?: string;
}

export interface Specimen {
  type: SpecimenType;
  site?: string;
  tumorContentPct?: number | null;
  decalcified?: boolean;
  dnaIntegrity?: DnaIntegrity;
  plasmaProcessingHours?: number;
}

export interface TargetResult {
  target: string;
  depth?: number;
  internalControlPass?: boolean;
}

export interface Variant {
  gene: string;
  protein: string;
  vaf: number;
  altReads: number;
}

export type MolecularTest =
  | { done: false }
  | {
      done: true;
      date: string;
      method: TestMethod;
      specimen: Specimen;
      targets: TargetResult[];
      variants: Variant[];
    };

export interface Patient {
  id: string;
  displayName: string;
  age: number;
  clinical: Clinical;
  molecularTest: MolecularTest;
  /** Expected demo outcome, written by the team. Used by tests only, never by the UI. */
  expected?: Record<string, unknown>;
}

export interface PatientsFile {
  _note: string;
  patients: Patient[];
}

// ---------- data/panel.json ----------

export interface PanelTarget {
  rank: number;
  /** Reported target, for example "PIK3CA H1047R" (allele-level panel). */
  id: string;
  gene: string;
  codon: string;
  allele: string;
  /** Codon-level site the read quality is measured at, matching TargetResult.target ("PIK3CA H1047"). */
  site: string;
  amplicon: number | null;
}

export interface Panel {
  name: string;
  shortName: string;
  unit: string;
  targets: PanelTarget[];
}

// ---------- data/drug_access.json ----------

export type AccessGroup = "tersedia" | "terdaftar_tidak_di_pasar" | "belum_terdaftar" | "belum_dinilai";

export interface DrugAccess {
  drug: string;
  brand: string;
  company?: string;
  regimen: string;
  bpom: { status: string; validFrom?: string; validUntil?: string };
  jkn: { status: string; source?: string };
  market: { found: boolean | null; price?: number; unit?: string; source?: string; note?: string };
  accessGroup: AccessGroup;
}

export interface DrugAccessFile {
  _note: string;
  checkedDate: string;
  drugs: DrugAccess[];
}

// ---------- data/evidence_check.json (generated from the CSV) ----------

export interface EvidenceRecord {
  variant: string;
  oncokb: {
    oncogenicity: string;
    /** "1", "2", "3A"... or null when OncoKB gives no level (for example Inconclusive). */
    highestLevelBreast: string | null;
    levelNote: string | null;
    drugsBreast: string | null;
    link: string | null;
  };
  civic: {
    molecularProfile: string | null;
    note: string | null;
    bestPredictiveAny: string | null;
    bestPredictiveBreast: string | null;
    link: string | null;
  };
  clinvar: {
    vcv: string | null;
    note: string | null;
    oncogenicity: string | null;
    somaticImpact: string | null;
    link: string | null;
  };
  checked: string;
}

export interface EvidenceFile {
  _note: string;
  source: string;
  checkedDate: string;
  variants: EvidenceRecord[];
}
