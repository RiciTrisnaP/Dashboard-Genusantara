import type { Metadata } from "next";
import Link from "next/link";
import { CaseHeader } from "@/components/CaseHeader";
import { NotNegativeAlert } from "@/components/NotNegativeAlert";
import { PrintButton, ReportStatus, SignatureLine, SignOffButton } from "@/components/ReportControls";
import { StatusBadge, statusText } from "@/components/StatusBadge";
import { TherapyGroup } from "@/components/TherapyGroup";
import { loadCase } from "@/lib/case";
import { getPatient, panel } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { describeSpecimen } from "@/lib/rules/sentinel";

export async function generateMetadata({ params }: PageProps<"/pasien/[id]/laporan">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Laporan Pilih Terapi, ${getPatient(id)?.displayName ?? "pasien"}` };
}

const METHOD_LABEL: Record<string, string> = { NGS_amplikon: "NGS amplikon", PCR: "PCR" };

export default async function ReportPage({ params }: PageProps<"/pasien/[id]/laporan">) {
  const { id } = await params;
  const result = loadCase(id);
  const { patient, sentinel, triase, reflex, trigger } = result;
  const c = patient.clinical;
  const test = patient.molecularTest;

  if (!triase.issued || !sentinel.tested || !test.done) {
    return (
      <>
        <CaseHeader result={result} active="laporan" />
        <section className="space-y-4 rounded-lg border-2 border-slate-300 bg-white p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">Laporan Pilih Terapi tidak diterbitkan</h2>
            <StatusBadge tone={sentinel.tested ? "block" : "neutral"} size="lg">
              {sentinel.tested ? `SENTINEL ${statusText(sentinel.verdict)}` : "BELUM DITES"}
            </StatusBadge>
          </div>
          {!triase.issued && <p className="text-slate-700">{triase.reason}</p>}
          {sentinel.tested && (
            <>
              <p className="text-slate-700">{sentinel.reason}</p>
              <NotNegativeAlert />
              {sentinel.s3.unreadable.length > 0 && (
                <p className="text-sm text-slate-700">
                  <strong>Tidak dinilai ({sentinel.s3.unreadable.length} target):</strong> {sentinel.s3.unreadable.join(", ")}.
                </p>
              )}
            </>
          )}
          {trigger.status === "PERLU_TES" && (
            <p className="text-slate-700">
              <strong>Pemicu tes: {trigger.label}.</strong> {trigger.suggestedSpecimen}
            </p>
          )}
          <Link
            href={`/pasien/${patient.id}/${sentinel.tested ? "reflex" : "sentinel"}`}
            className="inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {sentinel.tested ? "Lihat saran REFLEX" : "Lihat pemicu tes"}
          </Link>
        </section>
      </>
    );
  }

  const variantLines = triase.findings;

  return (
    <>
      <CaseHeader result={result} active="laporan" />
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <SignOffButton patientId={patient.id} />
        <PrintButton />
        <span className="text-xs text-slate-500">Laporan dicetak satu halaman A4. Banner SIMULASI ikut tercetak.</span>
      </div>

      <article className="print-tight mx-auto max-w-[210mm] space-y-4 rounded-lg border border-slate-300 bg-white p-6 text-sm shadow-sm print:max-w-none print:space-y-2 print:rounded-none print:border-0 print:p-0 print:text-[8pt] print:shadow-none">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-brand-700 pb-3 print:pb-1.5">
          <div>
            <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase print:text-[7pt]">
              OnkoTepat · TRIASE
            </p>
            <h2 className="text-xl font-bold text-slate-900 print:text-[13pt]">Laporan Pilih Terapi</h2>
            <p className="text-slate-700">
              {patient.displayName}, {patient.age} tahun · {c.subtype} · stadium {c.stage} ({c.setting})
            </p>
            <p className="text-slate-600">Terapi sebelumnya: {c.priorTherapies?.join("; ")}</p>
          </div>
          <div className="text-right">
            <ReportStatus patientId={patient.id} />
            <p className="mt-1 text-xs text-slate-600 print:text-[7pt]">
              {describeSpecimen(test.specimen)}
              <br />
              {METHOD_LABEL[test.method] ?? test.method}, {formatDate(test.date)}
            </p>
          </div>
        </header>

        {/* 1. QC */}
        <section className="avoid-break">
          <h3 className="mb-1 font-bold text-slate-900">1. Status mutu SENTINEL</h3>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ok">{statusText(sentinel.verdict)}</StatusBadge>
            <span>
              {sentinel.s3.readableCount} dari {sentinel.s3.totalTargets} target terbaca. {sentinel.reason}
            </span>
          </div>
          <p className="mt-1">
            <strong>Tidak dinilai:</strong>{" "}
            {triase.notAssessed.length ? triase.notAssessed.join(", ") : "tidak ada (semua target terbaca)"}.
          </p>
          {sentinel.s1.status !== "LAYAK" && <p className="mt-1 text-amber-900">Catatan S1: {sentinel.s1.reason}</p>}
          {sentinel.s2.warnings.map((w) => (
            <p key={w} className="mt-1 text-amber-900">
              Catatan S2: {w}
            </p>
          ))}
          <p className="mt-1 text-xs text-slate-500 print:text-[7pt]">
            Panel: {panel.targets.length} target codon ({panel.targets.map((t) => t.id).join(", ")}). Panel hotspot tidak
            mencakup PTEN dan BRCA1/2 secara utuh.
          </p>
        </section>

        {/* 2. Variants */}
        <section className="avoid-break">
          <h3 className="mb-1 font-bold text-slate-900">2. Varian terdeteksi dan tingkat bukti</h3>
          {triase.noActionableText && (
            <p className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-semibold text-slate-900 print:py-1">
              {triase.noActionableText}
            </p>
          )}
          {variantLines.length > 0 && (
            <table className="mt-1 w-full text-left text-xs print:text-[7.5pt]">
              <thead className="border-b border-slate-200 text-[11px] text-slate-500 print:text-[7pt]">
                <tr>
                  <th className="py-1 pr-3 font-semibold">Varian (somatik)</th>
                  <th className="py-1 pr-3 font-semibold">VAF</th>
                  <th className="py-1 pr-3 font-semibold">OncoKB</th>
                  <th className="py-1 pr-3 font-semibold">Level (payudara)</th>
                  <th className="py-1 pr-3 font-semibold">CIViC</th>
                  <th className="py-1 font-semibold">ClinVar</th>
                </tr>
              </thead>
              <tbody className="align-top">
                {variantLines.map(({ readout, evidence }) => {
                  const r = evidence.record;
                  return (
                    <tr key={readout.key}>
                      <td className="py-1 pr-3">
                        <div className="font-semibold">{readout.key}</div>
                        <div className="text-slate-500">{evidence.classLabel}</div>
                      </td>
                      <td className="py-1 pr-3">
                        {formatNumber(readout.variant.vaf)}% ({readout.variant.altReads} baca)
                      </td>
                      <td className="py-1 pr-3">
                        {r?.oncokb.link ? (
                          <a href={r.oncokb.link} className="text-brand-700 underline" target="_blank" rel="noreferrer">
                            {r.oncokb.oncogenicity}
                          </a>
                        ) : (
                          (r?.oncokb.oncogenicity ?? "tidak ada di tabel bukti")
                        )}
                      </td>
                      <td className="py-1 pr-3 font-semibold">
                        {r?.oncokb.highestLevelBreast ? `Level ${r.oncokb.highestLevelBreast}` : "Tidak ada level"}
                      </td>
                      <td className="py-1 pr-3">
                        {r?.civic.link ? (
                          <a href={r.civic.link} className="text-brand-700 underline" target="_blank" rel="noreferrer">
                            {r.civic.molecularProfile}
                          </a>
                        ) : (
                          (r?.civic.note ?? "-")
                        )}
                        {r?.civic.bestPredictiveBreast && ` (payudara: ${r.civic.bestPredictiveBreast})`}
                      </td>
                      <td className="py-1">
                        {r?.clinvar.link ? (
                          <a href={r.clinvar.link} className="text-brand-700 underline" target="_blank" rel="noreferrer">
                            {r.clinvar.vcv}
                          </a>
                        ) : (
                          (r?.clinvar.note ?? "-")
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {triase.reviewVariants.length > 0 && (
            <p className="mt-1 text-amber-900">
              Perlu ditinjau, tidak dipakai untuk pilihan terapi: {triase.reviewVariants.map((v) => `${v.key} (${v.reason})`).join("; ")}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500 print:text-[7pt]">
            Varian tumor bersifat somatik; status bawaan (germline) hanya dapat dipastikan dengan tes darah terpisah.
          </p>
        </section>

        {/* 3. Therapy options */}
        <section className="space-y-2 print:space-y-1">
          <h3 className="font-bold text-slate-900">3. Pilihan terapi, diurutkan menurut akses di Indonesia</h3>
          <p className="text-xs text-slate-600 print:text-[7pt]">
            Cocok dengan varian belum berarti obat bisa diperoleh atau dijamin. Status BPOM, JKN, dan harga dicek tim pada{" "}
            {triase.accessCheckedDate}.
          </p>
          <TherapyGroup id="A" options={triase.groups.A} />
          <TherapyGroup id="B" options={triase.groups.B} />
          <TherapyGroup id="C" options={triase.groups.C} />
        </section>

        {/* 4. REFLEX */}
        <section className="avoid-break">
          <h3 className="mb-1 font-bold text-slate-900">4. Saran tes lanjutan (REFLEX, butuh persetujuan dokter)</h3>
          {reflex.items.length === 0 ? (
            <p className="text-slate-600">Tidak ada saran tes lanjutan dari aturan.</p>
          ) : (
            <ul className="list-disc space-y-0.5 pl-5">
              {reflex.items.map((i) => (
                <li key={i.id}>{i.advice.join(" ")}</li>
              ))}
            </ul>
          )}
        </section>

        {/* Footer */}
        <footer className="avoid-break space-y-1 border-t border-slate-300 pt-2 text-xs print:pt-1 print:text-[7pt]">
          <SignatureLine patientId={patient.id} />
          <p className="text-slate-600">Basis bukti: {triase.evidenceVersion}. Ambang mutu adalah nilai demo.</p>
          <p className="font-semibold text-slate-800">{triase.footer}</p>
        </footer>
      </article>
    </>
  );
}
