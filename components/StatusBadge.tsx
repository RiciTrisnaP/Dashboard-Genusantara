import type { Tone } from "@/lib/rules/sentinel";

const TONE_CLASSES: Record<Tone, string> = {
  ok: "bg-emerald-50 text-emerald-800 ring-emerald-300",
  warn: "bg-amber-50 text-amber-900 ring-amber-300",
  block: "bg-rose-50 text-rose-800 ring-rose-300",
  neutral: "bg-slate-100 text-slate-700 ring-slate-300",
};

export function toneClasses(tone: Tone): string {
  return TONE_CLASSES[tone];
}

/** Status codes such as AMBIL_ULANG are shown as "AMBIL ULANG". */
export function statusText(status: string): string {
  return status.replaceAll("_", " ");
}

export function StatusBadge({ tone, children, size = "sm" }: { tone: Tone; children: React.ReactNode; size?: "sm" | "lg" }) {
  const sizing = size === "lg" ? "px-3 py-1 text-base" : "px-2 py-0.5 text-xs";
  return (
    <span className={`inline-flex items-center rounded-md font-semibold whitespace-nowrap ring-1 ring-inset ${sizing} ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}
