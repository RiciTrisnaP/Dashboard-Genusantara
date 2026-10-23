import Link from "next/link";
import type { CaseResult } from "@/lib/rules";
import type { Tone } from "@/lib/rules/sentinel";
import { formatDate } from "@/lib/format";
import { describeSpecimen } from "@/lib/rules/sentinel";
import { StatusBadge, statusText } from "./StatusBadge";

export type CaseTab = "sentinel" | "reflex" | "laporan" | "ringkasan";

const TABS: { id: CaseTab; label: string; hint: string }[] = [
  { id: "sentinel", label: "SENTINEL", hint: "Gerbang mutu" },
  { id: "reflex", label: "REFLEX", hint: "Tes lanjutan" },
  { id: "laporan", label: "Laporan Pilih Terapi", hint: "Untuk dokter" },
  { id: "ringkasan", label: "Ringkasan Pasien", hint: "Bahasa awam" },
];

export function verdictTone(c: CaseResult): Tone {
  if (!c.sentinel.tested) return "neutral";
  return c.sentinel.verdict === "LANJUT" ? "ok" : "block";
}

export function verdictLabel(c: CaseResult): string {
  return c.sentinel.tested ? statusText(c.sentinel.verdict) : "BELUM DITES";
}

export function CaseHeader({ result, active }: { result: CaseResult; active: CaseTab }) {
  const { patient, trigger } = result;
  const c = patient.clinical;
  const test = patient.molecularTest;
  return (
    <div className="mb-6 print:hidden">
      <Link href="/" className="text-sm text-brand-700 hover:underline">
        ← Daftar Pasien
      </Link>
      <div className="mt-2 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {patient.displayName}
              <span className="ml-2 text-base font-normal text-slate-500">{patient.age} tahun</span>
            </h1>
            <p className="mt-0.5 text-sm text-slate-600">
              {c.histology} · <strong>{c.subtype}</strong> · Stadium {c.stage} ({c.setting})
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-500">SENTINEL</span>
            <StatusBadge tone={verdictTone(result)}>{verdictLabel(result)}</StatusBadge>
            {trigger.status === "PERLU_TES" && <StatusBadge tone="warn">{trigger.label}</StatusBadge>}
          </div>
        </div>
        <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          <div>
            <dt className="inline text-slate-500">Terapi sebelumnya: </dt>
            <dd className="inline">{c.priorTherapies?.join("; ") || "tidak ada"}</dd>
          </div>
          <div>
            <dt className="inline text-slate-500">Progresi pada terapi endokrin: </dt>
            <dd className="inline">{c.progressedOnEndocrine ? "ya" : "tidak"}</dd>
          </div>
          <div>
            <dt className="inline text-slate-500">Tes molekuler: </dt>
            <dd className="inline">
              {test.done ? `${describeSpecimen(test.specimen)}, ${formatDate(test.date)}` : "belum dilakukan"}
            </dd>
          </div>
        </dl>
      </div>
      <nav aria-label="Modul" className="mt-4 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => {
          const isActive = t.id === active;
          return (
            <Link
              key={t.id}
              href={`/pasien/${patient.id}/${t.id}`}
              aria-current={isActive ? "page" : undefined}
              className={`-mb-px rounded-t-md border px-4 py-2 text-sm ${
                isActive
                  ? "border-slate-200 border-b-white bg-white font-semibold text-brand-700"
                  : "border-transparent text-slate-600 hover:text-brand-700"
              }`}
            >
              {t.label}
              <span className="ml-1.5 hidden text-xs font-normal text-slate-400 md:inline">{t.hint}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
