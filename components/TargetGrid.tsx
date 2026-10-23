import type { TargetReadout } from "@/lib/rules/sentinel";

export function TargetGrid({ readouts, compact = false }: { readouts: TargetReadout[]; compact?: boolean }) {
  return (
    <ul className={`grid gap-1.5 ${compact ? "grid-cols-5" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"}`}>
      {readouts.map((r) => (
        <li
          key={r.target}
          title={r.reason}
          className={`rounded border px-2 py-1.5 text-xs ${
            r.readable ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-300 bg-rose-50 text-rose-900"
          }`}
        >
          <div className="font-semibold">
            <span aria-hidden>{r.readable ? "✓ " : "✕ "}</span>
            {r.target}
          </div>
          {!compact && <div className="text-[11px] opacity-80">{r.readable ? r.reason : `Tidak dinilai. ${r.reason}`}</div>}
        </li>
      ))}
    </ul>
  );
}
