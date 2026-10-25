"use client";

import { ArrowRight, Plus, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui";
import { lab } from "@/lib/lab/data";
import { evaluateLabS2, RUN_STEPS, runSizeWarning } from "@/lib/lab/rules";
import type { LabSample } from "@/lib/lab/types";
import { formatWhen } from "@/lib/navigator/format";
import { navBtnDisabled, navBtnNavy, navBtnOutline } from "../navigator/bits";
import { dnaText, EmptyState, GroupHead } from "./bits";
import { useLab } from "./LabProvider";

function Steps({ current }: { current: number }) {
  return (
    <ol aria-label="Tahap run" className="my-4 grid grid-cols-4 gap-1.5">
      {RUN_STEPS.map((label, i) => {
        const state = i < current ? "done" : i === current ? "now" : "next";
        return (
          <li
            key={label}
            aria-current={state === "now" ? "step" : undefined}
            className={`rounded-lg px-1 py-1.5 text-center text-xs sm:text-sm ${
              state === "done" ? "bg-ok-bg text-ok" : state === "now" ? "bg-band font-semibold text-white" : "bg-canvas text-ink-3"
            }`}
          >
            {label}
          </li>
        );
      })}
    </ol>
  );
}

/** Slot map: up to 10 samples, plus positive, negative, and no-template controls (the basis of gate S3). */
function Plate({ samples, controls }: { samples: LabSample[]; controls: boolean }) {
  const empty = Math.max(lab.run.capacity - samples.length, 0);
  return (
    <ul aria-label="Peta slot run" className="grid grid-cols-5 gap-1.5">
      {samples.map((s) => (
        <li key={s.code} className="rounded-lg border border-line p-2 text-xs">
          <span className="block font-mono text-sm font-semibold">{s.code.slice(-3)}</span>
          <span className="font-mono text-ink-3">{s.code.slice(0, 7)}</span>
        </li>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <li key={`e${i}`} className="flex min-h-[52px] items-center justify-center rounded-lg border border-dashed border-line text-xs text-ink-3">
          kosong
        </li>
      ))}
      {controls &&
        ["Kontrol +", "Kontrol -", "NTC"].map((c) => (
          <li key={c} className="rounded-lg border border-violet/20 bg-violet-soft p-2 text-xs text-violet">
            <span className="block text-sm font-semibold">{c}</span>
            per reaksi
          </li>
        ))}
    </ul>
  );
}

export function RunView() {
  const { byStage, state, finishRun, addToRunB } = useLab();
  const router = useRouter();
  const inRun = byStage("run");
  const queued = byStage("antri");
  const runB = state.runB.map((code) => state.samples.find((s) => s.code === code)!).filter((s) => s.stage === "run_b");
  const warning = runSizeWarning(runB.length, lab.run.minSamples);
  const { current, next } = lab.run;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Antrian run</h1>
        <p className="mt-1 text-ink-3">
          Satu run qPCR = sampai {lab.run.capacity} sampel × 4 reaksi multipleks + kontrol. Run penuh membuat biaya per tes paling rendah.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{current.id}</h2>
            <StatusBadge tone={state.runDone ? "ok" : "neutral"}>{state.runDone ? "Selesai" : "Berjalan"}</StatusBadge>
          </div>
          <p className="text-sm text-ink-3">
            {state.runDone ? "Hasil sudah masuk SENTINEL" : `${inRun.length} sampel`} · mulai {formatWhen(current.startedAt, lab.today)} · {current.machine}
          </p>
          <Steps current={state.runDone ? RUN_STEPS.length : current.step} />
          {state.runDone ? <EmptyState>Run selesai. Slot kosong untuk run berikutnya.</EmptyState> : <Plate samples={inRun} controls />}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {state.runDone ? (
              <button type="button" disabled className={navBtnDisabled}>
                Run sudah diselesaikan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  finishRun();
                  router.push("/lab/sentinel");
                }}
                aria-label="Selesaikan run dan buka SENTINEL"
                className={navBtnNavy}
              >
                Selesaikan run
                <ArrowRight aria-hidden className="size-4" />
                SENTINEL
              </button>
            )}
            {!state.runDone && (
              <p className="text-sm text-ink-3">
                Perkiraan selesai <span className="font-mono">{current.eta}</span>; bisa diteruskan ke perawat sebagai perkiraan tanggal hasil.
              </p>
            )}
          </div>
        </section>
        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{next.id}</h2>
            <StatusBadge tone="neutral">
              Draf · {runB.length}/{lab.run.capacity}
            </StatusBadge>
          </div>
          <p className="text-sm text-ink-3">
            Dijadwalkan {formatWhen(next.scheduledAt, lab.today)} · {next.machine}
          </p>
          <Steps current={-1} />
          <Plate samples={runB} controls={false} />
          {warning && (
            <p className="mt-4 flex gap-2 rounded-xl border border-warn-line bg-warn-bg p-3 text-sm text-warn">
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {warning}
            </p>
          )}
        </section>
      </div>

      <section>
        <GroupHead>Sudah diterima, menunggu run · {queued.length}</GroupHead>
        {queued.length ? (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {queued.map((s) => (
              <li key={s.code} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
                <div className="min-w-0 flex-[1_1_240px]">
                  <p className="flex flex-wrap items-center gap-2 text-lg font-bold">
                    <span className="font-mono">{s.code}</span>
                    <span className="rounded bg-canvas px-2 py-0.5 text-xs font-semibold text-ink-2">{s.specimen}</span>
                  </p>
                  <p className="text-sm text-ink-3">
                    {s.sender} · diterima {formatWhen(s.receivedAt, lab.today)}
                  </p>
                </div>
                <div className="flex flex-[1_1_220px] flex-wrap gap-2">
                  {evaluateLabS2(s, lab.thresholds).status === "ok" ? (
                    <StatusBadge tone="ok">S2 lulus</StatusBadge>
                  ) : (
                    <StatusBadge tone="warn">S2 diterima dengan catatan</StatusBadge>
                  )}
                  <StatusBadge tone="neutral">DNA {dnaText(s)}</StatusBadge>
                  {s.tumorPct != null && <StatusBadge tone="neutral">Tumor {s.tumorPct}%</StatusBadge>}
                </div>
                <button
                  type="button"
                  onClick={() => addToRunB(s.code)}
                  disabled={runB.length >= lab.run.capacity}
                  className={runB.length >= lab.run.capacity ? navBtnDisabled : navBtnOutline}
                >
                  <Plus aria-hidden className="size-4" />
                  Masukkan ke {next.id}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>Tidak ada sampel menunggu.</EmptyState>
        )}
      </section>
    </div>
  );
}
