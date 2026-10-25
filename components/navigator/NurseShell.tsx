"use client";

import { ClipboardList, HeartPulse, Stethoscope, TrendingUp, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { navigator } from "@/lib/navigator/data";
import { openUrgentCount } from "@/lib/navigator/rules";
import { useNavigator } from "./NavigatorProvider";

export type NurseTab = "tugas" | "pasien" | "check-in" | "kinerja";

const TABS: { id: NurseTab; href: string; label: string; icon: LucideIcon }[] = [
  { id: "tugas", href: "/perawat", label: "Tugas hari ini", icon: ClipboardList },
  { id: "pasien", href: "/perawat/pasien", label: "Pasien", icon: Users },
  { id: "check-in", href: "/perawat/check-in", label: "Check-in gejala", icon: HeartPulse },
  { id: "kinerja", href: "/perawat/kinerja", label: "Kinerja", icon: TrendingUp },
];

export function NurseShell({ active, children }: { active: NurseTab; children: React.ReactNode }) {
  const { state, isTaskDone } = useNavigator();
  const counts: Record<NurseTab, { n: number; urgent?: boolean } | null> = {
    tugas: { n: navigator.tasks.filter((t) => !isTaskDone(t)).length },
    pasien: { n: navigator.patients.filter((p) => p.journey !== "selesai").length },
    "check-in": { n: openUrgentCount(state.checkins), urgent: true },
    kinerja: null,
  };

  return (
    <>
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
                <Stethoscope aria-hidden className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-xl font-bold">Dashboard navigator</p>
                <p className="text-sm text-ink-3">Untuk perawat pendamping pasien · {navigator.nurse}</p>
              </div>
            </div>
            <Link href="/pasien" className="text-sm font-semibold text-primary hover:underline">
              Pindah ke tampilan dokter
            </Link>
          </div>
          <nav aria-label="Menu navigator" className="-mb-px mt-3 flex gap-1 overflow-x-auto overflow-y-hidden">
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
                    <span
                      className={`min-w-6 rounded-full px-2 py-0.5 text-center text-xs font-bold ${
                        c.urgent ? "bg-bad-solid text-white" : "bg-neutral-bg text-ink-2"
                      }`}
                    >
                      {c.n}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-10">{children}</div>
    </>
  );
}
