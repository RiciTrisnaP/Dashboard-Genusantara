// REFLEX next-step suggestions, after testing. docs/rules_spec.md section 3.
// Every rule that fires is returned, in rule order. Always a suggestion that needs doctor approval.
import type { Patient } from "../types";
import type { SentinelResult } from "./sentinel";

export const REFLEX_LABEL = "Saran, butuh persetujuan dokter";

export type ReflexRuleId =
  | "MUTU_GAGAL"
  | "TARGET_TIDAK_TERBACA"
  | "PANEL_NEGATIF_KEBUTUHAN_BESAR"
  | "PETUNJUK_BRCA_BAWAAN"
  | "PLASMA_NEGATIF"
  | "ESR1_BELUM_DINILAI";

export interface ReflexItem {
  order: number;
  id: ReflexRuleId;
  title: string;
  /** Concrete next steps, shown as a list. */
  advice: string[];
  /** Why the rule fired. */
  reason: string;
}

export interface ReflexResult {
  label: typeof REFLEX_LABEL;
  applicable: boolean;
  reason: string;
  items: ReflexItem[];
}

/** Targets where a failed read changes the drug choice (rule 2). */
export function isDrugCriticalTarget(target: string): boolean {
  return ["PIK3CA H1047", "PIK3CA E545", "PIK3CA E542", "AKT1 E17"].includes(target) || target.startsWith("ESR1 ");
}

export function hasFamilyHistoryHint(familyHistory: string | undefined): boolean {
  if (!familyHistory) return false;
  const text = familyHistory.toLowerCase().trim();
  if (text === "tidak ada" || text.startsWith("tidak ada ")) return false;
  return /payudara|ovarium/.test(text);
}

export function evaluateReflex(patient: Patient, sentinel: SentinelResult): ReflexResult {
  if (!sentinel.tested || !patient.molecularTest.done) {
    return {
      label: REFLEX_LABEL,
      applicable: false,
      reason: "Belum ada hasil tes. REFLEX berjalan sesudah tes; sebelum tes, lihat pemicu tes.",
      items: [],
    };
  }

  const test = patient.molecularTest;
  const c = patient.clinical;
  const items: ReflexItem[] = [];
  const passedCount = sentinel.s4.passed.length;
  const isPlasma = test.specimen.type === "plasma_ctDNA";
  const isTissue = test.specimen.type === "jaringan_FFPE";

  // 1. Mutu gagal
  if (sentinel.verdict !== "LANJUT") {
    const causes = new Set(sentinel.s2.causes.map((x) => x.code));
    const advice: string[] = [];
    if (causes.has("DECALCIFIED") || causes.has("DNA_DAMAGED")) {
      advice.push("Tes plasma ctDNA, atau gunakan blok jaringan lain yang bukan tulang.");
    }
    if (causes.has("LOW_TUMOR_CONTENT")) {
      advice.push("Pilih blok dengan kadar sel tumor lebih tinggi atau lakukan makrodiseksi.");
    }
    if (causes.has("PLASMA_TOO_LATE")) {
      advice.push("Ambil ulang darah dan proses plasma secepatnya setelah pengambilan.");
    }
    if (advice.length === 0) {
      advice.push("Ulangi dari pustaka atau sekuensing; bila tetap gagal, gunakan spesimen lain.");
    }
    items.push({
      order: 1,
      id: "MUTU_GAGAL",
      title: "Mutu gagal: tahan laporan",
      advice,
      reason: sentinel.reason,
    });
  }

  // 2. Target tertentu tidak terbaca
  if (sentinel.s3.status === "SEBAGIAN") {
    const critical = sentinel.s3.unreadable.filter(isDrugCriticalTarget);
    const advice = [`Laporkan area yang tidak dinilai: ${sentinel.s3.unreadable.join(", ")}.`];
    if (critical.length > 0) advice.push(`Ulangi, target ini penting untuk pilihan obat: ${critical.join(", ")}.`);
    items.push({
      order: 2,
      id: "TARGET_TIDAK_TERBACA",
      title: "Target tertentu tidak terbaca",
      advice,
      reason: sentinel.s3.reason,
    });
  }

  // 3. Panel negatif, kebutuhan klinis besar
  if (
    sentinel.verdict === "LANJUT" &&
    passedCount === 0 &&
    (c.setting === "metastatik" || c.setting === "kambuh")
  ) {
    items.push({
      order: 3,
      id: "PANEL_NEGATIF_KEBUTUHAN_BESAR",
      title: "Tidak ada varian pada panel, kebutuhan klinis besar",
      advice: [
        "Pertimbangkan profil genomik yang lebih luas (NGS panel besar).",
        "Panel hotspot tidak mencakup PTEN dan BRCA1/2 secara utuh.",
      ],
      reason: `Tidak ada varian lulus pada ${sentinel.s3.readableCount} target yang terbaca, dan penyakit ${c.setting}.`,
    });
  }

  // 4. Petunjuk BRCA bawaan
  const brcaHints: string[] = [];
  if (hasFamilyHistoryHint(c.familyHistory)) brcaHints.push(`riwayat keluarga: ${c.familyHistory}`);
  if (patient.age < 40) brcaHints.push(`usia ${patient.age} tahun (di bawah 40)`);
  if (c.subtype === "triple-negatif") brcaHints.push("subtipe triple-negatif");
  if (brcaHints.length > 0) {
    items.push({
      order: 4,
      id: "PETUNJUK_BRCA_BAWAAN",
      title: "Ada petunjuk BRCA bawaan",
      advice: [
        "Rujuk tes germline BRCA1/2 dari darah dengan konseling genetik (PNPK 2026).",
        "Varian di tumor tidak menunjukkan bawaan; hanya tes germline dari darah yang dapat menjawabnya.",
      ],
      reason: `Petunjuk: ${brcaHints.join("; ")}.`,
    });
  }

  // 5. Plasma negatif (only meaningful when the test was readable)
  if (isPlasma && passedCount === 0 && sentinel.verdict === "LANJUT") {
    items.push({
      order: 5,
      id: "PLASMA_NEGATIF",
      title: "Tidak ada varian pada plasma",
      advice: [
        "Hasil plasma negatif belum tentu informatif (kadar ctDNA bisa rendah); pertimbangkan tes jaringan.",
      ],
      reason: "Spesimen plasma ctDNA tanpa varian lulus.",
    });
  }

  // 6. ESR1 belum dinilai saat progresi
  if (c.progressedOnEndocrine === true && isTissue) {
    items.push({
      order: 6,
      id: "ESR1_BELUM_DINILAI",
      title: "ESR1 belum dinilai saat progresi",
      advice: ["Pertimbangkan tes plasma ctDNA untuk ESR1."],
      reason: "Penyakit memburuk setelah terapi endokrin, dan yang dites hanya jaringan. Mutasi ESR1 biasanya muncul setelah terapi hormon dan paling baik dicari di darah.",
    });
  }

  return {
    label: REFLEX_LABEL,
    applicable: true,
    reason: items.length ? `${items.length} saran.` : "Tidak ada saran tes lanjutan dari aturan.",
    items,
  };
}
