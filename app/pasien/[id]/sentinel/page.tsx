import { ArrowRight, CircleCheck, FlaskConical, Info, OctagonX, RefreshCw, CircleX, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CaseBody, CaseHeader } from "@/components/CaseHeader";
import { LayerRow, PendingLayerRow } from "@/components/LayerRow";
import { NotNegativeAlert } from "@/components/NotNegativeAlert";
import { S5Row } from "@/components/S5Row";
import { TargetGrid } from "@/components/TargetGrid";
import { btnPrimary, Eyebrow, statusText } from "@/components/ui";
import { loadCase } from "@/lib/case";
import { drugAccess, getPatient, panel } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import type { Verdict } from "@/lib/rules/sentinel";
import { THRESHOLD_LABELS, THRESHOLD_UNITS, THRESHOLDS } from "@/lib/rules/thresholds";

export async function generateMetadata({ params }: PageProps<"/pasien/[id]/sentinel">): Promise<Metadata> {
  const { id } = await params;
  return { title: `SENTINEL, ${getPatient(id)?.displayName ?? "pasien"}` };
}

const VERDICT_CHIPS: { v: Verdict; icon: LucideIcon }[] = [
  { v: "LANJUT", icon: CircleCheck },
  { v: "TAHAN", icon: CircleX },
  { v: "AMBIL_ULANG", icon: RefreshCw },
];

