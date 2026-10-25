"use client";

import { Repeat, Send, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { ApprovalBadge, StatusBadge } from "@/components/ui";
import { panel } from "@/lib/data";
import { lab } from "@/lib/lab/data";
import { labGates, labReflexOptions, overallStatus, reactionsToRepeat, sentinelNote, sortForSentinel } from "@/lib/lab/rules";
import type { LabSample } from "@/lib/lab/types";
import { navBtnDanger, navBtnDisabled, navBtnNavy, navBtnOutline, navBtnPink } from "../navigator/bits";
import { useHash } from "../navigator/useHash";
import { blockText, dnaText, EmptyState, GateBadge, GateRow, GroupHead } from "./bits";
import { useLab } from "./LabProvider";
import { ResultTable } from "./ResultTable";

const T = lab.thresholds;

const NOTE_STYLE = { bad: "border-bad-line bg-bad-bg text-bad", warn: "border-warn-line bg-warn-bg text-warn", ok: "border-line bg-canvas text-ink-2", wait: "border-line bg-canvas text-ink-2" };

export function SampleMeta({ s }: { s: LabSample }) {
  const facts: [string, string][] = [
    ["Spesimen", `${s.specimen} · ${blockText(s)}`],
    ["Kadar tumor", s.tumorPct == null ? "tidak berlaku" : `${s.tumorPct}%`],
    ["DNA", dnaText(s)],
    ["Run", s.run ?? "-"],
    ["Peminta", `${s.doctor} · ${s.sender}`],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {facts.map(([k, v]) => (
        <div key={k} className={k === "Peminta" || k === "Spesimen" ? "col-span-2 sm:col-span-1" : ""}>
          <dt className="text-xs font-semibold tracking-[0.08em] text-ink-3 uppercase">{k}</dt>
          <dd className="mt-0.5 text-sm font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Actions({ s }: { s: LabSample }) {
  const { sendToPathologist, repeatReactions, hold } = useLab();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const status = overallStatus(s, panel, T);

  if (status === "ok") {
    return (
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => sendToPathologist(s.code)} className={navBtnPink}>
          <Send aria-hidden className="size-4" />
          Kirim ke patolog
        </button>
      </div>
    );
  }

  if (status === "warn") {
    const repeat = reactionsToRepeat(s, panel, T);
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {repeat.length > 0 && (
            <button type="button" onClick={() => repeatReactions(s.code, repeat)} className={navBtnNavy}>
              <Repeat aria-hidden className="size-4" />
              Ulang {repeat.join(", ").toLowerCase()}
            </button>
          )}
          <button type="button" onClick={() => sendToPathologist(s.code)} className={navBtnOutline}>
            <Send aria-hidden className="size-4" />
            Kirim ke patolog dengan catatan
          </button>
        </div>
        <p className="text-sm text-ink-3">
          Bila dikirim dengan catatan, target di reaksi itu tercetak &ldquo;belum pasti&rdquo; di laporan, tidak pernah sebagai tidak terdeteksi.
        </p>
      </div>
    );
  }

  const options = labReflexOptions(s);
  const isOn = (id: string, d: boolean) => checked[id] ?? d;
  const picked = options.filter((o) => isOn(o.id, o.checked)).map((o) => o.label);
  return (
    <div className="space-y-3">
      <fieldset className="rounded-xl border border-violet/25 bg-violet-soft p-4">
        <legend className="sr-only">Saran tes lanjutan</legend>
        <p className="text-sm text-violet">
          <span className="font-bold">Saran tes lanjutan (REFLEX)</span>, dikirim ke dokter peminta; dokter yang memutuskan.
        </p>
        <div className="mt-2 space-y-1">
          {options.map((o) => (
            <label key={o.id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={isOn(o.id, o.checked)}
                onChange={(e) => setChecked((c) => ({ ...c, [o.id]: e.target.checked }))}
                className="size-5 accent-[var(--color-violet)]"
              />
              {o.label}
            </label>
          ))}
        </div>
        <div className="mt-2">
          <ApprovalBadge />
        </div>
      </fieldset>
      <button
        type="button"
        onClick={() => hold(s.code, picked)}
        disabled={picked.length === 0}
        className={picked.length ? navBtnDanger : navBtnDisabled}
      >
        <ShieldAlert aria-hidden className="size-4" />
        Tahan sampel dan kirim saran ke dokter
      </button>
    </div>
  );
}

export function SentinelView() {
  const { byStage, state } = useLab();
  const hash = useHash();
  const [picked, setPicked] = useState<string | null>(null);
  const detail = useRef<HTMLDivElement>(null);
  const list = sortForSentinel(byStage("sentinel"), panel, T);
  const held = byStage("ditahan");
  const s = list.find((x) => x.code === picked) ?? list.find((x) => x.code === hash) ?? list[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerbang mutu SENTINEL</h1>
        <p className="mt-1 text-ink-3">Hasil run dicek per sampel dan per target · target yang tidak terbaca tidak pernah disebut negatif</p>
      </div>

      {s ? (
        <div className="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <ul aria-label="Sampel di SENTINEL" className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {list.map((x) => {
              const on = x.code === s.code;
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
                      <span className="block text-sm text-ink-3">
                        {x.run} · {x.sender}
                      </span>
                    </span>
                    <GateBadge status={overallStatus(x, panel, T)} />
                  </button>
                </li>
              );
            })}
          </ul>

          <div ref={detail} className="scroll-mt-4 space-y-4 rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-mono text-2xl font-bold">{s.code}</h2>
              <GateBadge status={overallStatus(s, panel, T)} prefix="Status sampel: " size="md" />
            </div>
            <SampleMeta s={s} />
            <GateRow gates={labGates(s, panel, T)} />
            <ResultTable sample={s} />
            <p className={`rounded-xl border p-3 text-sm ${NOTE_STYLE[overallStatus(s, panel, T)]}`}>{sentinelNote(s, panel, T)}</p>
            <Actions key={s.code} s={s} />
          </div>
        </div>
      ) : (
        <EmptyState>Semua hasil sudah diputuskan. Hasil yang lulus ada di tab Tinjauan patolog.</EmptyState>
      )}

      {held.length > 0 && (
        <section>
          <GroupHead>Ditahan, saran dikirim ke dokter · {held.length}</GroupHead>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {held.map((x) => (
              <li key={x.code} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-mono text-lg font-bold">{x.code}</p>
                  <p className="text-sm text-ink-3">Saran ke {x.doctor}:</p>
                  <ul className="mt-1 list-disc pl-5 text-sm">
                    {(state.advice[x.code] ?? []).map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                  {x.patientId && (
                    <Link href={`/pasien/${x.patientId}/reflex`} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
                      Lihat yang diterima dokter (alur demo)
                    </Link>
                  )}
                </div>
                <StatusBadge tone="block">Tahan · menunggu keputusan dokter</StatusBadge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
