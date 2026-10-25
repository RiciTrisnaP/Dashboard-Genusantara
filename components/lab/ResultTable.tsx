import { panel } from "@/lib/data";
import { lab } from "@/lib/lab/data";
import { reactionResults } from "@/lib/lab/rules";
import type { LabSample } from "@/lib/lab/types";
import { CallBadge, ctText, GateBadge } from "./bits";

/** The 11 targets grouped per multiplex reaction: a failed reaction only affects its own targets. */
export function ResultTable({ sample }: { sample: LabSample }) {
  const rx = reactionResults(sample, panel, lab.thresholds);
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 bg-canvas px-4 py-2 text-xs font-semibold tracking-[0.08em] text-ink-3 uppercase">
        <span>Target</span>
        <span>Hasil</span>
      </div>
      {rx.map((r) => (
        <section key={r.reaction.id} aria-label={r.reaction.label} className="border-t border-line">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-bg/60 px-4 py-2">
            <p className="text-sm font-bold">
              {r.reaction.label} · multipleks {r.targets.length} target
            </p>
            <p className="flex items-center gap-2 text-sm text-ink-2">
              Ct kontrol internal <span className="font-mono font-semibold">{ctText(r.ct)}</span>
              <GateBadge status={r.status} />
            </p>
          </div>
          <ul className="divide-y divide-line">
            {r.targets.map((t) => (
              <li key={t.target.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2">
                <span className="text-sm">
                  <span className="text-ink-3">{t.target.gene}</span> <span className="font-mono font-semibold">{t.target.allele}</span>
                </span>
                <span title={t.reason}>
                  <CallBadge call={t.call} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
