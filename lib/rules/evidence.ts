// Variant to drug map. docs/rules_spec.md section 4.1 (OncoKB, checked 23 Oct 2026).
// Per-variant level and links come from data/evidence_check.json.
import type { Clinical, EvidenceRecord, Variant } from "../types";
import { isAdvanced } from "./trigger";

export type VariantClass =
  | "PIK3CA_THERASCREEN"
  | "PIK3CA_NAMED"
  | "PIK3CA_OTHER_ONCOGENIC"
  | "AKT1_E17K"
  | "ESR1_LBD"
  | "ERBB2_ONCOGENIC"
  | "INCONCLUSIVE"
  | "NOT_IN_EVIDENCE_BASE";

export interface DrugCandidate {
  /** Key into drug_access.json. */
  drug: string;
  /** OncoKB level for this drug and variant class (breast). */
  level: string;
  /** Extra caveat about the indication, shown next to the option. */
  indicationNote?: string;
}

export interface IndicationRule {
  text: string;
  subtypeLabel: string;
  /** Check returns the list of unmet conditions; empty means the indication fits. */
  unmet: (clinical: Clinical) => string[];
}

export interface VariantEvidence {
  key: string;
  variantClass: VariantClass;
  classLabel: string;
  actionable: boolean;
  record?: EvidenceRecord;
  drugs: DrugCandidate[];
  indication?: IndicationRule;
  /** Research or guideline level only (ERBB2). */
  researchLevelOnly?: boolean;
}

const PIK3CA_THERASCREEN = new Set([
  "C420R", "E542K", "E545A", "E545D", "E545G", "E545K", "Q546E", "Q546R", "H1047L", "H1047R", "H1047Y",
]);
const PIK3CA_NAMED = new Set(["E545Q", "G1049R", "M1043I", "M1043V", "N345K", "Q546K", "Q546P", "R88Q"]);
const ERBB2_ONCOGENIC = new Set(["L755S", "V777L", "D769H", "D769Y", "S310F", "L869R"]);
/** ESR1 ligand-binding domain, residues 302 to 552 (approximate). */
const ESR1_LBD = { start: 302, end: 552 };

const INAVOLISIB_NOTE =
  "Indikasi FDA: kambuh saat atau segera setelah terapi endokrin adjuvan. Cocokkan dengan riwayat terapi pasien.";

function unmetHrHer2Neg(label: string) {
  return (c: Clinical): string[] => {
    const unmet: string[] = [];
    if (c.subtype !== "HR+/HER2-" || c.er === "negatif") unmet.push(`Indikasi hanya untuk ${label}`);
    if (!isAdvanced(c)) unmet.push("Indikasi untuk stadium lanjut (metastatik atau kambuh)");
    if (c.progressedOnEndocrine !== true) unmet.push("Indikasi setelah terapi endokrin; belum ada progresi pada terapi endokrin");
    return unmet;
  };
}

export const INDICATION_PI3K_AKT: IndicationRule = {
  text: "HR+/HER2-, stadium lanjut, setelah terapi endokrin",
  subtypeLabel: "HR+/HER2-",
  unmet: unmetHrHer2Neg("HR+/HER2-"),
};

export const INDICATION_ESR1: IndicationRule = {
  text: "ER+/HER2-, stadium lanjut, setelah minimal satu terapi endokrin",
  subtypeLabel: "ER+/HER2-",
  unmet: unmetHrHer2Neg("ER+/HER2-"),
};

export const INDICATION_ERBB2: IndicationRule = {
  text: "HR+/HER2- (tanpa amplifikasi HER2), stadium lanjut, setelah terapi endokrin; tingkat riset atau pedoman",
  subtypeLabel: "HR+/HER2-",
  unmet: unmetHrHer2Neg("HR+/HER2-"),
};

/** ESR1-specific drugs, used for the fulvestrant fallback rule. */
export const ESR1_SPECIFIC_DRUGS = ["elacestrant", "imlunestrant", "camizestrant", "vepdegestrant"];

function isMissense(protein: string): boolean {
  return /^[A-Z]\d+[A-Z]$/.test(protein);
}

function codonNumber(protein: string): number | null {
  const m = /^[A-Z](\d+)/.exec(protein);
  return m ? Number(m[1]) : null;
}

