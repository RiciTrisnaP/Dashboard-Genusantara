"use client";

import { Bell, Check, X } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/ui";
import { panel } from "@/lib/data";
import { lab } from "@/lib/lab/data";
import { evaluateLabS2, INTAKE_GROUPS, overallStatus, REJECT_REASONS, suggestedRejectReason } from "@/lib/lab/rules";
import type { LabSample } from "@/lib/lab/types";
import { formatDayLong, formatWhen } from "@/lib/navigator/format";
import { navBtnDanger, navBtnNavy, navBtnOutline } from "../navigator/bits";
import { blockText, EmptyState, GroupHead } from "./bits";
import { useLab } from "./LabProvider";

const S2_BADGE = {
  ok: { tone: "ok", text: "S2 lulus" },
  warn: { tone: "warn", text: "S2 perlu ditinjau" },
  wait: { tone: "neutral", text: "Blok belum diterima" },
  bad: { tone: "block", text: "S2 tahan" },
} as const;

function IntakeRow({ s }: { s: LabSample }) {
  const { accept, reject, remind, state } = useLab();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState<string>(() => suggestedRejectReason(s, lab.thresholds));
  const s2 = evaluateLabS2(s, lab.thresholds);
  const badge = S2_BADGE[s2.status];
  const reminded = state.reminded[s.code];

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-0 flex-[1_1_300px]">
          <p className="flex flex-wrap items-center gap-2 text-lg font-bold">
            <span className="font-mono">{s.code}</span>
            <span className="rounded bg-canvas px-2 py-0.5 text-xs font-semibold text-ink-2">{s.specimen}</span>
          </p>
          <p className="text-sm text-ink-3">
            {s.sender} · {s.doctor}
          </p>
          <p className={`mt-1 text-sm ${s2.status === "warn" ? "font-semibold text-warn" : "text-ink-2"}`}>{s2.reasons.join(" ")}</p>
        </div>
        <div className="flex flex-[1_1_200px] flex-wrap gap-2">
          <StatusBadge tone="ok">S1 lulus</StatusBadge>
          <StatusBadge tone={badge.tone}>{badge.text}</StatusBadge>
          {s.tumorPct != null && <StatusBadge tone="neutral">Tumor {s.tumorPct}%</StatusBadge>}
        </div>
        <div className="flex-[1_1_170px] text-sm text-ink-3">
          <p className="font-semibold text-ink">{blockText(s)}</p>
          Masuk: {formatWhen(s.receivedAt, lab.today)}
        </div>
        <div className="flex flex-wrap gap-2">
          {s2.status === "wait" ? (
            <button type="button" onClick={() => remind(s.code)} disabled={reminded} className={reminded ? `${navBtnOutline} opacity-60` : navBtnOutline}>
              <Bell aria-hidden className="size-4" />
              {reminded ? "Pengingat terkirim" : "Ingatkan patologi RS"}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => accept(s.code)} className={s2.status === "ok" ? navBtnNavy : navBtnOutline}>
                <Check aria-hidden className="size-4" />
                Terima
              </button>
              <button type="button" onClick={() => setRejecting((v) => !v)} aria-expanded={rejecting} className={navBtnDanger}>
                <X aria-hidden className="size-4" />
                Tolak
              </button>
            </>
          )}
        </div>
      </div>
      {rejecting && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-bad-bg/60 p-3">
          <label className="sr-only" htmlFor={`alasan-${s.code}`}>
            Alasan penolakan
          </label>
          <select
            id={`alasan-${s.code}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-11 max-w-full rounded-lg border border-line bg-white px-3 text-sm"
          >
            {REJECT_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <button type="button" onClick={() => reject(s.code, reason)} className={navBtnDanger}>
            Tolak dan kabari dokter
          </button>
          <button type="button" onClick={() => setRejecting(false)} className={navBtnOutline}>
            Batal
          </button>
        </div>
      )}
    </li>
  );
}

export function IntakeView() {
  const { byStage, state } = useLab();
  const incoming = byStage("masuk");
  const held = byStage("sentinel").filter((s) => overallStatus(s, panel, lab.thresholds) === "bad").length;
  const rejected = byStage("ditolak");

  const kpis = [
    { label: "Masuk hari ini", value: incoming.length, note: "menunggu diperiksa" },
    { label: "Dalam run", value: byStage("run").length, note: state.runDone ? `${lab.run.current.id} selesai` : `${lab.run.current.id}, tahap qPCR` },
    { label: "Tertahan SENTINEL", value: held, note: "perlu keputusan hari ini", alert: held > 0 },
    { label: "Menunggu patolog", value: byStage("patolog").length, note: "belum dirilis ke dokter" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">{formatDayLong(lab.today)}</p>
        <h1 className="mt-0.5 text-3xl font-bold">Sampel masuk</h1>
        <p className="mt-1 text-ink-3">Permintaan tes yang sudah disetujui dokter · periksa spesimen (S2) sebelum DNA diekstraksi</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <li key={k.label} className={`rounded-2xl border bg-white p-4 ${k.alert ? "border-2 border-bad-line" : "border-line"}`}>
            <p className="text-sm text-ink-3">{k.label}</p>
            <p className={`my-0.5 font-mono text-3xl font-semibold tabular ${k.alert ? "text-bad" : ""}`}>{k.value}</p>
            <p className="text-xs text-ink-3">{k.note}</p>
          </li>
        ))}
      </ul>

      {INTAKE_GROUPS.map((g) => {
        const list = incoming.filter((s) => evaluateLabS2(s, lab.thresholds).status === g.status);
        if (!list.length) return null;
        return (
          <section key={g.status}>
            <GroupHead tone={g.status === "warn" ? "bad" : "default"}>
              {g.label} · {list.length}
            </GroupHead>
            <ul className={`divide-y divide-line rounded-2xl border bg-white ${g.status === "warn" ? "border-2 border-warn-line" : "border-line"}`}>
              {list.map((s) => (
                <IntakeRow key={s.code} s={s} />
              ))}
            </ul>
          </section>
        );
      })}
      {incoming.length === 0 && <EmptyState>Tidak ada sampel baru. Sampel yang diterima ada di tab Antrian run.</EmptyState>}

      {rejected.length > 0 && (
        <section>
          <GroupHead>Ditolak · {rejected.length}</GroupHead>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {rejected.map((s) => (
              <li key={s.code} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-mono text-lg font-bold">{s.code}</p>
                  <p className="text-sm text-ink-3">
                    {s.sender} · {state.rejected[s.code]}
                  </p>
                </div>
                <StatusBadge tone="block">Ditolak · dokter dikabari</StatusBadge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
