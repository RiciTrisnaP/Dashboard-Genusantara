import type { Metadata } from "next";
import Link from "next/link";
import { CaseHeader } from "@/components/CaseHeader";
import { LayerRow, PendingLayerRow } from "@/components/LayerRow";
import { NotNegativeAlert } from "@/components/NotNegativeAlert";
import { S5Row } from "@/components/S5Row";
import { StatusBadge, statusText } from "@/components/StatusBadge";
import { TargetGrid } from "@/components/TargetGrid";
import { loadCase } from "@/lib/case";
import { drugAccess, getPatient, panel } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { THRESHOLD_LABELS, THRESHOLD_UNITS, THRESHOLDS } from "@/lib/rules/thresholds";

export async function generateMetadata({ params }: PageProps<"/pasien/[id]/sentinel">): Promise<Metadata> {
  const { id } = await params;
  return { title: `SENTINEL, ${getPatient(id)?.displayName ?? "pasien"}` };
}

export default async function SentinelPage({ params }: PageProps<"/pasien/[id]/sentinel">) {
  const { id } = await params;
  const result = loadCase(id);
  const { sentinel, trigger, patient } = result;

  return (
    <>
      <CaseHeader result={result} active="sentinel" />
      <div className="space-y-6">
        {!sentinel.tested ? (
          <section className="rounded-lg border-2 border-amber-400 bg-amber-50 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold text-amber-950">Pemicu tes</h2>
              <StatusBadge tone={trigger.status === "PERLU_TES" ? "warn" : "neutral"} size="lg">
                {trigger.label}
              </StatusBadge>
            </div>
            <p className="mt-2 text-amber-950">{trigger.reason}</p>
            {trigger.suggestedSpecimen && (
              <p className="mt-2 text-amber-950">
                <strong>Spesimen yang disarankan:</strong> {trigger.suggestedSpecimen}
              </p>
            )}
            <p className="mt-2 text-sm text-amber-900">
              S1 dan S2 dijalankan sebelum tes, supaya biaya tidak terbuang untuk sampel yang rusak.
            </p>
          </section>
        ) : (
          <section
            className={`rounded-lg border-2 p-5 ${
              sentinel.verdict === "LANJUT" ? "border-emerald-400 bg-emerald-50" : "border-rose-400 bg-rose-50"
            }`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">Keputusan SENTINEL</h2>
              <StatusBadge tone={sentinel.verdict === "LANJUT" ? "ok" : "block"} size="lg">
                {statusText(sentinel.verdict)}
              </StatusBadge>
              <span className="text-sm text-slate-600">
                {sentinel.s3.readableCount} dari {sentinel.s3.totalTargets} target terbaca
              </span>
            </div>
            <p className="mt-2 text-slate-800">{sentinel.reason}</p>
            {sentinel.verdict !== "LANJUT" && (
              <>
                <NotNegativeAlert className="mt-3" />
                <p className="mt-3 text-sm text-slate-700">
                  Laporan terapi tidak dikeluarkan.{" "}
                  <Link href={`/pasien/${patient.id}/reflex`} className="font-semibold text-brand-700 underline">
                    Lihat saran REFLEX
                  </Link>
                </p>
              </>
            )}
          </section>
        )}

        <section className="rounded-lg border border-slate-200 bg-white">
          <h2 className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-800">Lapisan mutu S1 sampai S5</h2>
          <ul className="divide-y divide-slate-100">
            <LayerRow layer={sentinel.s1} />
            {sentinel.tested ? (
              <>
                <LayerRow layer={sentinel.s2} />
                <LayerRow layer={sentinel.s3} />
                <LayerRow layer={sentinel.s4} />
                <S5Row
                  patientId={patient.id}
                  verdict={sentinel.verdict}
                  accessCheckedDate={formatDate(drugAccess.checkedDate)}
                />
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
        </section>

        {sentinel.tested && (
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold text-slate-800">Target panel: terbaca dan tidak terbaca</h2>
              <p className="text-xs text-slate-500">{panel.name}. Unit: {panel.unit}.</p>
            </div>
            <div className="mt-3">
              <TargetGrid readouts={sentinel.s3.readouts} />
            </div>
            {sentinel.s3.unreadable.length > 0 && (
              <p className="mt-3 text-sm text-rose-900">
                <strong>Tidak dinilai:</strong> {sentinel.s3.unreadable.join(", ")}. Area ini tidak boleh dibaca
                sebagai negatif.
              </p>
            )}
          </section>
        )}

        {sentinel.tested && sentinel.s4.variants.length > 0 && (
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-slate-800">S4: varian yang dipanggil</h2>
            <table className="mt-2 w-full text-left text-sm">
              <thead className="text-xs text-slate-500 uppercase">
                <tr>
                  <th className="py-1.5 pr-4 font-semibold">Varian</th>
                  <th className="py-1.5 pr-4 font-semibold">VAF</th>
                  <th className="py-1.5 pr-4 font-semibold">Baca pendukung</th>
                  <th className="py-1.5 pr-4 font-semibold">Status</th>
                  <th className="py-1.5 font-semibold">Alasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sentinel.s4.variants.map((v) => (
                  <tr key={v.key}>
                    <td className="py-2 pr-4 font-semibold">{v.key}</td>
                    <td className="py-2 pr-4">{formatNumber(v.variant.vaf)}%</td>
                    <td className="py-2 pr-4">{v.variant.altReads}</td>
                    <td className="py-2 pr-4">
                      <StatusBadge tone={v.call === "LULUS" ? "ok" : "warn"}>{v.call}</StatusBadge>
                    </td>
                    <td className="py-2 text-slate-600">{v.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <details className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <summary className="cursor-pointer font-semibold text-slate-800">Ambang batas (nilai DEMO, bukan batas klinis)</summary>
          <table className="mt-3 text-left">
            <tbody>
              {(Object.keys(THRESHOLDS) as (keyof typeof THRESHOLDS)[]).map((k) => (
                <tr key={k}>
                  <td className="py-0.5 pr-6 text-slate-600">{THRESHOLD_LABELS[k]}</td>
                  <td className="py-0.5 font-mono">
                    {formatNumber(THRESHOLDS[k])}
                    {THRESHOLD_UNITS[k]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-slate-500">Untuk tes PCR, S3 memakai kontrol internal sebagai pengganti cakupan baca.</p>
        </details>
      </div>
    </>
  );
}
