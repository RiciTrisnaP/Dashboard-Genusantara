import { ArrowRight, Database, Droplet, FlaskConical, Lock, Microscope, RefreshCw, SearchCheck, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CaseBody, CaseHeader, shortName, VerdictBadge } from "@/components/CaseHeader";
import { NotNegativeAlert } from "@/components/NotNegativeAlert";
import { PrintReport } from "@/components/PrintReport";
import { ReportEyebrow, ReportStatusBadge, ReportStatusPanel, SignatureBlock } from "@/components/ReportControls";
import { SimActionButton } from "@/components/SimActionButton";
import { TherapyGroups } from "@/components/TherapyGroup";
import { ApprovalBadge, btnPrimary, btnSecondary, SectionNumber } from "@/components/ui";
import { loadCase } from "@/lib/case";
import { drugAccess, getPatient, panel } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import type { CaseResult } from "@/lib/rules";
import { describeSpecimen } from "@/lib/rules/sentinel";

export async function generateMetadata({ params }: PageProps<"/pasien/[id]/laporan">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Laporan Pilih Terapi, ${getPatient(id)?.displayName ?? "pasien"}` };
}

function headline(result: CaseResult): string {
  const t = result.triase;
  if (!t.issued) return "";
  const realA = t.groups.A.filter((o) => !o.isFallback);
  if (realA.length > 0) return `${realA.length} pilihan terapi sesuai dan tersedia`;
  if (t.groups.A.some((o) => o.isFallback)) return "varian ESR1, terapi khusus ESR1 belum tersedia";
  if (t.noActionableText) return "tidak terdeteksi varian yang dapat ditindaklanjuti";
  if (t.groups.B.length > 0) return "pilihan terapi sesuai, belum tersedia di Indonesia";
  return "pilihan terapi tidak sesuai indikasi";
}

function Section({ n, title, children, extra }: { n: number; title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white px-4 py-6 sm:px-8 sm:py-7">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="flex items-start gap-3 text-xl font-semibold sm:text-2xl">
          <SectionNumber n={n} />
          <span>{title}</span>
        </h3>
        {extra}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function NotIssued({ result }: { result: CaseResult }) {
  const { patient, sentinel, trigger, reflex } = result;
  const untested = !sentinel.tested;
  return (
    <div className="mx-auto max-w-[920px] overflow-hidden rounded-2xl border border-line bg-white">
      <div className="space-y-4 p-8 sm:p-12">
        <span className={`flex size-16 items-center justify-center rounded-2xl ${untested ? "bg-warn-bg text-warn" : "bg-bad-bg text-bad"}`}>
          {untested ? (
            <FlaskConical aria-hidden className="size-8" strokeWidth={1.75} />
          ) : (
            <Lock aria-hidden className="size-8" strokeWidth={1.75} />
          )}
        </span>
        <p className="text-xs font-semibold tracking-[0.12em] text-ink-2 uppercase">Laporan Pilih Terapi</p>
        <h2 className="text-3xl font-bold sm:text-4xl">
          {untested ? "Belum ada hasil tes molekuler" : `Laporan tidak diterbitkan karena SENTINEL: ${sentinel.verdict.replace("_", " ")}`}
        </h2>
        <p className="text-lg text-ink-2">
          {untested
            ? `${shortName(patient.displayName)} ${trigger.status === "PERLU_TES" ? "memenuhi pemicu tes" : "belum dites"}: ${trigger.reason} Laporan Pilih Terapi baru dapat disusun setelah hasil tes lolos SENTINEL.`
            : `${sentinel.reason} Tidak ada dasar yang cukup untuk memilih terapi.`}
        </p>
        {!untested && <NotNegativeAlert compact />}
      </div>
      <div className="space-y-4 border-t border-line bg-canvas p-8 sm:px-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold">{untested ? "Spesimen yang disarankan" : "Saran REFLEX untuk mendapatkan hasil yang layak"}</h3>
          <ApprovalBadge size="md" />
        </div>
        {untested ? (
          <ul className="space-y-3">
            <li className="flex gap-4 rounded-xl border border-line bg-white p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Microscope aria-hidden className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-lg font-semibold">
                  Jaringan FFPE: untuk panel {panel.shortName} ({[...new Set(panel.targets.map((t) => t.gene))].join(", ")})
                </p>
                <p className="text-ink-2">Blok biopsi yang ada dapat dipakai bila sel tumor cukup dan tidak didekalsifikasi.</p>
              </div>
            </li>
            <li className="flex gap-4 rounded-xl border border-line bg-white p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Droplet aria-hidden className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-lg font-semibold">Plasma ctDNA: tes ESR1 terpisah</p>
                <p className="text-ink-2">
                  ESR1 tidak termasuk {panel.shortName}. Mutasi ESR1 biasanya muncul setelah terapi hormon; diambil dari darah.
                </p>
              </div>
            </li>
          </ul>
        ) : (
          <ul className="space-y-3">
            {reflex.items.flatMap((item) =>
              item.advice.map((a, i) => (
                <li key={`${item.id}-${i}`} className="flex gap-4 rounded-xl border border-line bg-white p-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    {/plasma|darah/i.test(a) ? (
                      <Droplet aria-hidden className="size-5" strokeWidth={1.75} />
                    ) : (
                      <RefreshCw aria-hidden className="size-5" strokeWidth={1.75} />
                    )}
                  </span>
                  <div>
                    <p className="text-lg font-semibold">{a}</p>
                    <p className="text-ink-2">{item.title}</p>
                  </div>
                </li>
              )),
            )}
          </ul>
        )}
        <div className="flex flex-wrap gap-3 pt-2">
          {untested ? (
            <>
              <SimActionButton
                actionKey={`testrequest:${patient.id}`}
                label="Buat permintaan tes (simulasi)"
                doneLabel="Permintaan tes tercatat (simulasi)"
                icon="arrow"
              />
              <Link href="/pasien" className={btnSecondary}>
                <Users aria-hidden className="size-4" strokeWidth={2} />
                Kembali ke Daftar Pasien
              </Link>
            </>
          ) : (
            <>
              <Link href={`/pasien/${patient.id}/reflex`} className={btnPrimary}>
                <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
                Buka REFLEX
              </Link>
              <Link href={`/pasien/${patient.id}/sentinel`} className={btnSecondary}>
                <ShieldCheck aria-hidden className="size-4" strokeWidth={2} />
                Lihat detail SENTINEL
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EvidenceNote({ checked }: { checked: string }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-6">
        <p className="flex items-center gap-2 font-semibold">
          <Database aria-hidden className="size-4 text-primary" strokeWidth={1.75} />
          Versi bukti
        </p>
        <dl className="mt-3 space-y-1.5 text-sm">
          {[
            ["OncoKB", "v7.6 · data 30 Sep 2026"],
            ["CIViC", `dicek ${checked}`],
            ["ClinVar", `dicek ${checked}`],
            ["BPOM, JKN, harga", `dicek ${checked}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-ink-2">{k}</dt>
              <dd className="font-mono">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="px-1 text-sm text-ink-3">
        Laporan disusun otomatis berdasarkan aturan. Obat yang tercantum adalah pilihan untuk dibahas, bukan resep.
      </p>
    </div>
  );
}

