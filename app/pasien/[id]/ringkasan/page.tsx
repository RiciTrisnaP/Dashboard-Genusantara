import type { Metadata } from "next";
import { CaseHeader } from "@/components/CaseHeader";
import { PrintButton } from "@/components/ReportControls";
import { loadCase } from "@/lib/case";
import { getPatient } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/pasien/[id]/ringkasan">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Ringkasan Pasien, ${getPatient(id)?.displayName ?? "pasien"}` };
}

export default async function SummaryPage({ params }: PageProps<"/pasien/[id]/ringkasan">) {
  const { id } = await params;
  const result = loadCase(id);
  const { patient, summary } = result;

  return (
    <>
      <CaseHeader result={result} active="ringkasan" />
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <PrintButton />
        <span className="text-xs text-slate-500">Untuk dibawa pulang dan dibaca bersama keluarga.</span>
      </div>
      <article className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 text-[17px] leading-relaxed text-slate-800 shadow-sm sm:p-8 print:max-w-none print:border-0 print:p-0 print:text-[11pt] print:shadow-none">
        <p className="text-sm font-semibold tracking-wider text-brand-700 uppercase">Ringkasan untuk pasien</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Hasil tes untuk {patient.displayName}</h2>
        <p className="mt-1 text-base text-slate-500">
          Ringkasan ini membantu Ibu dan keluarga berbicara dengan dokter. Ini bukan pengganti penjelasan dokter.
        </p>

        <div className="mt-6 space-y-6">
          {summary.sections.map((s, i) => (
            <section key={s.title}>
              <h3 className="flex items-baseline gap-2 text-lg font-bold text-slate-900">
                <span className="text-brand-600">{i + 1}.</span>
                {s.title}
              </h3>
              <div className="mt-1.5 space-y-2">
                {s.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {s.bullets && (
                  <ul className="list-disc space-y-1.5 pl-6">
                    {s.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
                {s.after?.map((p) => (
                  <p key={p} className="text-base text-slate-600">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-8 border-t border-slate-200 pt-3 text-sm text-slate-500">
          SIMULASI. Contoh ringkasan dari prototipe; nama dan hasil tidak nyata.
        </p>
      </article>
    </>
  );
}
