"use client";

import { BarChart3, FlaskConical, Inbox, ListOrdered, PenLine, ShieldCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { panel } from "@/lib/data";
import { lab } from "@/lib/lab/data";
import { overallStatus } from "@/lib/lab/rules";
import { useLab } from "./LabProvider";

export type LabTab = "masuk" | "run" | "sentinel" | "patolog" | "kinerja";

const TABS: { id: LabTab; href: string; label: string; icon: LucideIcon }[] = [
  { id: "masuk", href: "/lab", label: "Sampel masuk", icon: Inbox },
  { id: "run", href: "/lab/run", label: "Antrian run", icon: ListOrdered },
  { id: "sentinel", href: "/lab/sentinel", label: "Gerbang mutu SENTINEL", icon: ShieldCheck },
  { id: "patolog", href: "/lab/patolog", label: "Tinjauan patolog", icon: PenLine },
  { id: "kinerja", href: "/lab/kinerja", label: "Kinerja lab", icon: BarChart3 },
];

export function LabShell({ active, children }: { active: LabTab; children: React.ReactNode }) {
  const { byStage, toast } = useLab();
  const sentinel = byStage("sentinel");
  const counts: Record<LabTab, { n: number; urgent?: boolean } | null> = {
    masuk: { n: byStage("masuk").length },
    run: { n: byStage("antri", "run_b", "run").length },
    sentinel: { n: sentinel.length, urgent: sentinel.some((s) => overallStatus(s, panel, lab.thresholds) === "bad") },
    patolog: { n: byStage("patolog").length },
    kinerja: null,
  };

  return (
    <>
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
                <FlaskConical aria-hidden className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-xl font-bold">Dashboard lab</p>
                <p className="text-sm text-ink-3">
                  {lab.lab} · {lab.analyst}
                </p>
              </div>
            </div>
            <Link href="/pasien" className="text-sm font-semibold text-primary hover:underline">
              Pindah ke tampilan dokter
            </Link>
          </div>
          <nav aria-label="Menu lab" className="-mb-px mt-3 flex gap-1 overflow-x-auto overflow-y-hidden">
            {TABS.map((t) => {
              const on = t.id === active;
              const c = counts[t.id];
              const Icon = t.icon;
              return (
                <Link
                  key={t.id}
                  href={t.href}
                  aria-current={on ? "page" : undefined}
                  className={`flex min-h-12 shrink-0 items-center gap-2 border-b-[3px] px-3 text-sm font-semibold whitespace-nowrap sm:px-4 sm:text-base ${
                    on ? "border-primary text-ink" : "border-transparent text-ink-3 hover:text-ink"
                  }`}
                >
                  <Icon aria-hidden className="size-4" strokeWidth={on ? 2 : 1.75} />
                  {t.label}
                  {c && c.n > 0 && (
                    <span className={`min-w-6 rounded-full px-2 py-0.5 text-center text-xs font-bold ${c.urgent ? "bg-bad-solid text-white" : "bg-neutral-bg text-ink-2"}`}>
                      {c.n}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-10">
        {children}
        <p className="mt-10 border-t border-line pt-4 text-center text-sm text-ink-3">
          Lab melihat kode sampel, bukan nama pasien. Hasil dirilis ke dokter peminta; lab tidak menyampaikan hasil ke pasien dan tidak memberi saran terapi.
        </p>
      </div>
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <div key={toast.id} className="pointer-events-auto max-w-xl rounded-xl bg-band px-5 py-3 text-sm text-white shadow-lg">
            <p>{toast.text}</p>
            {toast.link && (
              <Link href={toast.link.href} className="mt-1 inline-block font-semibold text-accent-light underline underline-offset-2">
                {toast.link.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
