"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import { navigator } from "@/lib/navigator/data";
import { formatWhen } from "@/lib/navigator/format";
import { gateView, JOURNEY_LABEL } from "@/lib/navigator/rules";
import type { Journey } from "@/lib/navigator/types";
import { JourneyChip, monthText, navBtnOutline } from "./bits";
import { useNavigator } from "./NavigatorProvider";

const FILTERS: ("semua" | Journey)[] = ["semua", "menunggu_tes", "menunggu_hasil", "menunggu_konsultasi", "didampingi", "selesai"];

export function PatientsView() {
  const { patient } = useNavigator();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("semua");
  const all = navigator.patients.map((p) => patient(p.id)!);
  const rows = all.filter((p) => filter === "semua" || p.journey === filter);
  const active = all.filter((p) => p.journey !== "selesai").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Pasien</h1>
        <p className="mt-1 text-ink-3">{active} pasien aktif · pilih Buka untuk melihat detail</p>
      </div>
      <div role="group" aria-label="Saring menurut tahap" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = f === filter;
          const n = f === "semua" ? all.length : all.filter((p) => p.journey === f).length;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={on}
              className={`min-h-10 rounded-full border px-4 text-sm ${on ? "border-band bg-band font-bold text-white" : "border-line bg-white font-medium text-ink-2 hover:border-band/40"}`}
            >
              {f === "semua" ? "Semua" : JOURNEY_LABEL[f]} <span className="opacity-70">({n})</span>
            </button>
          );
        })}
      </div>
      <ul className="space-y-3">
        {rows.map((p) => {
          const g = gateView(p);
          const last = p.contacts.at(-1);
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-line bg-white px-5 py-4">
              <div className="min-w-0 flex-[1_1_220px]">
                <p className="text-lg font-bold">{p.displayName}</p>
                <p className="text-sm text-ink-3">
                  {p.age} th · {p.subtype} · {p.stage}
                </p>
              </div>
              <div className="flex flex-[1_1_220px] flex-wrap gap-2">
                <JourneyChip journey={p.journey} />
                <StatusBadge tone={g.tone} size="md">
                  Tes: {g.label}
                </StatusBadge>
              </div>
              <div className="flex-[1_1_180px] text-sm text-ink-3">
                <p className="font-semibold text-ink">{monthText(p)}</p>
                Kontak terakhir: {last ? formatWhen(last.at, navigator.today) : "belum ada"}
              </div>
              <Link href={`/perawat/pasien/${p.id}`} className={navBtnOutline}>
                Buka
              </Link>
            </li>
          );
        })}
        {rows.length === 0 && <li className="rounded-2xl border border-dashed border-line bg-white p-6 text-ink-3">Tidak ada pasien di tahap ini.</li>}
      </ul>
    </div>
  );
}
