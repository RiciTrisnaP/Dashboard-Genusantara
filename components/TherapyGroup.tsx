import { CircleCheck, CircleMinus, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/rules/sentinel";
import { GROUP_TITLES, type AccessCell, type TherapyGroupId, type TherapyOption } from "@/lib/rules/triase";
import { TONE_ICON, TONE_TEXT } from "./ui";

const GROUP_CHIP: Record<TherapyGroupId, { cls: string; icon: LucideIcon }> = {
  A: { cls: "bg-ok-bg text-ok ring-ok-line", icon: CircleCheck },
  B: { cls: "bg-warn-bg text-warn ring-warn-line", icon: TriangleAlert },
  C: { cls: "bg-neutral-bg text-ink-2 ring-line", icon: CircleMinus },
};

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function GroupChip({ id }: { id: TherapyGroupId }) {
  const { cls, icon: Icon } = GROUP_CHIP[id];
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-sm font-semibold ring-1 ring-inset ${cls}`}>
      <Icon aria-hidden className="size-4" strokeWidth={1.75} />({id.toLowerCase()})
    </span>
  );
}

function AccessLine({ cell, mono = false }: { cell: AccessCell; mono?: boolean }) {
  const Icon = TONE_ICON[cell.tone as Tone];
  return (
    <p className={`flex items-center gap-1.5 font-semibold ${TONE_TEXT[cell.tone]} ${mono ? "font-mono" : ""}`}>
      <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
      {cell.label}
    </p>
  );
}

function basis(o: TherapyOption) {
  const parts = [o.level ? `OncoKB Level ${o.level}` : null, o.supportingVariants.length ? `berdasarkan ${o.supportingVariants.join(", ")}` : null];
  return parts.filter(Boolean).join(" · ");
}

function GroupHeader({ id, count }: { id: TherapyGroupId; count: number }) {
  return (
    <h4 className="flex items-center gap-3 text-lg font-semibold">
      <GroupChip id={id} />
      {GROUP_TITLES[id]}
      {count === 0 && <span className="text-base font-normal text-ink-3">Tidak ada.</span>}
    </h4>
  );
}

function OptionCard({ o }: { o: TherapyOption }) {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-ok-line">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-5 pb-4 sm:px-6">
        <div>
          <p className="text-xl font-semibold sm:text-2xl">{capitalize(o.regimen)}</p>
          {o.isFallback ? (
            <p className="mt-0.5 font-medium text-warn">{o.statusLabel}</p>
          ) : (
            <p className="mt-0.5 text-ink-2">
              {o.brand ? `Merek: ${o.brand} · ` : ""}
              {basis(o)}
            </p>
          )}
          {o.indicationNote && <p className="mt-1 text-sm text-warn">Catatan: {o.indicationNote}</p>}
        </div>
        {o.level ? (
          <span className="rounded bg-primary-soft px-3 py-1 font-mono font-semibold text-primary-strong">OncoKB Level {o.level}</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded border border-warn-line bg-warn-bg px-3 py-1 text-sm font-semibold text-warn uppercase">
            <Info aria-hidden className="size-4" strokeWidth={1.75} />
            Bukan terapi khusus ESR1
          </span>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-px border-t border-line bg-line xl:grid-cols-4">
        <div className="bg-white px-4 py-4 sm:px-6">
          <dt className="text-xs font-semibold tracking-[0.1em] text-ink-3 uppercase">BPOM</dt>
          <dd className="mt-1">
            <AccessLine cell={o.bpom} />
            {o.bpom.detail && <p className="mt-0.5 font-mono text-sm text-ink-2">{o.bpom.detail}</p>}
          </dd>
        </div>
        <div className="bg-white px-4 py-4 sm:px-6">
          <dt className="text-xs font-semibold tracking-[0.1em] text-ink-3 uppercase">JKN</dt>
          <dd className="mt-1">
            <AccessLine cell={o.jkn} />
            {o.jkn.detail && <p className="mt-0.5 text-sm text-ink-2">{capitalize(o.jkn.detail)}</p>}
          </dd>
        </div>
        <div className="bg-white px-4 py-4 sm:px-6">
          <dt className="text-xs font-semibold tracking-[0.1em] text-ink-3 uppercase">Harga</dt>
          <dd className="mt-1">
            <p className={`font-mono text-lg font-semibold tabular sm:text-xl ${o.price == null ? "text-warn" : ""}`}>{o.market.label}</p>
            {o.market.detail && <p className="mt-0.5 text-sm text-ink-2">{o.market.detail}</p>}
          </dd>
        </div>
        <div className="bg-white px-4 py-4 sm:px-6">
          <dt className="text-xs font-semibold tracking-[0.1em] text-ink-3 uppercase">Dicek</dt>
          <dd className="mt-1">
            <p className="font-mono text-lg font-semibold sm:text-xl">{o.accessCheckedDate}</p>
            <p className="mt-0.5 text-sm text-ink-2">Status dan harga dapat berubah</p>
          </dd>
        </div>
      </dl>
      <p className="flex items-start gap-2 border-t border-line bg-canvas px-4 py-2.5 text-sm text-ink-2 sm:items-center sm:px-6">
        <Info aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
        Pilihan untuk dibahas, bukan resep. Kelayakan pasien dan ketersediaan stok dikonfirmasi oleh dokter.
      </p>
    </div>
  );
}

function OptionRows({ options, group }: { options: TherapyOption[]; group: "B" | "C" }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
      {options.map((o) => (
        <li key={o.drug} className="grid gap-3 px-4 py-4 sm:px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_auto] md:items-center">
          <div>
            <p className="text-lg font-semibold">
              {capitalize(o.regimen)}
              {o.brand && <span className="font-normal text-ink-3"> ({o.brand})</span>}
            </p>
            <p className="font-mono text-sm text-ink-3">{basis(o)}</p>
            {group === "B" && o.indicationNote && <p className="mt-1 text-sm text-warn">Catatan: {o.indicationNote}</p>}
          </div>
          {group === "B" ? (
            <div className="space-y-0.5">
              <AccessLine cell={o.bpom} />
              <AccessLine cell={o.bpom.tone === "ok" ? o.market : o.jkn} />
              {o.statusLabel === "Status akses belum dinilai" && <p className="text-sm text-ink-3">{o.statusLabel}</p>}
            </div>
          ) : (
            <div>
              <p className="text-ink-2">{o.reason}</p>
              <p className="mt-1 font-mono text-xs text-ink-3">
                {o.bpom.label} · {o.jkn.label} · {o.market.label}
              </p>
            </div>
          )}
          <p className="font-mono text-sm whitespace-nowrap text-ink-3">dicek {o.accessCheckedDate}</p>
        </li>
      ))}
    </ul>
  );
}

export function TherapyGroups({ groups, readableCount }: { groups: Record<TherapyGroupId, TherapyOption[]>; readableCount: number }) {
  const total = groups.A.length + groups.B.length + groups.C.length;
  if (total === 0) {
    const rows: [TherapyGroupId, string][] = [
      ["A", `Tidak ada pilihan terapi berbasis varian dari ${readableCount} target ini.`],
      ["B", "Tidak ada."],
      ["C", "Terapi khusus PIK3CA, AKT1, dan ESR1: varian di target tersebut tidak terdeteksi."],
    ];
    return (
      <div className="space-y-3">
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
          {rows.map(([id, text]) => (
            <li key={id} className="grid gap-2 px-4 py-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
              <p className="flex items-center gap-3 font-semibold">
                <GroupChip id={id} />
                {GROUP_TITLES[id]}
              </p>
              <p className="text-ink-2">{text}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm text-ink-3">Pilihan terapi standar tetap ditentukan dokter sesuai pedoman yang berlaku.</p>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <GroupHeader id="A" count={groups.A.length} />
        {groups.A.map((o) => (
          <OptionCard key={o.drug} o={o} />
        ))}
      </div>
      <div className="space-y-3">
        <GroupHeader id="B" count={groups.B.length} />
        {groups.B.length > 0 && <OptionRows options={groups.B} group="B" />}
      </div>
      <div className="space-y-3">
        <GroupHeader id="C" count={groups.C.length} />
        {groups.C.length > 0 && <OptionRows options={groups.C} group="C" />}
      </div>
    </div>
  );
}
