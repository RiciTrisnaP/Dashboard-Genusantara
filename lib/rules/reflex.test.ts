import { describe, expect, it } from "vitest";
import { panel } from "../data";
import type { Panel } from "../types";
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

  it("A: progressed on endocrine therapy -> separate ESR1 test, since NUSA11 has no ESR1", () => {
    expect(ids("A")).toEqual(["ESR1_BELUM_DINILAI"]);
    expect(allAdvice("A")).toMatch(/tes ESR1 terpisah dari plasma ctDNA; ESR1 tidak termasuk panel NUSA11/);
  });

  it("B: plasma with a passing ERBB2 variant -> only the ESR1 suggestion", () => {
    expect(ids("B")).toEqual(["ESR1_BELUM_DINILAI"]);
  });

  it("C: triple-negative, no endocrine progression -> BRCA germline referral only", () => {
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

  it("F: quality failure -> plasma ctDNA or non-bone block, plus macrodissection; unreadable areas reported", () => {
    const r = run("F").reflex;
    expect(r.items[0].id).toBe("MUTU_GAGAL");
    const advice = r.items[0].advice.join(" ");
    expect(advice).toMatch(/Tes plasma ctDNA, atau gunakan blok jaringan lain yang bukan tulang/);
    expect(advice).toMatch(/makrodiseksi/);
    expect(ids("F")).toEqual(["MUTU_GAGAL", "TARGET_TIDAK_TERBACA", "ESR1_BELUM_DINILAI"]);
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
      t.target === "PIK3CA E545" || t.target === "ERBB2 V777" ? { ...t, depth: 50 } : t,
    );
    const p = { ...a, molecularTest: { ...a.molecularTest, targets } };
    const r = evaluateReflex(p, evaluateSentinel(p, panel), panel);
    const item = r.items.find((i) => i.id === "TARGET_TIDAK_TERBACA");
    expect(item?.advice[0]).toMatch(/Laporkan area yang tidak dinilai/);
    expect(item?.advice[1]).toMatch(/Ulangi, target ini penting untuk pilihan obat: PIK3CA E545K, PIK3CA E545A\./);
  });

  it("rule 5: readable plasma with no variant -> consider tissue", () => {
    const b = patient("B");
    if (!b.molecularTest.done) throw new Error("fixture");
    const p = { ...b, molecularTest: { ...b.molecularTest, variants: [] } };
    const r = evaluateReflex(p, evaluateSentinel(p, panel), panel);
    expect(r.items.map((i) => i.id)).toEqual(["PANEL_NEGATIF_KEBUTUHAN_BESAR", "PLASMA_NEGATIF", "ESR1_BELUM_DINILAI"]);
  });

  it("rule 6 with an ESR1-covering panel: only fires for tissue-only testing", () => {
    const withEsr1: Panel = {
      ...panel,
      targets: [...panel.targets, { ...panel.targets[0], id: "ESR1 D538G", gene: "ESR1", codon: "D538", allele: "D538G", site: "ESR1 D538" }],
    };
    const a = patient("A");
    const b = patient("B");
    const ra = evaluateReflex(a, evaluateSentinel(a, withEsr1), withEsr1);
    expect(ra.items.find((i) => i.id === "ESR1_BELUM_DINILAI")?.advice).toEqual(["Pertimbangkan tes plasma ctDNA untuk ESR1."]);
    const rb = evaluateReflex(b, evaluateSentinel(b, withEsr1), withEsr1);
    expect(rb.items.map((i) => i.id)).not.toContain("ESR1_BELUM_DINILAI");
  });

  it("rule 4 ignores 'tidak ada' family history", () => {
    expect(ids("A")).not.toContain("PETUNJUK_BRCA_BAWAAN");
  });
});
