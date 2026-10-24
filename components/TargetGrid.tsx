import { CircleCheck, EyeOff, Sparkles } from "lucide-react";
import type { TargetReadout } from "@/lib/rules/sentinel";

export function TargetGrid({ readouts, variantTargets }: { readouts: TargetReadout[]; variantTargets: string[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {readouts.map((r) => {
        const hasVariant = r.readable && variantTargets.includes(r.target);
        const style = hasVariant
          ? "border-2 border-primary bg-primary-soft"
          : r.readable
            ? "border border-ok-line bg-ok-bg"
            : "border border-bad-line bg-bad-bg";
        return (
          <li key={r.target} title={r.reason} className={`rounded-xl px-4 py-3 ${style}`}>
            <p className="font-mono text-sm text-ink-2">{r.gene}</p>
            <p className="font-mono text-2xl font-semibold text-ink">{r.codon}</p>
            <p
              className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${
                hasVariant ? "text-primary-strong" : r.readable ? "text-ok" : "text-bad"
              }`}
            >
              {hasVariant ? (
                <Sparkles aria-hidden className="size-4" strokeWidth={2} />
              ) : r.readable ? (
                <CircleCheck aria-hidden className="size-4" strokeWidth={2} />
              ) : (
                <EyeOff aria-hidden className="size-4" strokeWidth={2} />
              )}
              {hasVariant ? "Varian terdeteksi" : r.readable ? "Terbaca" : "Tidak dinilai"}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
