import { TriangleAlert } from "lucide-react";

export function SimulationBanner() {
  return (
    <div role="note" className="sticky top-0 z-50 bg-banner-bg text-banner-ink print:static">
      <p className="mx-auto flex max-w-[1440px] items-center justify-center gap-2 px-4 py-1.5 text-center text-sm font-semibold print:py-0.5 print:text-[8pt]">
        <TriangleAlert aria-hidden className="size-4 shrink-0 print:size-3" strokeWidth={2} />
        SIMULASI, bukan untuk keputusan klinis
      </p>
    </div>
  );
}
