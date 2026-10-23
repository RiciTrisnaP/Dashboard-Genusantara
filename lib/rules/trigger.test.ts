import { describe, expect, it } from "vitest";
import { patient, run } from "./test-helpers";
import { evaluateTrigger, SUGGESTED_SPECIMEN_TEXT } from "./trigger";

describe("Pemicu tes", () => {
  it("E: progressed on endocrine therapy, not tested yet -> Perlu tes", () => {
    const t = run("E").trigger;
    expect(t.status).toBe("PERLU_TES");
    expect(t.label).toBe("Perlu tes");
    expect(t.suggestedSpecimen).toBe(SUGGESTED_SPECIMEN_TEXT);
    expect(t.suggestedSpecimen).toMatch(/Jaringan FFPE untuk PIK3CA dan AKT1/);
    expect(t.suggestedSpecimen).toMatch(/plasma ctDNA untuk ESR1/);
  });

  it.each(["A", "B", "C", "D", "F"])("%s: already tested -> Sudah dites", (id) => {
    const t = run(id).trigger;
    expect(t.status).toBe("SUDAH_DITES");
    expect(t.label).toBe("Sudah dites");
    expect(t.suggestedSpecimen).toBeUndefined();
  });

  it("untested patient outside criteria gets the reason", () => {
    const c = patient("C");
    const t = evaluateTrigger({ ...c, molecularTest: { done: false } });
    expect(t.status).toBe("TIDAK_MEMENUHI_KRITERIA");
    expect(t.reason).toMatch(/bukan HR\+\/HER2-/);
    expect(t.reason).toMatch(/belum ada progresi pada terapi endokrin/);
  });

  it("untested HR+/HER2- patient without endocrine progression is not flagged", () => {
    const e = patient("E");
    const t = evaluateTrigger({ ...e, clinical: { ...e.clinical, progressedOnEndocrine: false } });
    expect(t.status).toBe("TIDAK_MEMENUHI_KRITERIA");
  });
});
