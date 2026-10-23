import type { LayerResult } from "@/lib/rules/sentinel";
import { StatusBadge, statusText } from "./StatusBadge";

export function LayerRow({ layer, children }: { layer: LayerResult<string>; children?: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start">
      <div className="flex w-44 shrink-0 items-center gap-2">
        <span className="font-mono text-sm font-bold text-slate-400">{layer.id}</span>
        <span className="font-semibold text-slate-800">{layer.name}</span>
      </div>
      <div className="w-36 shrink-0">
        <StatusBadge tone={layer.tone}>{statusText(layer.status)}</StatusBadge>
      </div>
      <div className="min-w-0 flex-1 text-sm text-slate-700">
        <p>{layer.reason}</p>
        {layer.details.length > 0 && (
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-600">
            {layer.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )}
        {children}
      </div>
    </li>
  );
}

export function PendingLayerRow({ id, name, reason }: { id: string; name: string; reason: string }) {
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start">
      <div className="flex w-44 shrink-0 items-center gap-2">
        <span className="font-mono text-sm font-bold text-slate-400">{id}</span>
        <span className="font-semibold text-slate-800">{name}</span>
      </div>
      <div className="w-36 shrink-0">
        <StatusBadge tone="neutral">BELUM DINILAI</StatusBadge>
      </div>
      <p className="flex-1 text-sm text-slate-500">{reason}</p>
    </li>
  );
}
