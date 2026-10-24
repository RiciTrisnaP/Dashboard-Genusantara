import { describe, expect, it } from "vitest";
import { drugAccess, evidence } from "../data";
import { classifyVariant } from "./evidence";
import { issued, patient, run } from "./test-helpers";
import { buildTherapyOptions, REPORT_FOOTER, type TherapyGroupId } from "./triase";

function group(id: string, g: TherapyGroupId) {
  return issued(id).triase.groups[g];
}

function option(id: string, drug: string) {
  const all = Object.values(issued(id).triase.groups).flat();
  const o = all.find((x) => x.drug === drug);
  if (!o) throw new Error(`${drug} not in report for ${id}`);
  return o;
}

describe("TRIASE per demo patient", () => {
  it("A: capivasertib in group A at Rp87.025.221 per box, not covered by JKN", () => {
    expect(group("A", "A").map((o) => o.drug)).toEqual(["capivasertib"]);
    const capi = option("A", "capivasertib");
    expect(capi.brand).toBe("Truqap");
    expect(capi.priceText).toMatch(/^Rp87\.025\.221 per boks/);
    expect(capi.jknCovered).toBe(false);
    expect(capi.jknText.toLowerCase()).toContain("tidak dijamin jkn");
    expect(capi.accessCheckedDate).toBe("23 Okt 2026");
    expect(capi.bpomText).toMatch(/Terdaftar BPOM/);
  });

  it("A: alpelisib in group B as registered but not on the market; inavolisib in group B as not registered", () => {
    const alp = option("A", "alpelisib");
    expect(alp.group).toBe("B");
    expect(alp.statusLabel.toLowerCase()).toBe("terdaftar bpom, tidak ditemukan di pasar");
    const ina = option("A", "inavolisib");
    expect(ina.group).toBe("B");
    expect(ina.statusLabel).toMatch(/[Bb]elum terdaftar/);
    expect(ina.indicationNote).toMatch(/adjuvan/);
    expect(group("A", "C")).toEqual([]);
  });

  it("A: variant shows OncoKB level 1 and links from the evidence check", () => {
    const f = issued("A").triase.findings[0];
    expect(f.evidence.record?.oncokb.highestLevelBreast).toBe("1");
    expect(f.evidence.record?.oncokb.link).toBe("https://www.oncokb.org/gene/PIK3CA/H1047R");
    expect(f.evidence.record?.civic.molecularProfile).toBe("MP107");
    expect(f.evidence.record?.clinvar.vcv).toBe("VCV000013652");
  });

  it("B: ESR1 drugs in group B as not registered at BPOM; fulvestrant is the available fallback", () => {
    for (const drug of ["elacestrant", "imlunestrant", "camizestrant"]) {
      const o = option("B", drug);
      expect(o.group).toBe("B");
      expect(o.statusLabel).toBe("Belum terdaftar di BPOM");
    }
    const fulv = option("B", "fulvestrant");
    expect(fulv.group).toBe("A");
    expect(fulv.isFallback).toBe(true);
    expect(fulv.jknCovered).toBe(true);
    expect(fulv.jknText).toMatch(/Fornas, maksimal 6 bulan/);
    expect(fulv.statusLabel).toMatch(/bukan terapi khusus ESR1/);
    expect(group("B", "A").map((o) => o.drug)).toEqual(["fulvestrant"]);
  });

  it("A and B: structured access cells match the text fields", () => {
    const capi = option("A", "capivasertib");
    expect(capi.bpom).toEqual({ label: "Terdaftar BPOM", detail: "29 Sep 2025 s.d. 29 Sep 2030", tone: "ok" });
    expect(capi.jkn).toEqual({ label: "Tidak dijamin JKN", detail: "tidak ditemukan di e-Fornas", tone: "warn" });
    expect(capi.market.label).toBe("Rp87.025.221");
    expect(capi.market.detail).toMatch(/per boks 64 tablet/);
    expect(option("A", "inavolisib").bpom).toEqual({ label: "Belum terdaftar di BPOM", tone: "warn" });
    expect(option("A", "alpelisib").market).toMatchObject({ label: "Tidak ditemukan di pasar", tone: "warn" });
    const fulv = option("B", "fulvestrant");
    expect(fulv.jkn).toEqual({ label: "Dijamin JKN", detail: "masuk Fornas, maksimal 6 bulan", tone: "ok" });
    expect(fulv.market.label).toBe("Harga belum dicek");
    expect(option("B", "vepdegestrant").bpom.tone).toBe("neutral");
  });

  it("B: vepdegestrant has no access record -> group B, access not assessed", () => {
    const v = option("B", "vepdegestrant");
    expect(v.group).toBe("B");
    expect(v.statusLabel).toBe("Status akses belum dinilai");
  });

  it("C: triple-negative -> all PIK3CA drugs not indicated, with reason", () => {
    expect(group("C", "C").map((o) => o.drug).sort()).toEqual(["alpelisib", "capivasertib", "inavolisib"]);
    for (const o of group("C", "C")) expect(o.reason).toMatch(/Indikasi hanya untuk HR\+\/HER2-/);
    expect(group("C", "A")).toEqual([]);
    expect(group("C", "B")).toEqual([]);
  });

  it("D: no variant -> 'Tidak terdeteksi ... pada 15 target yang diperiksa', never 'negatif'", () => {
    const t = issued("D").triase;
    expect(t.noActionableText).toBe("Tidak terdeteksi varian yang dapat ditindaklanjuti pada 15 target yang diperiksa.");
    expect(t.noActionableText).not.toMatch(/negatif/i);
    expect(t.groups).toEqual({ A: [], B: [], C: [] });
  });

  it("E: not tested -> no report", () => {
    expect(run("E").triase.issued).toBe(false);
  });

  it("F: quality hold -> no therapy report and the 'not negative' warning", () => {
    const t = run("F").triase;
    expect(t.issued).toBe(false);
    if (t.issued) return;
    expect(t.warning).toBe('Hasil tidak boleh dibaca sebagai "tidak ada mutasi".');
  });

  it("every issued report carries evidence version and footer", () => {
    for (const id of ["A", "B", "C", "D"]) {
      const t = issued(id).triase;
      expect(t.evidenceVersion).toBe("OncoKB v7.6 (data 30 Sep 2026), CIViC dan ClinVar, dicek 23 Okt 2026");
      expect(t.footer).toBe(REPORT_FOOTER);
    }
  });
});