export default async function ReportPage({ params }: PageProps<"/pasien/[id]/laporan">) {
  const { id } = await params;
  const result = loadCase(id);
  const { patient, sentinel, triase, reflex } = result;
  const test = patient.molecularTest;

  if (!triase.issued || !sentinel.tested || !test.done) {
    return (
      <>
        <CaseHeader result={result} active="laporan" />
        <CaseBody>
          <NotIssued result={result} />
        </CaseBody>
      </>
    );
  }

  const checked = formatDate(drugAccess.checkedDate);
  const isPlasma = test.specimen.type === "plasma_ctDNA";

  return (
    <>
      <CaseHeader result={result} active="laporan" />
      <CaseBody>
        <PrintReport result={result} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] print:hidden">
          <article className="space-y-6">
            <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-6 sm:px-8">
              <div>
                <p className="text-xs font-semibold tracking-[0.1em] text-ink-2 uppercase">
                  <ReportEyebrow patientId={patient.id} />
                </p>
                <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">
                  {shortName(patient.displayName)} · {headline(result)}
                </h2>
              </div>
              <ReportStatusBadge patientId={patient.id} />
            </header>

            <Section n={1} title="Status mutu dan target yang tidak dinilai">
              <div className="flex flex-wrap items-center gap-4">
                <VerdictBadge result={result} prefix size="md" />
                <p className="text-lg font-semibold">
                  {sentinel.s3.readableCount} dari {sentinel.s3.totalTargets} target terbaca. Target tidak dinilai:{" "}
                  {triase.notAssessed.length ? triase.notAssessed.join(", ") : "tidak ada"}.
                </p>
              </div>
              <p className="mt-3 text-ink-2">
                {describeSpecimen(test.specimen)}. {sentinel.reason}
              </p>
              {sentinel.s1.status !== "LAYAK" && <p className="mt-2 text-warn">Catatan S1: {sentinel.s1.reason}</p>}
              {sentinel.s2.warnings.map((w) => (
                <p key={w} className="mt-2 text-warn">
                  Catatan S2: {w}
                </p>
              ))}
            </Section>

            <Section n={2} title={triase.findings.length ? `Varian terdeteksi di ${isPlasma ? "plasma (ctDNA)" : "jaringan tumor"}` : "Hasil varian"}>
              {triase.noActionableText && triase.findings.length === 0 && (
                <div className="flex gap-4 rounded-xl border border-line bg-canvas p-6">
                  <SearchCheck aria-hidden className="mt-1 size-6 shrink-0 text-ink-2" strokeWidth={1.75} />
                  <div>
                    <p className="text-xl font-semibold">{triase.noActionableText}</p>
                    <p className="mt-2 text-ink-2">
                      Pernyataan ini hanya berlaku untuk {panel.targets.length} target panel {panel.shortName}. Gen dan area di
                      luar panel, termasuk ESR1, PTEN secara utuh, dan BRCA1/2, tidak diperiksa. Lihat saran REFLEX di bagian 4.
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {triase.findings.map(({ readout, evidence }) => {
                  const r = evidence.record;
                  const cells: [string, React.ReactNode][] = [
                    ["VAF", `${formatNumber(readout.variant.vaf)}%`],
                    ["OncoKB", r?.oncokb.link ? <a href={r.oncokb.link} target="_blank" rel="noreferrer" className="hover:underline">{r.oncokb.oncogenicity}</a> : (r?.oncokb.oncogenicity ?? "tidak ada")],
                    ["Tingkat bukti", r?.oncokb.highestLevelBreast ? `Level ${r.oncokb.highestLevelBreast}` : "tidak ada"],
                    ["CIViC", r?.civic.link ? <a href={r.civic.link} target="_blank" rel="noreferrer" className="hover:underline">{r.civic.molecularProfile}</a> : (r?.civic.note ?? "-")],
                    ["ClinVar", r?.clinvar.link ? <a href={r.clinvar.link} target="_blank" rel="noreferrer" className="hover:underline">{r.clinvar.vcv}</a> : (r?.clinvar.note ?? "-")],
                  ];
                  return (
                    <div key={readout.key} className="rounded-xl border border-primary/30 bg-primary-soft px-4 py-5 sm:px-6">
                      <div className="flex flex-wrap items-end gap-x-8 gap-y-3 sm:gap-x-10">
                        <div className="min-w-[150px]">
                          <p className="font-mono font-semibold text-primary-strong">{readout.variant.gene}</p>
                          <p className="font-mono text-3xl font-semibold sm:text-4xl">{readout.variant.protein}</p>
                        </div>
                        {cells.map(([k, v]) => (
                          <div key={k}>
                            <p className="text-xs font-semibold tracking-[0.1em] text-ink-3 uppercase">{k}</p>
                            <p className="font-mono text-lg font-semibold">{v}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-sm text-ink-2">{evidence.classLabel}</p>
                    </div>
                  );
                })}
              </div>
              {triase.reviewVariants.length > 0 && (
                <p className="mt-3 text-warn">
                  Perlu ditinjau, tidak dipakai untuk pilihan terapi: {triase.reviewVariants.map((v) => `${v.key} (${v.reason})`).join("; ")}
                </p>
              )}
              {triase.findings.length > 0 && (
                <p className="mt-3 text-sm text-ink-3">
                  Varian di tumor bersifat somatik. Status bawaan (germline) hanya dapat dinilai dengan tes darah terpisah.
                </p>
              )}
            </Section>

            <Section n={3} title="Pilihan terapi">
              <TherapyGroups groups={triase.groups} readableCount={sentinel.s3.readableCount} />
            </Section>

            <Section n={4} title="Saran REFLEX" extra={<ApprovalBadge size="md" />}>
              {reflex.items.length === 0 ? (
                <p className="text-ink-2">Tidak ada saran tes lanjutan dari aturan.</p>
              ) : (
                <ol className="space-y-3">
                  {reflex.items.map((item, i) => (
                    <li key={item.id} className="flex gap-3">
                      <span className="font-semibold text-primary">{i + 1}.</span>
                      <div>
                        <p className="text-lg font-semibold">{item.advice[0]}</p>
                        <p className="text-ink-2">Alasan: {item.advice.slice(1).join(" ") || item.reason}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              <Link href={`/pasien/${patient.id}/reflex`} className="mt-4 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
                Buka REFLEX untuk detail dan persetujuan
                <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
              </Link>
            </Section>

            <footer className="space-y-3 rounded-2xl border border-line bg-white px-4 py-6 sm:px-8">
              <SignatureBlock patientId={patient.id} reportId={`LPT-SIM-${patient.id}`} />
              <div className="border-t border-line pt-3">
                <p className="font-semibold">{triase.footer}</p>
                <p className="mt-1 text-sm text-ink-3">Versi bukti: {triase.evidenceVersion}</p>
              </div>
            </footer>
          </article>

          <aside className="order-first space-y-4 self-start lg:sticky lg:top-12 lg:order-none">
            <ReportStatusPanel patientId={patient.id} />
            <div className="hidden lg:block">
              <EvidenceNote checked={checked} />
            </div>
          </aside>
          {/* On phones the evidence card follows the report instead of sitting above it. */}
          <div className="lg:hidden">
            <EvidenceNote checked={checked} />
          </div>
        </div>
      </CaseBody>
    </>
  );
}
