// Pemicu Tes (test trigger, before testing). docs/rules_spec.md section 1.
import type { Clinical, Patient } from "../types";

export type TriggerStatus = "PERLU_TES" | "SUDAH_DITES" | "TIDAK_MEMENUHI_KRITERIA";

export interface TriggerResult {
  status: TriggerStatus;
  label: string;
  reason: string;
  /** Only set when status is PERLU_TES. */
  suggestedSpecimen?: string;
}

export const SUGGESTED_SPECIMEN_TEXT =
  "Jaringan FFPE untuk PIK3CA dan AKT1; plasma ctDNA untuk ESR1 (mutasi ESR1 biasanya muncul setelah terapi hormon).";

export function isAdvanced(clinical: Clinical): boolean {
  return clinical.stage === "IV" || clinical.setting === "metastatik" || clinical.setting === "kambuh";
}

export function evaluateTrigger(patient: Patient): TriggerResult {
  const c = patient.clinical;
  const unmet: string[] = [];
  if (c.subtype !== "HR+/HER2-") unmet.push(`subtipe ${c.subtype ?? "belum diisi"}, bukan HR+/HER2-`);
  if (!isAdvanced(c)) unmet.push("belum stadium lanjut (metastatik atau kambuh)");
  if (c.progressedOnEndocrine !== true) unmet.push("belum ada progresi pada terapi endokrin");

  if (patient.molecularTest.done) {
    return {
      status: "SUDAH_DITES",
      label: "Sudah dites",
      reason: `Tes molekuler sudah dilakukan pada ${patient.molecularTest.date}.`,
    };
  }

  if (unmet.length === 0) {
    return {
      status: "PERLU_TES",
      label: "Perlu tes",
      reason:
        "HR+/HER2- stadium lanjut, memburuk setelah terapi endokrin, dan belum ada tes molekuler. Bahas di rapat tim tumor.",
      suggestedSpecimen: SUGGESTED_SPECIMEN_TEXT,
    };
  }

  return {
    status: "TIDAK_MEMENUHI_KRITERIA",
    label: "Tidak memenuhi kriteria",
    reason: `Belum memenuhi kriteria pemicu tes: ${unmet.join("; ")}.`,
  };
}
