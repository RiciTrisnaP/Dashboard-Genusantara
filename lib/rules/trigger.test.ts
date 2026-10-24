import { describe, expect, it } from "vitest";
import { panel } from "../data";
import type { Panel } from "../types";
import { patient, run } from "./test-helpers";
import { evaluateTrigger, suggestedSpecimenText } from "./trigger";

describe("Pemicu tes", () => {
  it("E: progressed on endocrine therapy, not tested yet -> Perlu tes", () => {
    const t = run("E").trigger;
    expect(t.status).toBe("PERLU_TES");
    expect(t.label).toBe("Perlu tes");
    expect(t.suggestedSpecimen).toBe(suggestedSpecimenText(panel));
    expect(t.suggestedSpecimen).toMatch(/Jaringan FFPE untuk panel NUSA11 \(PIK3CA, AKT1, ERBB2\)/);
    expect(t.suggestedSpecimen).toMatch(/ESR1 tidak termasuk NUSA11/);
  });

  it.each(["A", "B", "C", "D", "F"])("%s: already tested -> Sudah dites", (id) => {
    const t = run(id).trigger;
    expect(t.status).toBe("SUDAH_DITES");
    expect(t.label).toBe("Sudah dites");
    expect(t.suggestedSpecimen).toBeUndefined();
  });

  it("specimen advice names ESR1 plasma testing when the panel does cover ESR1", () => {
    const withEsr1: Panel = {
      ...panel,
      targets: [...panel.targets, { ...panel.targets[0], id: "ESR1 D538G", gene: "ESR1", codon: "D538", allele: "D538G", site: "ESR1 D538" }],
    };
    expect(suggestedSpecimenText(withEsr1)).toMatch(/Plasma ctDNA untuk ESR1/);
  });

  it("untested patient outside criteria gets the reason", () => {
    const c = patient("C");
    const t = evaluateTrigger({ ...c, molecularTest: { done: false } }, panel);
    expect(t.status).toBe("TIDAK_MEMENUHI_KRITERIA");
    expect(t.reason).toMatch(/bukan HR\+\/HER2-/);
    expect(t.reason).toMatch(/belum ada progresi pada terapi endokrin/);
  });

  it("untested HR+/HER2- patient without endocrine progression is not flagged", () => {
    const e = patient("E");
    const t = evaluateTrigger({ ...e, clinical: { ...e.clinical, progressedOnEndocrine: false } }, panel);
    expect(t.status).toBe("TIDAK_MEMENUHI_KRITERIA");
  });
});
