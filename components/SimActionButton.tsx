"use client";

import { CircleCheck, Stethoscope, ArrowRight } from "lucide-react";
import { useSimAction } from "./SignOffProvider";
import { btnPrimary } from "./ui";

const ICONS = { stethoscope: Stethoscope, arrow: ArrowRight } as const;

/** A simulated action (recorded in memory only) that turns into a confirmation once clicked. */
export function SimActionButton({
  actionKey,
  label,
  doneLabel,
  icon = "stethoscope",
  className = "",
}: {
  actionKey: string;
  label: string;
  doneLabel: string;
  icon?: keyof typeof ICONS;
  className?: string;
}) {
  const { done, at, record, undo } = useSimAction(actionKey);
  const Icon = ICONS[icon];
  if (done) {
    return (
      <div className={`rounded border border-ok-line bg-ok-bg px-4 py-2.5 text-sm text-ok ${className}`}>
        <p className="flex items-center gap-2 font-semibold">
          <CircleCheck aria-hidden className="size-4" strokeWidth={2} />
          {doneLabel}
        </p>
        <p className="mt-0.5 flex items-center justify-between gap-2 text-ok/80">
          {at}
          <button type="button" onClick={undo} className="underline hover:text-ok">
            Batalkan
          </button>
        </p>
      </div>
    );
  }
  return (
    <button type="button" onClick={record} className={`${btnPrimary} ${className}`}>
      <Icon aria-hidden className="size-4" strokeWidth={2} />
      {label}
    </button>
  );
}
