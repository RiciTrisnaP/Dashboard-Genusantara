import { describe, expect, it } from "vitest";
import { panel } from "../data";
import { evaluateS2, evaluateS3, evaluateS4, evaluateS5, evaluateSentinel, NOT_NEGATIVE_WARNING } from "./sentinel";
import { patient, run, tested } from "./test-helpers";

describe("SENTINEL per demo patient", () => {
  it("A: tissue, good quality -> LANJUT, all 15 targets readable, H1047R passes", () => {
    const { sentinel } = tested("A");
    expect(sentinel.verdict).toBe("LANJUT");
    expect(sentinel.s1.status).toBe("LAYAK");
    expect(sentinel.s2.status).toBe("LANJUT");
    expect(sentinel.s3.status).toBe("TERBACA");
    expect(sentinel.s3.readableCount).toBe(15);
    expect(sentinel.s4.status).toBe("LULUS");
    expect(sentinel.s4.passed.map((v) => v.key)).toEqual(["PIK3CA H1047R"]);
    expect(sentinel.warning).toBeUndefined();
  });

  it("B: plasma ctDNA processed in 3 h -> LANJUT, ESR1 Y537S at 1.8% passes the plasma threshold", () => {
    const { sentinel } = tested("B");
    expect(sentinel.verdict).toBe("LANJUT");
    expect(sentinel.s2.status).toBe("LANJUT");
    expect(sentinel.s2.warnings).toEqual([]);
    expect(sentinel.s4.passed.map((v) => v.key)).toEqual(["ESR1 Y537S"]);
  });

  it("C: triple-negative -> S1 DI_LUAR_INDIKASI as a warning, verdict still LANJUT", () => {
    const { sentinel } = tested("C");
    expect(sentinel.s1.status).toBe("DI_LUAR_INDIKASI");
    expect(sentinel.s1.tone).toBe("warn");
    expect(sentinel.verdict).toBe("LANJUT");
    expect(sentinel.reason).toMatch(/catatan klinis pada S1/);
  });

  it("D: all targets readable, no variant -> LANJUT", () => {
    const { sentinel } = tested("D");
    expect(sentinel.verdict).toBe("LANJUT");
    expect(sentinel.s3.status).toBe("TERBACA");
    expect(sentinel.s4.status).toBe("TIDAK_ADA_VARIAN");
    expect(sentinel.s4.passed).toHaveLength(0);
  });

  it("E: not tested -> only S1 evaluated", () => {
    const { sentinel } = run("E");
    expect(sentinel.tested).toBe(false);
    expect(sentinel.s1.status).toBe("LAYAK");
  });

  it("F: decalcified bone, 6 of 15 readable, 10% tumour -> TAHAN, every cause listed", () => {
    const { sentinel } = tested("F");
    expect(sentinel.verdict).toBe("TAHAN");
    expect(sentinel.s2.status).toBe("TAHAN");
    expect(sentinel.s2.causes.map((c) => c.code).sort()).toEqual(["DECALCIFIED", "DNA_DAMAGED", "LOW_TUMOR_CONTENT"]);
    expect(sentinel.s3.status).toBe("TAHAN");
    expect(sentinel.s3.readableCount).toBe(6);
    expect(sentinel.s3.unreadable).toHaveLength(9);
    expect(sentinel.s3.unreadable).toContain("ESR1 Y537");
    expect(sentinel.warning).toBe(NOT_NEGATIVE_WARNING);
    expect(sentinel.warning).toContain('"tidak ada mutasi"');
  });
});

describe("SENTINEL layer rules", () => {
  const a = patient("A");
  const b = patient("B");
  if (!a.molecularTest.done || !b.molecularTest.done) throw new Error("fixture");
  const tissue = a.molecularTest.specimen;
  const plasma = b.molecularTest.specimen;

  it("S2: plasma processed after 24 h -> AMBIL_ULANG; after 6 h -> warning only", () => {
    expect(evaluateS2({ ...plasma, plasmaProcessingHours: 30 }).status).toBe("AMBIL_ULANG");
    const late = evaluateS2({ ...plasma, plasmaProcessingHours: 8 });
    expect(late.status).toBe("LANJUT");
    expect(late.tone).toBe("warn");
    expect(late.warnings).toHaveLength(1);
  });

  it("S2 AMBIL_ULANG wins the overall verdict", () => {
    const resampled = { ...b, molecularTest: { ...b.molecularTest, specimen: { ...plasma, plasmaProcessingHours: 30 } } };
    const s = evaluateSentinel(resampled, panel);
    expect(s.tested && s.verdict).toBe("AMBIL_ULANG");
  });

  it("S2: tissue below 20% tumour content -> TAHAN", () => {
    expect(evaluateS2({ ...tissue, tumorContentPct: 15 }).status).toBe("TAHAN");
    expect(evaluateS2({ ...tissue, tumorContentPct: 20 }).status).toBe("LANJUT");
  });

  it("S3: 1 to 3 unreadable -> SEBAGIAN, 4 or more -> TAHAN; missing target counts as unreadable", () => {
    const targets = a.molecularTest.done ? a.molecularTest.targets : [];
    const low = (n: number) => targets.map((t, i) => (i < n ? { ...t, depth: 100 } : t));
    expect(evaluateS3("NGS_amplikon", low(3), panel).status).toBe("SEBAGIAN");
    expect(evaluateS3("NGS_amplikon", low(4), panel).status).toBe("TAHAN");
    expect(evaluateS3("NGS_amplikon", targets.slice(1), panel).unreadable).toEqual(["PIK3CA H1047"]);
  });

  it("S3: PCR uses internal control instead of depth", () => {
    const targets = a.molecularTest.done ? a.molecularTest.targets : [];
    const pcr = targets.map((t, i) => (i === 0 ? { ...t, depth: 10, internalControlPass: true } : t));
    expect(evaluateS3("PCR", pcr, panel).status).toBe("TERBACA");
    expect(evaluateS3("NGS_amplikon", pcr, panel).status).toBe("SEBAGIAN");
  });

  it("S4: low VAF or few reads -> TINJAU and kept out of TRIASE", () => {
    const s4 = evaluateS4(
      [
        { gene: "PIK3CA", protein: "H1047R", vaf: 3, altReads: 50 },
        { gene: "AKT1", protein: "E17K", vaf: 20, altReads: 5 },
        { gene: "PIK3CA", protein: "E545K", vaf: 12, altReads: 40 },
      ],
      tissue,
    );
    expect(s4.status).toBe("TINJAU");
    expect(s4.passed.map((p) => p.key)).toEqual(["PIK3CA E545K"]);
    expect(evaluateS4([{ gene: "ESR1", protein: "D538G", vaf: 0.4, altReads: 20 }], plasma).status).toBe("TINJAU");
  });

  it("S5: DRAF until signed, TERBIT after sign-off, ULANG when quality fails", () => {
    expect(evaluateS5("LANJUT", false, "23 Okt 2026").status).toBe("DRAF");
    expect(evaluateS5("LANJUT", true, "23 Okt 2026").status).toBe("TERBIT");
    expect(evaluateS5("TAHAN", true, "23 Okt 2026").status).toBe("ULANG");
    expect(evaluateS5("AMBIL_ULANG", false, "23 Okt 2026").status).toBe("ULANG");
  });
});
