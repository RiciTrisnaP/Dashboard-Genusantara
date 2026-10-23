// Ringkasan Pasien (plain-language summary). docs/rules_spec.md section 5.
import type { Panel, Patient } from "../types";
import type { ReflexResult } from "./reflex";
import type { SentinelResult } from "./sentinel";
import type { TriaseResult } from "./triase";

export interface SummarySection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  /** Paragraphs shown after the bullets. */
  after?: string[];
}

export interface PatientSummary {
  sections: SummarySection[];
}

export const NOT_INHERITED_TEXT = "Mutasi di tumor ini tidak diturunkan ke anak.";

const GENE_PLAIN: Record<string, string> = {
  PIK3CA: "Gen ini ikut mengatur pertumbuhan sel.",
  AKT1: "Gen ini ikut mengatur pertumbuhan sel.",
  ESR1: "Gen ini membuat reseptor hormon estrogen. Perubahannya sering muncul setelah terapi hormon dan bisa membuat terapi hormon tertentu kurang bekerja.",
  ERBB2: "Gen ini (HER2) ikut mengatur pertumbuhan sel.",
};

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildPatientSummary(
  patient: Patient,
  panel: Panel,
  sentinel: SentinelResult,
  reflex: ReflexResult,
  triase: TriaseResult,
): PatientSummary {
  const genes = [...new Set(panel.targets.map((t) => t.gene))];
  const total = panel.targets.length;
  const test = patient.molecularTest;
  const brcaHint = reflex.items.some((i) => i.id === "PETUNJUK_BRCA_BAWAAN");
  const sections: SummarySection[] = [];

  // 1. Apa yang diperiksa
  if (!test.done) {
    sections.push({
      title: "Apa yang diperiksa",
      paragraphs: [
        `Ibu belum menjalani tes ini. Karena kanker Ibu memburuk setelah terapi hormon, tim dokter dapat mempertimbangkan tes perubahan gen di sel tumor pada ${total} titik di gen ${genes.join(", ")}.`,
        "Tes ini memeriksa gen di sel tumor, bukan gen bawaan yang diwarisi dari orang tua.",
      ],
    });
  } else {
    const sample =
      test.specimen.type === "plasma_ctDNA"
        ? "darah Ibu (potongan DNA tumor yang ikut beredar di darah)"
        : `jaringan tumor Ibu${test.specimen.site ? ` dari ${test.specimen.site.replace(/\s*\(.*\)$/, "")}` : ""}`;
    sections.push({
      title: "Apa yang diperiksa",
      paragraphs: [
        `Kami memeriksa ${sample}. Yang dicari adalah perubahan pada ${total} titik di gen ${genes.join(", ")}. Ini adalah gen di sel tumor, bukan gen bawaan yang diwarisi dari orang tua.`,
      ],
    });
  }

  // 2. Apa hasilnya
  const results: string[] = [];
  if (!test.done || !sentinel.tested) {
    results.push("Belum ada hasil.");
  } else if (sentinel.verdict !== "LANJUT") {
    results.push(
      `Sampel belum cukup baik untuk dibaca: hanya ${sentinel.s3.readableCount} dari ${sentinel.s3.totalTargets} titik yang terbaca.`,
      "Ini tidak berarti tumor Ibu tidak punya perubahan gen. Artinya hasilnya belum bisa disimpulkan dan tesnya perlu diulang atau diganti.",
    );
  } else if (triase.issued) {
    for (const f of triase.findings) {
      const { gene, protein } = f.readout.variant;
      if (f.evidence.actionable) {
        results.push(`Ditemukan perubahan pada gen ${gene} (${protein}). ${GENE_PLAIN[gene] ?? ""}`.trim());
      } else {
        results.push(
          `Ditemukan perubahan pada gen ${gene} (${protein}) yang maknanya belum jelas, sehingga belum dipakai untuk memilih obat.`,
        );
      }
    }
    if (triase.noActionableText) {
      results.push(
        `Tidak ditemukan perubahan yang bisa dipakai untuk memilih obat pada ${sentinel.s3.readableCount} titik yang diperiksa. Tes ini hanya melihat sebagian kecil gen, jadi ini bukan jaminan tidak ada perubahan lain.`,
      );
    }
    if (triase.notAssessed.length > 0) {
      results.push(`${triase.notAssessed.length} titik tidak terbaca dan tidak dinilai.`);
    }
    if (triase.groups.C.length > 0 && triase.groups.A.length === 0 && triase.groups.B.length === 0) {
      results.push(
        "Obat yang terkait perubahan ini dibuat untuk jenis kanker payudara yang berbeda dari jenis kanker Ibu, sehingga belum cocok untuk Ibu.",
      );
    }
  }
  sections.push({ title: "Apa hasilnya", paragraphs: results });

  // 3. Diturunkan ke anak?
  const inherit = [NOT_INHERITED_TEXT];
  if (brcaHint) {
    inherit.push(
      "Karena ada petunjuk dari riwayat keluarga, usia, atau jenis kanker, dokter mungkin menyarankan tes darah terpisah untuk gen bawaan (BRCA1 dan BRCA2) dengan konseling genetik. Hanya tes itu yang bisa menjawab soal risiko bagi keluarga.",
    );
  }
  sections.push({ title: "Apakah ini menurun ke anak?", paragraphs: inherit });

  // 4. Pilihan pengobatan dan biaya
  const options: string[] = [];
  if (triase.issued) {
    for (const o of triase.groups.A) {
      const name = o.brand ? `${o.brand}, yaitu ${o.regimen}` : capitalizeFirst(o.regimen);
      const jkn = o.jknCovered ? `dijamin JKN (${o.jknText.replace(/^Dijamin JKN: /, "")})` : "tidak dijamin JKN";
      const price = o.price != null ? `Harga ${o.priceText.replace(/\s*\(.*\)$/, "")}` : "Harga belum dicek";
      const extra = o.isFallback ? " Ini terapi hormon yang tersedia, bukan obat khusus untuk perubahan ESR1." : "";
      options.push(`${name}: tersedia di Indonesia, ${jkn}. ${price}.${extra}`);
    }
  }
  const lead: string[] = [];
  const after: string[] = [];
  if (!test.done) {
    lead.push("Pilihan obat berdasarkan perubahan gen baru bisa dibahas setelah ada hasil tes.");
  } else if (!triase.issued) {
    lead.push("Pilihan obat berdasarkan perubahan gen baru bisa dibahas setelah ada hasil yang layak dibaca.");
  } else if (options.length === 0) {
    lead.push("Dari tes ini belum ada pilihan obat yang sesuai dan tersedia. Dokter akan membahas pengobatan lain bersama Ibu.");
  } else {
    lead.push("Pilihan yang sesuai dan tersedia di Indonesia saat ini:");
  }
  if (triase.issued) {
    const unavailable = triase.groups.B.map((o) => o.drug);
    if (unavailable.length > 0) {
      after.push(
        `Ada juga obat yang terkait hasil ini tetapi belum terdaftar atau belum ditemukan di Indonesia: ${unavailable.join(", ")}.`,
      );
    }
    after.push(`Status akses dan harga dicek tim pada ${triase.accessCheckedDate}. Keputusan obat tetap di tangan dokter.`);
  }
  sections.push({
    title: "Pilihan pengobatan dan biaya",
    paragraphs: lead,
    bullets: options.length ? options : undefined,
    after: after.length ? after : undefined,
  });

  // 5. Pertanyaan untuk dokter
  const questions: string[] = [];
  if (!test.done) {
    questions.push(
      "Apakah saya perlu tes perubahan gen di tumor sekarang?",
      "Sampel apa yang dipakai: jaringan, darah, atau keduanya?",
      "Berapa biaya tesnya dan siapa yang menanggung?",
      "Berapa lama hasilnya keluar, dan apakah pengobatan perlu menunggu?",
    );
  } else if (!sentinel.tested || sentinel.verdict !== "LANJUT") {
    questions.push(
      "Sampel apa yang akan dipakai untuk tes ulang, dan kapan?",
      "Apakah tes darah (ctDNA) bisa menjadi pilihan untuk saya?",
      "Apakah pengobatan saya perlu menunggu hasil tes ulang?",
      "Berapa biaya tes ulang?",
    );
  } else if (options.length > 0) {
    questions.push(
      "Apakah obat ini cocok untuk kondisi saya sekarang?",
      "Berapa total biaya per bulan, dan adakah program bantuan biaya?",
      "Efek samping apa yang perlu saya laporkan, dan kepada siapa?",
      "Kapan dan bagaimana hasil pengobatan akan dinilai?",
    );
  } else {
    questions.push(
      "Apa pilihan pengobatan saya berikutnya?",
      "Apakah saya perlu tes gen yang lebih luas?",
      "Berapa biaya tes lanjutan, dan siapa yang menanggung?",
    );
  }
  if (brcaHint) questions.push("Apakah saya perlu tes gen bawaan BRCA1/2 dan konseling genetik?");
  sections.push({ title: "Pertanyaan untuk dokter", paragraphs: [], bullets: questions.slice(0, 5) });

  // 6. Peran keluarga
  const family = [
    "Keluarga dapat menemani saat konsultasi, membantu mencatat jadwal obat dan keluhan, serta ikut menyusun rencana biaya.",
  ];
  if (brcaHint) {
    family.push("Bila tes gen bawaan dilakukan, hasilnya mungkin juga penting bagi saudara perempuan dan anak; bicarakan bersama konselor genetik.");
  }
  sections.push({ title: "Peran keluarga", paragraphs: family });

  return { sections };
}

export function summaryWordCount(summary: PatientSummary): number {
  return summary.sections
    .flatMap((s) => [s.title, ...s.paragraphs, ...(s.bullets ?? []), ...(s.after ?? [])])
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}
