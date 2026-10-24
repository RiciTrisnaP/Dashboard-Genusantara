import type { LayerResult } from "@/lib/rules/sentinel";
import { StatusBadge, statusText } from "./ui";

const ROW_TINT = { ok: "", warn: "", block: "bg-bad-bg/40", neutral: "" } as const;

export function LayerRow({ layer }: { layer: LayerResult<string> }) {
  return (
    <li className={`flex items-start gap-4 px-6 py-5 ${ROW_TINT[layer.tone]}`}>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-canvas text-base font-bold text-ink">
        {layer.id}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-lg font-semibold">{layer.name}</h3>
          <StatusBadge tone={layer.tone} size="md">
            {statusText(layer.status)}
          </StatusBadge>
        </div>
        <p className="mt-0.5 text-ink-2">{layer.reason}</p>
        {layer.details.length > 0 && (
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-ink-2">
            {layer.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function PendingLayerRow({ id, name, reason }: { id: string; name: string; reason: string }) {
  return (
    <li className="flex items-start gap-4 px-6 py-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-canvas text-base font-bold text-ink-3">
        {id}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-ink-2">{name}</h3>
          <StatusBadge tone="neutral" size="md">
            Belum dinilai
          </StatusBadge>
        </div>
        <p className="mt-0.5 text-ink-3">{reason}</p>
      </div>
    </li>
  );
}
