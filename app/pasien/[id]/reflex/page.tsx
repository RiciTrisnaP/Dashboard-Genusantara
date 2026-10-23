import type { Metadata } from "next";
import Link from "next/link";
import { CaseHeader } from "@/components/CaseHeader";
import { NotNegativeAlert } from "@/components/NotNegativeAlert";
import { loadCase } from "@/lib/case";
import { getPatient } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/pasien/[id]/reflex">): Promise<Metadata> {
  const { id } = await params;
  return { title: `REFLEX, ${getPatient(id)?.displayName ?? "pasien"}` };
}

export default async function ReflexPage({ params }: PageProps<"/pasien/[id]/reflex">) {
  const { id } = await params;
  const result = loadCase(id);
  const { reflex, sentinel, trigger, patient } = result;

  return (
    <>
      <CaseHeader result={result} active="reflex" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Saran tes lanjutan</h2>
            <p className="text-sm text-slate-600">Diurutkan menurut aturan REFLEX 1 sampai 6. Semua aturan yang berlaku ditampilkan.</p>
          </div>
          <p className="rounded-md border-2 border-brand-600 bg-brand-50 px-3 py-1.5 font-semibold text-brand-900">
            Butuh persetujuan dokter
          </p>
        </div>

        {sentinel.tested && sentinel.verdict !== "LANJUT" && <NotNegativeAlert />}

        {!reflex.applicable ? (
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-slate-700">{reflex.reason}</p>
            {trigger.status === "PERLU_TES" && (
              <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950">
                <p className="font-semibold">Pemicu tes: {trigger.label}</p>
                <p className="mt-1">{trigger.reason}</p>
                <p className="mt-1">
                  <strong>Spesimen yang disarankan:</strong> {trigger.suggestedSpecimen}
                </p>
              </div>
            )}
          </section>
        ) : reflex.items.length === 0 ? (
          <section className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700">
            {reflex.reason}{" "}
            <Link href={`/pasien/${patient.id}/laporan`} className="font-semibold text-brand-700 underline">
              Lanjut ke Laporan Pilih Terapi
            </Link>
          </section>
        ) : (
          <ol className="space-y-3">
            {reflex.items.map((item, i) => (
              <li key={item.id} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <span className="text-xs text-slate-400">Aturan {item.order}</span>
                  </div>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-slate-800">
                    {item.advice.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm text-slate-500">
                    <span className="font-medium">Alasan:</span> {item.reason}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}

        <p className="text-sm text-slate-500">{reflex.label}. Tidak ada tes yang dipesan otomatis.</p>
      </div>
    </>
  );
}
