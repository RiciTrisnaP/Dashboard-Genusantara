import { CircleCheck, CircleDashed, CircleDot, CircleHelp, CircleX, type LucideIcon } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { CALL_LABEL, GATE_LABEL, GATE_TONE } from "@/lib/lab/rules";
import type { GateBox } from "@/lib/lab/rules";
import type { Gate, LabSample, TargetCall } from "@/lib/lab/types";

export function GateBadge({ status, prefix = "", size }: { status: Gate; prefix?: string; size?: "sm" | "md" }) {
  return (
    <StatusBadge tone={GATE_TONE[status]} size={size}>
      {prefix}
      {GATE_LABEL[status]}
    </StatusBadge>
  );
}

const CALL_STYLE: Record<TargetCall, { cls: string; icon: LucideIcon }> = {
  terdeteksi: { cls: "bg-primary-soft text-primary-strong ring-primary/30", icon: CircleDot },
  tidak_terdeteksi: { cls: "bg-neutral-bg text-ink-2 ring-line", icon: CircleCheck },
  belum_pasti: { cls: "bg-warn-bg text-warn ring-warn-line", icon: CircleHelp },
  tidak_terbaca: { cls: "bg-bad-bg text-bad ring-bad-line", icon: CircleX },
};

/** Per-target result: always icon + text, so colour is never the only signal. */
export function CallBadge({ call }: { call: TargetCall }) {
  const { cls, icon: Icon } = CALL_STYLE[call];
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${cls}`}>
      <Icon aria-hidden className="size-3.5" strokeWidth={2} />
      {CALL_LABEL[call]}
    </span>
  );
}

const GATE_BOX: Record<Gate, string> = {
  ok: "border-ok-line bg-ok-bg/60",
  warn: "border-warn-line bg-warn-bg/70",
  bad: "border-bad-line bg-bad-bg/70",
  wait: "border-line bg-canvas",
};

export function GateRow({ gates }: { gates: GateBox[] }) {
  return (
    <ol aria-label="Gerbang mutu S1 sampai S5" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {gates.map((g) => (
        <li key={g.id} className={`rounded-xl border p-3 ${GATE_BOX[g.status]}`}>
          <p className="text-sm font-bold">{g.title}</p>
          <p className="text-xs text-ink-3">{g.detail}</p>
          <div className="mt-2">
            <GateBadge status={g.status} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ctText(value: number | undefined): string {
  return value == null ? "-" : formatNumber(Math.round(value * 10) / 10);
}

export function dnaText(s: LabSample): string {
  return s.dnaNgUl == null ? "belum diukur" : `${formatNumber(s.dnaNgUl)} ng/µL`;
}

export function blockText(s: LabSample): string {
  if (s.block == null) return "Blok belum diterima";
  const age = s.blockAgeMonths == null ? "" : s.blockAgeMonths >= 12 ? `, ${Math.round(s.blockAgeMonths / 12)} tahun` : `, ${s.blockAgeMonths} bulan`;
  return `${s.block}${s.decalcified ? " (didekalsifikasi)" : ""}${age}`;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-white p-6 text-ink-3">
      <CircleDashed aria-hidden className="size-5 shrink-0" />
      {children}
    </div>
  );
}

export function GroupHead({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "bad" }) {
  return <h2 className={`mb-2 text-sm font-bold tracking-[0.08em] uppercase ${tone === "bad" ? "text-bad" : "text-ink-3"}`}>{children}</h2>;
}
