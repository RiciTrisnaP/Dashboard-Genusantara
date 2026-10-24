"use client";

import { formatNumber } from "@/lib/format";
import { navigator } from "@/lib/navigator/data";
import { contactsInMonth, isOverdue, median, MINUTES_LIMIT, RESPONSE_STANDARD_HOURS } from "@/lib/navigator/rules";
import { shortNav } from "./bits";
import { useNavigator } from "./NavigatorProvider";

export function PerformanceView() {
  const { patient, isTaskDone } = useNavigator();
  const all = navigator.patients.map((p) => patient(p.id)!);
  const active = all.filter((p) => p.journey !== "selesai");
  const month = navigator.today.slice(0, 7);
  const med = median(navigator.responseTimesHours);
  const late = navigator.tasks.filter((t) => isOverdue(t, navigator.today, isTaskDone(t))).length;
  const avgMin = Math.round(active.reduce((n, p) => n + p.minutesThisMonth, 0) / Math.max(active.length, 1));
  const maxMin = Math.max(130, ...active.map((p) => p.minutesThisMonth));

  const kpis = [
    { label: "Pasien aktif", value: String(active.length), note: "tidak termasuk yang selesai" },
    { label: "Kontak bulan ini", value: String(contactsInMonth(all, month)), note: "WhatsApp, telepon, tatap muka, dokumen" },
    {
      label: "Waktu respons median",
      value: med == null ? "-" : `${formatNumber(Math.round(med * 10) / 10)} jam`,
      note: `standar minimum: di bawah ${RESPONSE_STANDARD_HOURS} jam (asumsi)`,
      warn: med != null && med >= RESPONSE_STANDARD_HOURS,
    },
    { label: "Tugas terlambat", value: String(late), note: "lebih dari 1 hari kerja", warn: late > 0 },
    { label: "Menit per pasien", value: `${avgMin} mnt`, note: `rata-rata; batas ${MINUTES_LIMIT} menit per bulan`, warn: avgMin > MINUTES_LIMIT },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Kinerja dan beban kerja</h1>
        <p className="mt-1 text-ink-3">Oktober 2026 · dasar standar minimum layanan dan insentif perawat. Target adalah asumsi untuk diuji saat pilot, bukan janji.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <li key={k.label} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-sm text-ink-3">{k.label}</p>
            <p className={`my-0.5 font-mono text-3xl font-semibold tabular ${k.warn ? "text-warn" : ""}`}>{k.value}</p>
            <p className="text-xs text-ink-3">{k.note}</p>
          </li>
        ))}
      </ul>
      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="text-base font-bold">Menit kerja per pasien bulan ini</h2>
        <p className="mb-4 text-sm text-ink-3">
          Batas di model bisnis: {MINUTES_LIMIT} menit per pasien per bulan. Di atas batas ditandai oranye. Setiap tindakan di dashboard menambah 5 menit
          (simulasi).
        </p>
        <ul className="space-y-3">
          {active.map((p) => {
            const over = p.minutesThisMonth > MINUTES_LIMIT;
            return (
              <li key={p.id} className="grid grid-cols-[72px_minmax(0,1fr)_72px] items-center gap-3">
                <span className="font-semibold">{shortNav(p)}</span>
                <span className="relative block h-3 rounded-full bg-neutral-bg">
                  <span
                    className={`absolute inset-y-0 left-0 rounded-full ${over ? "bg-warn-solid" : "bg-band"}`}
                    style={{ width: `${Math.round((p.minutesThisMonth / maxMin) * 100)}%` }}
                  />
                  <span className="absolute inset-y-[-3px] w-0.5 bg-ink-3" style={{ left: `${Math.round((MINUTES_LIMIT / maxMin) * 100)}%` }} aria-hidden />
                </span>
                <span className={`text-right font-mono tabular ${over ? "font-semibold text-warn" : ""}`}>{p.minutesThisMonth} mnt</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-sm text-ink-3">Tidak ada ukuran kinerja per rujukan dokter: insentif semacam itu mendorong tes berlebihan.</p>
      </section>
    </div>
  );
}