function isOncogenic(record: EvidenceRecord | undefined): boolean {
  const o = record?.oncokb.oncogenicity.toLowerCase();
  return o === "oncogenic" || o === "likely oncogenic";
}

export function findEvidence(records: EvidenceRecord[], v: Pick<Variant, "gene" | "protein">): EvidenceRecord | undefined {
  return records.find((r) => r.variant === `${v.gene} ${v.protein}`);
}

export function classifyVariant(v: Pick<Variant, "gene" | "protein">, records: EvidenceRecord[]): VariantEvidence {
  const key = `${v.gene} ${v.protein}`;
  const record = findEvidence(records, v);

  if (record?.oncokb.oncogenicity === "Inconclusive") {
    return {
      key,
      record,
      variantClass: "INCONCLUSIVE",
      classLabel: "Varian dengan makna belum jelas (OncoKB: Inconclusive); tidak dipakai untuk memilih obat",
      actionable: false,
      drugs: [],
    };
  }

  if (v.gene === "PIK3CA") {
    if (PIK3CA_THERASCREEN.has(v.protein)) {
      return {
        key,
        record,
        variantClass: "PIK3CA_THERASCREEN",
        classLabel: "PIK3CA, alel therascreen",
        actionable: true,
        indication: INDICATION_PI3K_AKT,
        drugs: [
          { drug: "alpelisib", level: "1" },
          { drug: "capivasertib", level: "1" },
          { drug: "inavolisib", level: "1", indicationNote: INAVOLISIB_NOTE },
        ],
      };
    }
    if (PIK3CA_NAMED.has(v.protein)) {
      return {
        key,
        record,
        variantClass: "PIK3CA_NAMED",
        classLabel: "PIK3CA, varian onkogenik bernama",
        actionable: true,
        indication: INDICATION_PI3K_AKT,
        drugs: [
          { drug: "capivasertib", level: "1" },
          { drug: "inavolisib", level: "1", indicationNote: INAVOLISIB_NOTE },
          { drug: "alpelisib", level: "2" },
        ],
      };
    }
    if (isOncogenic(record)) {
      return {
        key,
        record,
        variantClass: "PIK3CA_OTHER_ONCOGENIC",
        classLabel: "PIK3CA, mutasi onkogenik lain",
        actionable: true,
        indication: INDICATION_PI3K_AKT,
        drugs: [
          { drug: "inavolisib", level: "1", indicationNote: INAVOLISIB_NOTE },
          { drug: "capivasertib", level: "2" },
          { drug: "alpelisib", level: "2" },
        ],
      };
    }
  }

  if (v.gene === "AKT1" && v.protein === "E17K") {
    return {
      key,
      record,
      variantClass: "AKT1_E17K",
      classLabel: "AKT1 E17K",
      actionable: true,
      indication: INDICATION_PI3K_AKT,
      drugs: [{ drug: "capivasertib", level: "1" }],
    };
  }

  if (v.gene === "ESR1" && isMissense(v.protein)) {
    const n = codonNumber(v.protein);
    if (n !== null && n >= ESR1_LBD.start && n <= ESR1_LBD.end) {
      return {
        key,
        record,
        variantClass: "ESR1_LBD",
        classLabel: "ESR1, missense domain pengikat ligan",
        actionable: true,
        indication: INDICATION_ESR1,
        drugs: ESR1_SPECIFIC_DRUGS.map((drug) => ({ drug, level: "1" })),
      };
    }
  }

  if (v.gene === "ERBB2" && ERBB2_ONCOGENIC.has(v.protein)) {
    return {
      key,
      record,
      variantClass: "ERBB2_ONCOGENIC",
      classLabel: "ERBB2, mutasi onkogenik (tingkat riset atau pedoman)",
      actionable: true,
      researchLevelOnly: true,
      indication: INDICATION_ERBB2,
      drugs: [{ drug: "neratinib", level: "2" }],
    };
  }

  return {
    key,
    record,
    variantClass: "NOT_IN_EVIDENCE_BASE",
    classLabel: "Belum ada di basis bukti tim; perlu kurasi manual sebelum dipakai",
    actionable: false,
    drugs: [],
  };
}
