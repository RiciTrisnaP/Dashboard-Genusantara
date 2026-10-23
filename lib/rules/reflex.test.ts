import { describe, expect, it } from "vitest";
import { panel } from "../data";
import { evaluateReflex, REFLEX_LABEL } from "./reflex";
import { evaluateSentinel } from "./sentinel";
import { patient, run } from "./test-helpers";

function ids(id: string) {
  return run(id).reflex.items.map((i) => i.id);
}

function allAdvice(id: string) {
  return run(id).reflex.items.flatMap((i) => i.advice).join(" ");
}

describe("REFLEX per demo patient", () => {
  it("always carries the doctor-approval label", () => {
    for (const id of ["A", "B", "C", "D", "E", "F"]) {
      expect(run(id).reflex.label).toBe(REFLEX_LABEL);
    }
    expect(REFLEX_LABEL).toMatch(/butuh persetujuan dokter/);
  });

  it("A: tissue at progression -> suggests plasma ctDNA for ESR1 only", () => {
    expect(ids("A")).toEqual(["ESR1_BELUM_DINILAI"]);
    expect(allAdvice("A")).toMatch(/Pertimbangkan tes plasma ctDNA untuk ESR1/);
  });

  it("B: plasma with a passing variant -> no rule fires", () => {
    expect(ids("B")).toEqual([]);
  });

  it("C: triple-negative -> BRCA germline referral", () => {
    expect(ids("C")).toEqual(["PETUNJUK_BRCA_BAWAAN"]);
  });

  it("D: no variant, family history, age 38 -> broader NGS and germline BRCA1/2 with counselling", () => {
    expect(ids("D")).toEqual(["PANEL_NEGATIF_KEBUTUHAN_BESAR", "PETUNJUK_BRCA_BAWAAN", "ESR1_BELUM_DINILAI"]);
    const advice = allAdvice("D");
    expect(advice).toMatch(/profil genomik yang lebih luas \(NGS panel besar\)/);
    expect(advice).toMatch(/tidak mencakup PTEN dan BRCA1\/2 secara utuh/);
    expect(advice).toMatch(/tes germline BRCA1\/2 dari darah dengan konseling genetik/);
    const brca = run("D").reflex.items.find((i) => i.id === "PETUNJUK_BRCA_BAWAAN");
    expect(brca?.reason).toMatch(/riwayat keluarga/);
    expect(brca?.reason).toMatch(/usia 38 tahun/);
  });

  it("E: not tested -> REFLEX not applicable yet", () => {
    const r = run("E").reflex;
    expect(r.applicable).toBe(false);
    expect(r.items).toEqual([]);
  });

  it("F: quality failure -> plasma ctDNA or non-bone block, plus macrodissection", () => {
    const r = run("F").reflex;
    expect(r.items[0].id).toBe("MUTU_GAGAL");
    const advice = r.items[0].advice.join(" ");
    expect(advice).toMatch(/Tes plasma ctDNA, atau gunakan blok jaringan lain yang bukan tulang/);
    expect(advice).toMatch(/makrodiseksi/);
    // A failed test must never trigger the "negative panel" rules.
    expect(ids("F")).not.toContain("PANEL_NEGATIF_KEBUTUHAN_BESAR");
    expect(ids("F")).not.toContain("PLASMA_NEGATIF");
  });
});

describe("REFLEX rules not covered by the demo patients", () => {
  it("rule 2: partial read flags drug-critical targets for repeat", () => {
    const a = patient("A");
    if (!a.molecularTest.done) throw new Error("fixture");
    const targets = a.molecularTest.targets.map((t) =>
      t.target === "ESR1 D538" || t.target === "PIK3CA G118" ? { ...t, depth: 50 } : t,
    );
    const p = { ...a, molecularTest: { ...a.molecularTest, targets } };
    const r = evaluateReflex(p, evaluateSentinel(p, panel));
    const item = r.items.find((i) => i.id === "TARGET_TIDAK_TERBACA");
    expect(item?.advice[0]).toMatch(/Laporkan area yang tidak dinilai/);
    expect(item?.advice[1]).toMatch(/Ulangi, target ini penting untuk pilihan obat: ESR1 D538\./);
  });

  it("rule 5: readable plasma with no variant -> consider tissue", () => {
    const b = patient("B");
    if (!b.molecularTest.done) throw new Error("fixture");
    const p = { ...b, molecularTest: { ...b.molecularTest, variants: [] } };
    const r = evaluateReflex(p, evaluateSentinel(p, panel));
    expect(r.items.map((i) => i.id)).toEqual(["PANEL_NEGATIF_KEBUTUHAN_BESAR", "PLASMA_NEGATIF"]);
  });

  it("rule 4 ignores 'tidak ada' family history", () => {
    expect(ids("A")).not.toContain("PETUNJUK_BRCA_BAWAAN");
  });
});
