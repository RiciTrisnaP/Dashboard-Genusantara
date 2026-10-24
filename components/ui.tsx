// Shared visual primitives from the Pencil design system: status badges (always icon + text), buttons, labels.
import { CircleCheck, CircleDashed, CircleX, Stethoscope, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/rules/sentinel";

const BADGE_TONE: Record<Tone, string> = {
  ok: "bg-ok-bg text-ok ring-ok-line",
  warn: "bg-warn-bg text-warn ring-warn-line",
  block: "bg-bad-bg text-bad ring-bad-line",
  neutral: "bg-neutral-bg text-ink-2 ring-line",
};

export const TONE_ICON: Record<Tone, LucideIcon> = {
  ok: CircleCheck,
  warn: TriangleAlert,
  block: CircleX,
  neutral: CircleDashed,
};

export const TONE_TEXT: Record<Tone, string> = {
  ok: "text-ok",
  warn: "text-warn",
  block: "text-bad",
  neutral: "text-ink-2",
};

/** Status codes such as AMBIL_ULANG are shown as "AMBIL ULANG". */
export function statusText(status: string): string {
  return status.replaceAll("_", " ");
}

export function StatusBadge({
  tone,
  icon,
  children,
  size = "sm",
  className = "",
}: {
  tone: Tone;
  icon?: LucideIcon;
  children: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  const Icon = icon ?? TONE_ICON[tone];
  const sizing = size === "md" ? "gap-1.5 px-2.5 py-1 text-sm" : "gap-1 px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex max-w-full items-center rounded text-left font-semibold tracking-wide uppercase ring-1 ring-inset sm:whitespace-nowrap ${sizing} ${BADGE_TONE[tone]} ${className}`}
    >
      <Icon aria-hidden className={`shrink-0 ${size === "md" ? "size-4" : "size-3.5"}`} strokeWidth={2} />
      <span className="min-w-0">{children}</span>
    </span>
  );
}

export function ApprovalBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-warn-solid bg-warn-bg font-semibold text-warn sm:whitespace-nowrap ${
        size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"
      }`}
    >
      <Stethoscope aria-hidden className="size-4" strokeWidth={2} />
      Butuh persetujuan dokter
    </span>
  );
}

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs font-semibold tracking-[0.12em] text-primary uppercase ${className}`}>{children}</p>;
}

export function SectionNumber({ n }: { n: number }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-strong">
      {n}
    </span>
  );
}

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded bg-band px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-band-deep";
/** Solid white button for pink backgrounds. */
export const btnOnPink =
  "inline-flex items-center justify-center gap-2 rounded bg-white px-4 py-2.5 text-sm font-semibold text-primary-strong transition-colors hover:bg-primary-soft";
/** Outline button for dark (navy) backgrounds. */
export const btnOnDark =
  "inline-flex items-center justify-center gap-2 rounded border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-canvas";

export const card = "rounded-2xl border border-line bg-white";
