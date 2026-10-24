import { EyeOff } from "lucide-react";
import { NOT_NEGATIVE_WARNING } from "@/lib/rules/sentinel";

/** The "do not read as no mutation" warning. `detail` adds a second line in the large variant. */
export function NotNegativeAlert({ detail, compact = false }: { detail?: string; compact?: boolean }) {
  if (compact) {
    return (
      <p role="alert" className="flex items-center gap-3 rounded-lg border-2 border-bad-solid bg-bad-bg px-5 py-3 text-lg font-semibold text-bad">
        <EyeOff aria-hidden className="size-5 shrink-0" strokeWidth={2} />
        {NOT_NEGATIVE_WARNING}
      </p>
    );
  }
  return (
    <div role="alert" className="flex items-start gap-4 rounded-2xl bg-bad-solid px-5 py-5 text-white sm:gap-5 sm:px-7 sm:py-6">
      <EyeOff aria-hidden className="mt-1 size-7 shrink-0 sm:size-9" strokeWidth={1.75} />
      <div>
        <p className="text-xl font-bold sm:text-3xl">{NOT_NEGATIVE_WARNING}</p>
        {detail && <p className="mt-1.5 text-base text-white/90 sm:text-lg">{detail}</p>}
      </div>
    </div>
  );
}
