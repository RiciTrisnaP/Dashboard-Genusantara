import { Baby, Banknote, Check, CircleCheck, CircleX, HeartHandshake, MessagesSquare, Microscope, SearchCheck, ShieldCheck, TriangleAlert, Wallet, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { CaseBody, CaseHeader, shortName } from "@/components/CaseHeader";
import { PrintButton } from "@/components/ReportControls";
import { capitalize } from "@/components/TherapyGroup";
import { loadCase } from "@/lib/case";
import { getPatient } from "@/lib/data";
import type { SummarySectionId } from "@/lib/rules/summary";

export async function generateMetadata({ params }: PageProps<"/pasien/[id]/ringkasan">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Ringkasan Pasien, ${getPatient(id)?.displayName ?? "pasien"}` };
}

const SECTION_ICON: Record<SummarySectionId, LucideIcon> = {
  checked: Microscope,
  result: SearchCheck,
  inherit: Baby,
  options: Wallet,
  questions: MessagesSquare,
  family: HeartHandshake,
};

export default async function SummaryPage({ params }: PageProps<"/pasien/[id]/ringkasan">) {
  const { id } = await params;
  const result = loadCase(id);
  const { patient, summary, sentinel, triase } = result;
  const name = shortName(patient.displayName);
  const optionCards = triase.issued ? triase.groups.A : [];

  const quality = !sentinel.tested
    ? null
    : sentinel.verdict !== "LANJUT"
      ? { cls: "bg-bad-bg text-bad", icon: CircleX, text: `Mutu sampel belum cukup: hanya ${sentinel.s3.readableCount} dari ${sentinel.s3.totalTargets} titik terbaca.` }
      : sentinel.s3.unreadable.length > 0
        ? { cls: "bg-warn-bg text-warn", icon: TriangleAlert, text: `${sentinel.s3.unreadable.length} dari ${sentinel.s3.totalTargets} titik tidak terbaca dan tidak dinilai.` }
        : { cls: "bg-ok-bg text-ok", icon: CircleCheck, text: `Mutu baik: semua ${sentinel.s3.totalTargets} titik terbaca jelas.` };

  return (
    <>
      <CaseHeader result={result} active="ringkasan" />
      <CaseBody>
        <div className="mx-auto max-w-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
            <p className="text-sm text-ink-3">Untuk dibawa pulang dan dibaca bersama keluarga, juga di HP.</p>
            <PrintButton />
          </div>

          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-deep px-6 py-7 text-white">
            <p className="text-xs font-semibold tracking-[0.12em] text-white/90 uppercase">Ringkasan untuk pasien dan keluarga</p>
            <h2 className="mt-2 text-3xl font-bold">
              {patient.molecularTest.done ? `Hasil tes tumor ${name}` : `Rencana tes untuk ${name}`}
            </h2>
            <p className="mt-1 text-lg text-white/90">Bacalah bersama dokter Anda.</p>
          </div>

          <div className="mt-4 space-y-4">
            {summary.sections.map((s) => {
              const Icon = SECTION_ICON[s.id];
              return (
                <section key={s.id} className="avoid-break rounded-2xl border border-line bg-white p-6 text-[17px] leading-relaxed">
                  <h3 className="flex items-center gap-3 text-xl font-semibold">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
                      <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                    </span>
                    {s.title}
                  </h3>
                  <div className="mt-3 space-y-3">
                    {s.id === "inherit" ? (
                      <>
                        <p className="text-xl font-bold">{s.paragraphs[0]}</p>
                        {s.paragraphs.slice(1).map((p) => (
                          <p key={p} className="text-ink-2">
                            {p}
                          </p>
                        ))}
                      </>
                    ) : s.id === "questions" ? (
                      <ol className="space-y-2.5">
                        {(s.bullets ?? []).map((b, i) => (
                          <li key={b} className="flex gap-3">
                            <span className="font-semibold text-primary">{i + 1}.</span>
                            {b}
                          </li>
                        ))}
                      </ol>
                    ) : s.id === "family" ? (
                      <ul className="space-y-2.5">
                        {s.paragraphs.map((p) => (
                          <li key={p} className="flex gap-3">
                            <Check aria-hidden className="mt-1 size-5 shrink-0 text-primary" strokeWidth={2} />
                            {p}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <>
                        {s.paragraphs
                          .filter((p) => !(s.id === "options" && optionCards.length > 0 && p.endsWith(":")))
                          .map((p) => (
                            <p key={p}>{p}</p>
                          ))}
                        {s.id === "options" && optionCards.length > 0
                          ? optionCards.map((o) => (
                              <div key={o.drug} className="rounded-xl bg-canvas p-5">
                                <p className="text-lg font-semibold">{capitalize(o.regimen)}</p>
                                {o.brand && <p className="text-ink-3">Nama dagang: {o.brand}</p>}
                                {o.isFallback && <p className="text-warn">Terapi hormon yang tersedia, bukan obat khusus untuk perubahan ESR1.</p>}
                                <dl className="mt-3 space-y-3">
                                  <div className="flex gap-3">
                                    <Banknote aria-hidden className="mt-1 size-5 shrink-0 text-ink-2" strokeWidth={1.75} />
                                    <div>
                                      <dt className="text-sm text-ink-3">Harga</dt>
                                      <dd className="font-mono text-xl font-semibold">{o.market.label}</dd>
                                      {o.market.detail && <dd className="text-ink-2">{o.market.detail.replace(/\s*\(.*\)$/, "")}</dd>}
                                    </div>
                                  </div>
                                  <div className="flex gap-3">
                                    {o.jknCovered ? (
                                      <CircleCheck aria-hidden className="mt-1 size-5 shrink-0 text-ok" strokeWidth={1.75} />
                                    ) : (
                                      <TriangleAlert aria-hidden className="mt-1 size-5 shrink-0 text-warn" strokeWidth={1.75} />
                                    )}
                                    <div>
                                      <dt className="text-sm text-ink-3">JKN</dt>
                                      <dd className={`font-semibold ${o.jknCovered ? "text-ok" : "text-warn"}`}>
                                        {o.jknCovered ? `Dijamin JKN (${o.jkn.detail})` : "Tidak dijamin JKN"}
                                      </dd>
                                    </div>
                                  </div>
                                  <div className="flex gap-3">
                                    <ShieldCheck aria-hidden className="mt-1 size-5 shrink-0 text-ok" strokeWidth={1.75} />
                                    <div>
                                      <dt className="text-sm text-ink-3">Izin BPOM</dt>
                                      <dd className="font-semibold text-ok">
                                        {o.bpom.label}
                                        {o.bpom.detail ? `, ${o.bpom.detail}` : ""}
                                      </dd>
                                    </div>
                                  </div>
                                </dl>
                              </div>
                            ))
                          : s.bullets && (
                              <ul className="list-disc space-y-1.5 pl-6">
                                {s.bullets.map((b) => (
                                  <li key={b}>{b}</li>
                                ))}
                              </ul>
                            )}
                        {s.after?.map((p) => (
                          <p key={p} className="text-base text-ink-2">
                            {p}
                          </p>
                        ))}
                        {s.id === "result" && quality && (
                          <p className={`flex items-start gap-2 rounded-lg px-4 py-3 font-semibold ${quality.cls}`}>
                            <quality.icon aria-hidden className="mt-1 size-5 shrink-0" strokeWidth={2} />
                            {quality.text}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
          <p className="mt-6 text-sm text-ink-3">Ringkasan ini SIMULASI dan tidak menggantikan penjelasan dokter.</p>
        </div>
      </CaseBody>
    </>
  );
}