describe("TRIASE rules beyond the demo patients", () => {
  const a = patient("A");

  it("classifies variant groups per the spec table", () => {
    const cls = (gene: string, protein: string) => classifyVariant({ gene, protein }, evidence.variants).variantClass;
    expect(cls("PIK3CA", "H1047L")).toBe("PIK3CA_THERASCREEN");
    expect(cls("PIK3CA", "N345K")).toBe("PIK3CA_NAMED");
    expect(cls("PIK3CA", "N1044K")).toBe("PIK3CA_OTHER_ONCOGENIC");
    expect(cls("PIK3CA", "E726K")).toBe("INCONCLUSIVE");
    expect(cls("AKT1", "E17K")).toBe("AKT1_E17K");
    expect(cls("ESR1", "D538G")).toBe("ESR1_LBD");
    expect(cls("ERBB2", "L755S")).toBe("ERBB2_ONCOGENIC");
    expect(cls("ERBB2", "G727A")).toBe("INCONCLUSIVE");
    expect(cls("PIK3CA", "H1047Q")).toBe("NOT_IN_EVIDENCE_BASE");
  });

  it("other oncogenic PIK3CA ranks inavolisib (L1) before capivasertib (L2) inside group B/A", () => {
    const f = classifyVariant({ gene: "PIK3CA", protein: "N1044K" }, evidence.variants);
    const readout = { variant: { gene: "PIK3CA", protein: "N1044K", vaf: 20, altReads: 100 }, key: f.key, target: "PIK3CA N1044", call: "LULUS" as const, reason: "" };
    const groups = buildTherapyOptions([{ readout, evidence: f }], a.clinical, drugAccess);
    expect(groups.A.map((o) => [o.drug, o.level])).toEqual([["capivasertib", "2"]]);
    expect(groups.B.map((o) => [o.drug, o.level])).toEqual([
      ["inavolisib", "1"],
      ["alpelisib", "2"],
    ]);
  });

  it("PIK3CA + AKT1 together list capivasertib once with both variants", () => {
    const mk = (gene: string, protein: string) => {
      const ev = classifyVariant({ gene, protein }, evidence.variants);
      return {
        readout: { variant: { gene, protein, vaf: 20, altReads: 100 }, key: ev.key, target: "", call: "LULUS" as const, reason: "" },
        evidence: ev,
      };
    };
    const groups = buildTherapyOptions([mk("PIK3CA", "H1047R"), mk("AKT1", "E17K")], a.clinical, drugAccess);
    expect(groups.A).toHaveLength(1);
    expect(groups.A[0].supportingVariants).toEqual(["PIK3CA H1047R", "AKT1 E17K"]);
  });

  it("not progressed on endocrine therapy -> group C with that reason", () => {
    const f = classifyVariant({ gene: "PIK3CA", protein: "H1047R" }, evidence.variants);
    const readout = { variant: { gene: "PIK3CA", protein: "H1047R", vaf: 20, altReads: 100 }, key: f.key, target: "", call: "LULUS" as const, reason: "" };
    const groups = buildTherapyOptions([{ readout, evidence: f }], { ...a.clinical, progressedOnEndocrine: false }, drugAccess);
    expect(groups.C).toHaveLength(3);
    expect(groups.C[0].reason).toMatch(/setelah terapi endokrin/);
  });
});
