"use client";

import { PenLine, Undo2 } from "lucide-react";
import { useRef, useState } from "react";
import { StatusBadge } from "@/components/ui";
import { panel } from "@/lib/data";
import { lab } from "@/lib/lab/data";
import { labGates, resultSummary } from "@/lib/lab/rules";
import { navBtnOutline, navBtnPink } from "../navigator/bits";
import { useHash } from "../navigator/useHash";
import { EmptyState, GateRow, GroupHead } from "./bits";
import { useLab } from "./LabProvider";
import { ResultTable } from "./ResultTable";
import { SampleMeta } from "./SentinelView";

const T = lab.thresholds;

export function PathologistView() {
  const { byStage, state, release, returnToAnalyst } = useLab();
  const hash = useHash();
  const [picked, setPicked] = useState<string | null>(null);
  const detail = useRef<HTMLDivElement>(null);
  const list = byStage("patolog");
  const released = byStage("rilis");
  const s = list.find((x) => x.code === picked) ?? list.find((x) => x.code === hash) ?? list[0];
  const note = s ? state.notes[s.code] : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tinjauan patolog</h1>
        <p className="mt-1 text-ink-3">Hasil yang lolos SENTINEL menunggu tanda tangan sebelum dirilis ke dokter peminta · {lab.pathologist}</p>
      </div>

      {s ? (
        <div className="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <ul aria-label="Hasil menunggu tanda tangan" className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {list.map((x) => {
              const on = x.code === s.code;
              const withNote = Boolean(state.notes[x.code]);
              return (
                <li key={x.code}>
                  <button
                    type="button"
                    aria-current={on ? "true" : undefined}
                    onClick={() => {
                      setPicked(x.code);
                      if (window.matchMedia("(max-width: 1023px)").matches) detail.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`flex w-full items-center justify-between gap-3 border-l-4 px-4 py-3 text-left transition-colors ${
                      on ? "border-primary bg-primary-soft/50" : "border-transparent hover:bg-canvas"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block font-mono font-bold">{x.code}</span>
                      <span className="block text-sm text-ink-3">{x.sender}</span>
                    </span>
                    <StatusBadge tone={withNote ? "warn" : "ok"}>{withNote ? "Dengan catatan" : "Lulus mutu"}</StatusBadge>
                  </button>
                </li>
              );
            })}
          </ul>

          <div ref={detail} className="scroll-mt-4 space-y-4 rounded-2xl border border-line bg-white p-5">
            <h2 className="font-mono text-2xl font-bold">{s.code}</h2>
            <SampleMeta s={s} />
            <GateRow gates={labGates(s, panel, T)} />
            <p className="rounded-xl border border-line bg-canvas p-3 text-sm">
              <span className="font-bold">Ringkasan hasil:</span> {resultSummary(s, panel, T)}
              {note && <span className="mt-1 block font-semibold text-warn">Catatan analis: {note}.</span>}
            </p>
            <ResultTable sample={s} />
            <p className="rounded-xl border border-violet/25 bg-violet-soft p-3 text-sm text-violet">
              Yang dirilis lab: hasil mutasi per target dan status mutu. Laporan Pilih Terapi (urutan BPOM, JKN, harga) disusun Genusa untuk dokter, tidak
              tampil di dashboard lab.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => release(s.code)} className={navBtnPink}>
                <PenLine aria-hidden className="size-4" />
                Tanda tangani dan rilis ke dokter
              </button>
              <button type="button" onClick={() => returnToAnalyst(s.code)} className={navBtnOutline}>
                <Undo2 aria-hidden className="size-4" />
                Kembalikan ke analis
              </button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState>Tidak ada hasil yang menunggu tanda tangan.</EmptyState>
      )}

      {released.length > 0 && (
        <section>
          <GroupHead>Dirilis hari ini · {released.length}</GroupHead>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {released.map((x) => (
              <li key={x.code} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-mono text-lg font-bold">{x.code}</p>
                  <p className="text-sm text-ink-3">
                    {x.doctor} · {resultSummary(x, panel, T)}
                  </p>
                </div>
                <StatusBadge tone="ok">S5 lulus · dirilis</StatusBadge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
