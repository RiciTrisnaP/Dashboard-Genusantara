"use client";

import { formatNumber, formatRupiah } from "@/lib/format";
import { lab } from "@/lib/lab/data";
import { delayNote, medianTat, retestPct } from "@/lib/lab/rules";
import { useLab } from "./LabProvider";

export function LabPerformanceView() {
  const { state, byStage } = useLab();
  const { month, pricing } = lab;
  const target = pricing.tatTargetDays;
  const med = medianTat(state.released);
  const retests = month.retests + state.retests;
  const pct = retestPct(retests, month.samples);
  const held = month.heldBefore + byStage("ditahan").length;
  const max = Math.max(12, ...state.released.map((r) => r.tatDays));
  const note = delayNote(state.released, target);

  const kpis = [
    { label: "Sampel bulan ini", value: String(month.samples), note: `dari ${month.senders} RS pengirim; menguji asumsi 300 sampel per lab per tahun` },
    {
      label: "Waktu tunggu median",
      value: med == null ? "-" : `${formatNumber(med)} hari`,
      note: `hari kerja, terima sampai rilis; target contoh ≤${target}`,
      warn: med != null && med > target,
    },
    { label: "Tes ulang", value: `${pct}%`, note: `${retests} dari ${month.samples}; batas model biaya ${pricing.retestLimitPct}%`, warn: pct > pricing.retestLimitPct },
    { label: "Sampel ditahan", value: String(held), note: "dikembalikan ke dokter dengan saran tes lanjutan" },
    {
      label: "Lisensi Genusa",
      value: formatRupiah(month.samples * pricing.licensePerSample),
      note: `${month.samples} × ${formatRupiah(pricing.licensePerSample)}; sudah termasuk di harga tes, bukan biaya tambahan ke pasien`,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Kinerja lab</h1>
        <p className="mt-1 text-ink-3">{month.label} · dasar perhitungan waktu tunggu, tes ulang, dan tagihan lisensi. Target adalah contoh untuk demo.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <li key={k.label} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-sm text-ink-3">{k.label}</p>
            <p className={`my-0.5 font-mono text-2xl font-semibold tabular xl:text-3xl ${k.warn ? "text-warn" : ""}`}>{k.value}</p>
            <p className="text-xs text-ink-3">{k.note}</p>
          </li>
        ))}
      </ul>
      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="text-base font-bold">Waktu tunggu per sampel yang dirilis</h2>
        <p className="mb-4 text-sm text-ink-3">Hari kerja dari sampel diterima sampai hasil dirilis. Di atas {target} hari ditandai oranye.</p>
        <ul className="space-y-3">
          {state.released.map((r) => {
            const over = r.tatDays > target;
            return (
              <li key={r.code} className="grid grid-cols-[104px_minmax(0,1fr)_64px] items-center gap-3 sm:grid-cols-[120px_minmax(0,1fr)_80px]">
                <span className="font-mono text-sm font-semibold">{r.code}</span>
                <span className="relative block h-3 rounded-full bg-neutral-bg">
                  <span
                    className={`absolute inset-y-0 left-0 rounded-full ${over ? "bg-warn-solid" : "bg-band"}`}
                    style={{ width: `${Math.round((r.tatDays / max) * 100)}%` }}
                  />
                  <span className="absolute inset-y-[-3px] w-0.5 bg-ink-3" style={{ left: `${Math.round((target / max) * 100)}%` }} aria-hidden />
                </span>
                <span className={`text-right font-mono text-sm tabular ${over ? "font-semibold text-warn" : ""}`}>{r.tatDays} hari</span>
              </li>
            );
          })}
        </ul>
        {note && <p className="mt-4 rounded-xl bg-canvas p-3 text-sm text-ink-2">{note}</p>}
      </section>
    </div>
  );
}
