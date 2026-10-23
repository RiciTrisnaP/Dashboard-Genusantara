import Link from "next/link";
import { verdictLabel, verdictTone } from "@/components/CaseHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { patients } from "@/lib/data";
import { runCase } from "@/lib/rules";
import type { TriggerStatus } from "@/lib/rules/trigger";
import type { Tone } from "@/lib/rules/sentinel";

const TRIGGER_TONE: Record<TriggerStatus, Tone> = {
  PERLU_TES: "warn",
  SUDAH_DITES: "neutral",
  TIDAK_MEMENUHI_KRITERIA: "neutral",
};

export default function WorklistPage() {
  const cases = patients.map(runCase);
  const needTest = cases.filter((c) => c.trigger.status === "PERLU_TES");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Daftar Pasien</h1>
        <p className="mt-1 text-slate-600">
          Daftar kerja untuk rapat tim tumor. Pemicu tes menandai pasien yang sudah waktunya dites.
        </p>
      </div>

      {needTest.length > 0 && (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-950">
            {needTest.length} pasien perlu tes molekuler
          </h2>
          <ul className="mt-2 space-y-2 text-sm text-amber-950">
            {needTest.map((c) => (
              <li key={c.patient.id}>
                <Link href={`/pasien/${c.patient.id}/sentinel`} className="font-semibold underline">
                  {c.patient.displayName}
                </Link>
                : {c.trigger.reason}
                <br />
                <span className="text-amber-900">Spesimen yang disarankan: {c.trigger.suggestedSpecimen}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Pasien</th>
              <th className="px-4 py-2.5 font-semibold">Subtipe</th>
              <th className="px-4 py-2.5 font-semibold">Stadium</th>
              <th className="px-4 py-2.5 font-semibold">Terapi sebelumnya</th>
              <th className="px-4 py-2.5 font-semibold">Pemicu tes</th>
              <th className="px-4 py-2.5 font-semibold">SENTINEL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cases.map((c) => {
              const p = c.patient;
              return (
                <tr key={p.id} className="group relative hover:bg-brand-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/pasien/${p.id}/sentinel`}
                      className="font-semibold text-brand-700 after:absolute after:inset-0 group-hover:underline"
                    >
                      {p.displayName}
                    </Link>
                    <div className="text-xs text-slate-500">{p.age} tahun</div>
                  </td>
                  <td className="px-4 py-3">{p.clinical.subtype}</td>
                  <td className="px-4 py-3">
                    {p.clinical.stage} <span className="text-slate-500">({p.clinical.setting})</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {p.clinical.priorTherapies?.join("; ")}
                    {p.clinical.progressedOnEndocrine && (
                      <div className="text-xs text-slate-500">memburuk setelah terapi endokrin</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={TRIGGER_TONE[c.trigger.status]}>{c.trigger.label}</StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={verdictTone(c)}>{verdictLabel(c)}</StatusBadge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-800">Kriteria pemicu tes</h2>
        <p className="mt-1">
          Ditandai <strong>Perlu tes</strong> bila semua terpenuhi: subtipe HR+/HER2-, stadium IV atau
          metastatik/kambuh, memburuk setelah terapi endokrin, dan belum ada tes molekuler.
        </p>
      </section>
    </div>
  );
}
