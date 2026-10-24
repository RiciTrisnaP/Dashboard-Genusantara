import { describe, expect, it } from "vitest";
import { NOT_INHERITED_TEXT, summaryWordCount } from "./summary";
import { run } from "./test-helpers";

function text(id: string) {
  return run(id)
    .summary.sections.flatMap((s) => [s.title, ...s.paragraphs, ...(s.bullets ?? []), ...(s.after ?? [])])
    .join("\n");
}

describe("Ringkasan pasien", () => {
  it.each(["A", "B", "C", "D", "E", "F"])("%s: six sections, 3 to 5 questions, not-inherited statement", (id) => {
    const s = run(id).summary;
    expect(s.sections.map((x) => x.title)).toEqual([
      "Apa yang diperiksa",
      "Apa hasilnya",
      "Apakah ini menurun ke anak?",
      "Pilihan pengobatan dan biaya",
      "Pertanyaan untuk dokter",
      "Peran keluarga",
    ]);
    const q = s.sections[4].bullets ?? [];
    expect(q.length).toBeGreaterThanOrEqual(3);
    expect(q.length).toBeLessThanOrEqual(5);
    expect(text(id)).toContain(NOT_INHERITED_TEXT);
  });

  it.each(["A", "B", "C", "D", "F"])("%s: roughly 150 to 250 words", (id) => {
    const n = summaryWordCount(run(id).summary);
    expect(n).toBeGreaterThanOrEqual(130);
    expect(n).toBeLessThanOrEqual(270);
  });

  it("A: shows the real price and that JKN does not cover it", () => {
    const t = text("A");
    expect(t).toContain("Rp87.025.221");
    expect(t).toContain("tidak dijamin JKN");
    expect(t).toContain("23 Okt 2026");
  });

  it("B: ERBB2 change explained without confusing it with HER2-positive status; no available option yet", () => {
    const t = text("B");
    expect(t).toMatch(/gen ERBB2 \(L755S\)/);
    expect(t).toMatch(/berbeda dengan status HER2 positif/);
    expect(t).toMatch(/belum ada pilihan obat yang sesuai dan tersedia/);
    expect(t).toMatch(/status aksesnya belum dinilai di Indonesia: neratinib/);
  });

  it("D: recommends a separate blood test for inherited genes", () => {
    expect(text("D")).toMatch(/tes darah terpisah untuk gen bawaan \(BRCA1 dan BRCA2\)/);
  });

  it("F: explains the result cannot be read as no mutation", () => {
    const t = text("F");
    expect(t).toMatch(/tidak berarti tumor Ibu tidak punya perubahan gen/);
    expect(t).toMatch(/8 dari 11/);
  });

  it("never claims a tumour variant is inherited", () => {
    for (const id of ["A", "B", "C", "D", "E", "F"]) {
      expect(text(id)).not.toMatch(/(varian|mutasi) (ini )?(bersifat )?(bawaan|diturunkan dari)/i);
    }
  });
});