export default async function SentinelPage({ params }: PageProps<"/pasien/[id]/sentinel">) {
  const { id } = await params;
  const result = loadCase(id);
  const { sentinel, trigger, patient } = result;

  const tested = sentinel.tested;
  const verdict = tested ? sentinel.verdict : null;
  const ok = verdict === "LANJUT";
  const frame = !tested ? "border-warn-solid" : ok ? "border-ok-solid" : "border-bad-solid";
  const iconBox = !tested ? "bg-warn-bg text-warn" : ok ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad";
  const VerdictIcon = !tested ? FlaskConical : ok ? CircleCheck : OctagonX;
  const verdictColor = !tested ? "text-warn" : ok ? "text-ok" : "text-bad";
  const sentence = !tested
    ? `${trigger.reason} ${sentinel.reason}`
    : ok
      ? `${sentinel.reason} Laporan Pilih Terapi dapat disusun.`
      : `${sentinel.reason} Laporan Pilih Terapi tidak diterbitkan.`;

  return (
    <>
      <CaseHeader result={result} active="sentinel" />
      <CaseBody>
        <div className="space-y-6">
          {/* Decision card */}
          <section className={`overflow-hidden rounded-2xl border-2 bg-white ${frame}`}>
            <div className="flex flex-col gap-5 p-5 sm:gap-6 sm:p-8 lg:flex-row lg:items-center">
              <span className={`flex size-16 shrink-0 items-center justify-center rounded-2xl sm:size-24 ${iconBox}`}>
                <VerdictIcon aria-hidden className="size-9 sm:size-12" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <Eyebrow className="!text-ink-2">Keputusan SENTINEL · gerbang mutu</Eyebrow>
                <p className={`mt-1 text-5xl leading-none font-bold tracking-tight sm:text-[68px] ${verdictColor}`}>
                  {verdict ? statusText(verdict) : "BELUM DITES"}
                </p>
                <p className="mt-3 text-lg text-ink-2">{sentence}</p>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                {tested && (
                  <p className="flex items-end gap-2">
                    <span className="font-mono text-5xl font-semibold tabular sm:text-6xl">
                      {sentinel.s3.readableCount}/{sentinel.s3.totalTargets}
                    </span>
                    <span className="pb-1 text-base leading-tight text-ink-2">
                      target
                      <br />
                      terbaca
                    </span>
                  </p>
                )}
                {!tested ? (
                  <Link href={`/pasien/${patient.id}/laporan`} className={btnPrimary}>
                    <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
                    Lihat spesimen yang disarankan
                  </Link>
                ) : ok ? (
                  <Link href={`/pasien/${patient.id}/laporan`} className={btnPrimary}>
                    <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
                    Buka Laporan Pilih Terapi
                  </Link>
                ) : (
                  <Link href={`/pasien/${patient.id}/reflex`} className={btnPrimary}>
                    <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
                    Lihat saran REFLEX
                  </Link>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-line bg-canvas px-6 py-3 text-sm text-ink-2 sm:px-8">
              Kemungkinan keputusan:
              {VERDICT_CHIPS.map(({ v, icon: Icon }) => {
                const current = v === verdict;
                const tone = v === "LANJUT" ? "border-ok-solid bg-ok-bg text-ok" : "border-bad-solid bg-bad-bg text-bad";
                return (
                  <span
                    key={v}
                    className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-semibold ${
                      current ? tone : "border-line text-ink-3/70"
                    }`}
                  >
                    <Icon aria-hidden className="size-4" strokeWidth={1.75} />
                    {statusText(v)}
                    {current && " (saat ini)"}
                  </span>
                );
              })}
            </div>
          </section>

          {tested && !ok && (
            <NotNegativeAlert
              detail={`Hanya ${sentinel.s3.readableCount} dari ${sentinel.s3.totalTargets} target yang terbaca. ${sentinel.s3.unreadable.length} target tidak dinilai. Area yang tidak terbaca tidak memberi informasi apa pun tentang ada atau tidaknya varian.`}
            />
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {/* Layers */}
            <section>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-2xl font-semibold">5 lapisan mutu</h2>
                <p className="text-sm text-ink-3">Satu lapisan TAHAN menahan seluruh laporan</p>
              </div>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
                <LayerRow layer={sentinel.s1} />
                {tested ? (
                  <>
                    <LayerRow layer={sentinel.s2} />
                    <LayerRow layer={sentinel.s3} />
                    <LayerRow layer={sentinel.s4} />
                    <S5Row patientId={patient.id} verdict={sentinel.verdict} accessCheckedDate={formatDate(drugAccess.checkedDate)} />
                  </>
                ) : (
                  <>
                    <PendingLayerRow id="S2" name="Spesimen" reason="Belum ada spesimen." />
                    <PendingLayerRow id="S3" name="Analitik" reason="Belum ada hasil tes." />
                    <PendingLayerRow id="S4" name="Varian" reason="Belum ada hasil tes." />
                    <PendingLayerRow id="S5" name="Pelaporan" reason="Belum ada laporan." />
                  </>
                )}
              </ul>
              <details className="mt-4 rounded-2xl border border-line bg-white px-6 py-4 text-sm">
                <summary className="cursor-pointer font-semibold">Ambang batas (nilai DEMO, bukan batas klinis)</summary>
                <table className="mt-3 text-left">
                  <tbody>
                    {(Object.keys(THRESHOLDS) as (keyof typeof THRESHOLDS)[]).map((k) => (
                      <tr key={k}>
                        <td className="py-0.5 pr-6 text-ink-2">{THRESHOLD_LABELS[k]}</td>
                        <td className="py-0.5 font-mono tabular">
                          {formatNumber(THRESHOLDS[k])}
                          {THRESHOLD_UNITS[k]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-ink-3">Untuk tes PCR, S3 memakai kontrol internal sebagai pengganti cakupan baca.</p>
              </details>
            </section>

            {/* Panel targets */}
            <section>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-2xl font-semibold">
                  {panel.targets.length} target panel {panel.shortName}
                </h2>
                {tested && (
                  <p className={`font-mono text-sm font-semibold ${ok ? "text-ok" : "text-bad"}`}>
                    {sentinel.s3.readableCount} terbaca · {sentinel.s3.unreadable.length} tidak dinilai
                  </p>
                )}
              </div>
              {tested ? (
                <>
                  <TargetGrid readouts={sentinel.s3.readouts} variantTargets={sentinel.s4.variants.map((v) => v.target)} />
                  <p className="mt-3 flex items-start gap-2 text-sm text-ink-3">
                    <Info aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
                    {sentinel.s3.unreadable.length > 0
                      ? "Tidak dinilai berarti target tidak terbaca, sehingga tidak ada kesimpulan apa pun tentang target tersebut."
                      : `Terbaca berarti cakupan baca di target itu memadai. Tidak terdeteksi varian di target yang terbaca hanya berlaku untuk ${panel.targets.length} target ini.`}
                  </p>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-line bg-white p-6 text-ink-2">
                  Belum ada hasil tes. Panel memeriksa {panel.targets.length} titik di gen{" "}
                  {[...new Set(panel.targets.map((t) => t.gene))].join(", ")}. {trigger.suggestedSpecimen}
                </div>
              )}
            </section>
          </div>
        </div>
      </CaseBody>
    </>
  );
}
