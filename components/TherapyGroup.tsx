import { GROUP_TITLES, type TherapyGroupId, type TherapyOption } from "@/lib/rules/triase";

const GROUP_STYLE: Record<TherapyGroupId, { head: string; letter: string }> = {
  A: { head: "border-emerald-300 bg-emerald-50 text-emerald-950", letter: "bg-emerald-600" },
  B: { head: "border-amber-300 bg-amber-50 text-amber-950", letter: "bg-amber-500" },
  C: { head: "border-slate-300 bg-slate-100 text-slate-800", letter: "bg-slate-500" },
};

const EMPTY_TEXT: Record<TherapyGroupId, string> = {
  A: "Tidak ada pilihan yang sesuai dan tersedia.",
  B: "Tidak ada.",
  C: "Tidak ada.",
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function TherapyGroup({ id, options }: { id: TherapyGroupId; options: TherapyOption[] }) {
  const style = GROUP_STYLE[id];
  return (
    <div className="avoid-break overflow-hidden rounded-md border border-slate-200">
      <h4 className={`flex items-center gap-2 border-b px-3 py-1.5 text-sm font-semibold print:py-0.5 print:text-[8pt] ${style.head}`}>
        <span className={`flex size-5 items-center justify-center rounded text-xs font-bold text-white ${style.letter}`}>
          {id.toLowerCase()}
        </span>
        {GROUP_TITLES[id]}
        <span className="font-normal opacity-70">({options.length})</span>
      </h4>
      {options.length === 0 ? (
        <p className="px-3 py-2 text-sm text-slate-500 print:py-0.5 print:text-[7.5pt]">{EMPTY_TEXT[id]}</p>
      ) : (
        <table className="w-full text-left text-xs print:text-[7.5pt]">
          <thead className="bg-white text-[11px] text-slate-500 print:text-[7pt]">
            <tr>
              <th className="px-3 py-1 font-semibold">Terapi</th>
              <th className="px-2 py-1 font-semibold">OncoKB</th>
              <th className="px-2 py-1 font-semibold">BPOM</th>
              <th className="px-2 py-1 font-semibold">JKN</th>
              <th className="px-2 py-1 font-semibold">Harga</th>
              <th className="px-2 py-1 font-semibold whitespace-nowrap">Dicek</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 align-top">
            {options.map((o) => (
              <tr key={o.drug}>
                <td className="px-3 py-1.5 print:py-1">
                  <div className="font-semibold text-slate-900">
                    {capitalize(o.regimen)}
                    {o.brand && <span className="font-normal text-slate-500"> ({o.brand})</span>}
                  </div>
                  <div className={id === "C" ? "text-slate-700" : "font-medium text-slate-800"}>
                    {id === "C" ? o.reason : o.statusLabel}
                  </div>
                  {o.supportingVariants.length > 0 && (
                    <div className="text-slate-500">Berdasarkan: {o.supportingVariants.join(", ")}</div>
                  )}
                  {o.indicationNote && <div className="text-amber-800">Catatan: {o.indicationNote}</div>}
                  {o.researchLevelOnly && <div className="text-amber-800">Tingkat riset atau pedoman saja.</div>}
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap print:py-1">{o.level ? `Level ${o.level}` : "-"}</td>
                <td className="px-2 py-1.5 print:py-1">{o.bpomText}</td>
                <td className={`px-2 py-1.5 print:py-1 ${o.jknCovered ? "" : "font-medium"}`}>{o.jknText}</td>
                <td className="px-2 py-1.5 print:py-1">{o.priceText}</td>
                <td className="px-2 py-1.5 whitespace-nowrap print:py-1">{o.accessCheckedDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
