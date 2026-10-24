"use client";

import { ChevronRight, FlaskConical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "./ui";

/** Plain, serialisable row for the doctor worklist (rule results are computed on the server). */
export interface DoctorRow {
  id: string;
  name: string;
  age: number;
  subtype: string;
  stage: string;
  prior: string;
  triggerText: string;
  needsTest: boolean;
  verdict: "LANJUT" | "TAHAN" | "AMBIL_ULANG" | null;
  verdictDetail: string;
}

type Filter = "semua" | "perlu_tes" | "lanjut" | "tahan";

const FILTERS: { id: Filter; label: string; match: (r: DoctorRow) => boolean }[] = [
  { id: "semua", label: "Semua", match: () => true },
  { id: "perlu_tes", label: "Perlu tes", match: (r) => r.needsTest },
  { id: "lanjut", label: "SENTINEL lanjut", match: (r) => r.verdict === "LANJUT" },
  { id: "tahan", label: "Ditahan / ambil ulang", match: (r) => r.verdict === "TAHAN" || r.verdict === "AMBIL_ULANG" },
];

function Verdict({ r }: { r: DoctorRow }) {
  if (!r.verdict) {
    return (
      <StatusBadge tone="warn" icon={FlaskConical} size="md">
        Belum dites
      </StatusBadge>
    );
  }
  return (
    <StatusBadge tone={r.verdict === "LANJUT" ? "ok" : "block"} size="md">
      SENTINEL: {r.verdict.replace("_", " ")}
    </StatusBadge>
  );
}

export function DoctorPatientList({ rows }: { rows: DoctorRow[] }) {
  const [filter, setFilter] = useState<Filter>("semua");
  const active = FILTERS.find((f) => f.id === filter)!;
  const shown = rows.filter(active.match);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-3xl font-bold">Semua pasien</h2>
        <p className="mt-1 text-ink-3">{rows.length} pasien simulasi · klik kartu untuk melihat SENTINEL, REFLEX, dan laporan</p>
      </div>
      <div role="group" aria-label="Saring pasien" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = f.id === filter;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(f.id)}
              className={`min-h-10 rounded-full border px-4 text-sm ${
                on ? "border-band bg-band font-bold text-white" : "border-line bg-white font-medium text-ink-2 hover:border-band/40"
              }`}
            >
              {f.label} <span className="opacity-70">({rows.filter(f.match).length})</span>
            </button>
          );
        })}
      </div>
      <ul className="space-y-3">
        {shown.map((r) => (
          <li key={r.id}>
            <Link
              href={`/pasien/${r.id}/sentinel`}
              className={`group flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border px-5 py-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                r.needsTest ? "border-warn-line bg-warn-bg/50 hover:border-warn-solid" : "border-line bg-white hover:border-primary/50 hover:bg-primary-soft/40"
              }`}
            >
              <div className="min-w-0 flex-[1_1_220px]">
                <p className="text-lg font-bold">{r.name}</p>
                <p className="text-sm text-ink-3">
                  {r.age} th · {r.subtype} · {r.stage}
                </p>
              </div>
              <div className="flex flex-[1_1_220px] flex-col items-start gap-1">
                <Verdict r={r} />
                <span className="text-sm text-ink-3">{r.verdictDetail}</span>
              </div>
              <div className="min-w-0 flex-[1_1_260px] text-sm text-ink-3">
                <p className="font-semibold text-ink">{r.prior}</p>
                {r.needsTest ? <p className="font-semibold text-warn">{r.triggerText}</p> : <p>{r.triggerText}</p>}
              </div>
              <ChevronRight aria-hidden className="ml-auto size-6 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" strokeWidth={2} />
            </Link>
          </li>
        ))}
        {shown.length === 0 && <li className="rounded-2xl border border-dashed border-line bg-white p-6 text-ink-3">Tidak ada pasien untuk saringan ini.</li>}
      </ul>
    </div>
  );
}
