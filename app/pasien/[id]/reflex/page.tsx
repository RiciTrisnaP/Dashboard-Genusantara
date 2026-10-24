import { CircleDashed, Droplet, FileText, Microscope, Stethoscope } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CaseBody, CaseHeader, VerdictBadge } from "@/components/CaseHeader";
import { NotNegativeAlert } from "@/components/NotNegativeAlert";
import { SimActionButton } from "@/components/SimActionButton";
import { ApprovalBadge, btnSecondary, Eyebrow } from "@/components/ui";
import { loadCase } from "@/lib/case";
import { getPatient, panel } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/pasien/[id]/reflex">): Promise<Metadata> {
  const { id } = await params;
  return { title: `REFLEX, ${getPatient(id)?.displayName ?? "pasien"}` };
}

export default async function ReflexPage({ params }: PageProps<"/pasien/[id]/reflex">) {
  const { id } = await params;
  const result = loadCase(id);
  const { reflex, sentinel, trigger, triase, patient } = result;
  const test = patient.molecularTest;
  const panelGenes = new Set(panel.targets.map((t) => t.gene));

  // What this panel does not cover, shown so a "no variant" result is never over-read.
  const notCovered: { name: string; text: string }[] = [
    { name: "PTEN", text: panelGenes.has("PTEN") ? "Hanya titik hotspot tertentu" : "Tidak termasuk target panel" },
    { name: "BRCA1/2", text: "Tidak termasuk target panel; dinilai lewat tes germline dari darah" },
  ];
  if (!panelGenes.has("ESR1")) {
    notCovered.unshift({ name: "ESR1", text: `Tidak termasuk ${panel.shortName}; dinilai lewat tes plasma ctDNA terpisah` });
  } else if (test.done && test.specimen.type === "jaringan_FFPE") {
    notCovered.push({ name: "ESR1 di darah", text: "Belum dinilai; tes ini memakai jaringan" });
  }

  const summaryLine =
    !sentinel.tested
      ? null
      : sentinel.verdict !== "LANJUT"
        ? sentinel.reason
        : triase.issued && triase.noActionableText
          ? triase.noActionableText
          : `${sentinel.s4.passed.length} varian lulus: ${sentinel.s4.passed.map((v) => v.key).join(", ")}.`;

  return (
    <>
      <CaseHeader result={result} active="reflex" />
      <CaseBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Eyebrow>REFLEX · saran tes lanjutan</Eyebrow>
                <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">
                  {reflex.applicable
                    ? reflex.items.length > 0
                      ? `${reflex.items.length} langkah yang dapat dipertimbangkan`
                      : "Tidak ada saran tes lanjutan"
                    : "Belum ada hasil tes"}
                </h2>
                <p className="mt-1 text-ink-2">Setiap langkah adalah saran. Tidak ada tes yang dipesan otomatis.</p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border-2 border-warn-solid bg-warn-bg px-5 py-3 text-warn">
                <Stethoscope aria-hidden className="size-7" strokeWidth={1.75} />
                <div>
                  <p className="text-xl font-semibold">Butuh persetujuan dokter</p>
                  <p className="text-sm">Berlaku untuk semua langkah di bawah</p>
                </div>
              </div>
            </div>

            {summaryLine && (
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white px-5 py-4">
                <VerdictBadge result={result} prefix size="md" />
                <p className="text-lg font-semibold">{summaryLine}</p>
              </div>
            )}

            {sentinel.tested && sentinel.verdict !== "LANJUT" && <NotNegativeAlert compact />}

            {!reflex.applicable ? (
              <div className="rounded-2xl border border-line bg-white p-6">
                <p className="text-lg text-ink-2">{reflex.reason}</p>
                {trigger.status === "PERLU_TES" && (
                  <div className="mt-4 space-y-3">
                    <p className="font-semibold">Pemicu tes: {trigger.reason}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex gap-3 rounded-xl border border-line p-4">
                        <Microscope aria-hidden className="size-5 text-primary" strokeWidth={1.75} />
                        <p>
                          <strong>Jaringan FFPE</strong>: untuk panel {panel.shortName} ({[...panelGenes].join(", ")})
                        </p>
                      </div>
                      <div className="flex gap-3 rounded-xl border border-line p-4">
                        <Droplet aria-hidden className="size-5 text-primary" strokeWidth={1.75} />
                        <p>
                          <strong>Plasma ctDNA</strong>: tes ESR1 terpisah, di luar {panel.shortName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <ol className="space-y-4">
                {reflex.items.map((item, i) => {
                  const [headline, ...rest] = item.advice;
                  return (
                    <li key={item.id} className="flex gap-4 rounded-2xl border border-line bg-white p-4 sm:gap-5 sm:p-6">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white sm:size-12">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h3 className="max-w-2xl text-lg font-semibold sm:text-xl">{headline}</h3>
                          <ApprovalBadge />
                        </div>
                        {rest.map((r) => (
                          <p key={r} className="mt-1 text-ink-2">
                            {r}
                          </p>
                        ))}
                        <p className="mt-3 text-xs font-semibold tracking-[0.1em] text-ink-3 uppercase">Alasan</p>
                        <p className="text-ink-2">{item.reason}</p>
                        <p className="mt-2 text-xs text-ink-3">
                          Aturan {item.order} · {item.title}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-6">
              <h3 className="text-lg font-semibold">Yang tidak dicakup panel ini</h3>
              <ul className="mt-3 space-y-3">
                {notCovered.map((n) => (
                  <li key={n.name} className="flex gap-3">
                    <CircleDashed aria-hidden className="mt-0.5 size-5 shrink-0 text-warn-solid" strokeWidth={1.75} />
                    <div>
                      <p className="font-mono font-semibold">{n.name}</p>
                      <p className="text-sm text-ink-2">{n.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3 rounded-2xl border border-line bg-white p-6">
              {reflex.items.length > 0 && (
                <SimActionButton
                  actionKey={`approval:${patient.id}`}
                  label="Catat persetujuan (simulasi)"
                  doneLabel="Persetujuan tercatat (simulasi)"
                  className="w-full"
                />
              )}
              <Link href={`/pasien/${patient.id}/laporan`} className={`${btnSecondary} w-full`}>
                <FileText aria-hidden className="size-4" strokeWidth={2} />
                Lihat Laporan Pilih Terapi
              </Link>
              <p className="text-sm text-ink-3">Dokter dapat memilih sebagian, semua, atau tidak satu pun langkah.</p>
            </div>
          </aside>
        </div>
      </CaseBody>
    </>
  );
}
