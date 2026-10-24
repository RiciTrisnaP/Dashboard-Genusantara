"use client";

import { Check, RotateCcw } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import { navigator } from "@/lib/navigator/data";
import { formatDayLong } from "@/lib/navigator/format";
import { groupTasks, isOverdue, URGENCY_LABEL, URGENCY_ORDER } from "@/lib/navigator/rules";
import type { Task, Urgency } from "@/lib/navigator/types";
import { navBtn, navBtnNavy, shortNav } from "./bits";
import { useNavigator } from "./NavigatorProvider";

const HEAD: Record<Urgency, string> = { mendesak: "text-bad", hari_ini: "text-ink", rutin: "text-ink-3" };

function taskHref(t: Task): string {
  return t.action.kind === "checkin" ? `/perawat/check-in#${t.action.checkinId}` : `/perawat/pasien/${t.patientId}#${t.action.tab}`;
}

export function TasksView() {
  const { isTaskDone, toggleTask, patient } = useNavigator();
  const tasks = navigator.tasks;
  const doneCount = tasks.filter(isTaskDone).length;
  const groups = groupTasks(tasks);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">{formatDayLong(navigator.today)}</p>
          <h1 className="mt-0.5 text-3xl font-bold">Tugas hari ini</h1>
        </div>
        <div className="w-full max-w-xs">
          <p className="mb-1.5 text-sm text-ink-3">
            {doneCount} dari {tasks.length} tugas selesai
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-bg">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round((doneCount / tasks.length) * 100)}%` }} />
          </div>
        </div>
      </div>

      {URGENCY_ORDER.map((u) => {
        const list = groups[u];
        if (list.length === 0) return null;
        const left = list.filter((t) => !isTaskDone(t)).length;
        return (
          <section key={u}>
            <h2 className={`mb-2 text-sm font-bold tracking-[0.08em] uppercase ${HEAD[u]}`}>
              {URGENCY_LABEL[u]} · {left} tersisa
            </h2>
            <ul className={`divide-y divide-line overflow-hidden rounded-2xl border bg-white ${u === "mendesak" && left > 0 ? "border-bad-line border-2" : "border-line"}`}>
              {list.map((t) => {
                const done = isTaskDone(t);
                const p = patient(t.patientId);
                const late = isOverdue(t, navigator.today, done);
                return (
                  <li key={t.id} className={`flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 ${done ? "opacity-55" : ""}`}>
                    <div className="min-w-0 flex-[1_1_360px]">
                      <p className={`flex flex-wrap items-center gap-2 text-lg font-bold ${done ? "line-through" : ""}`}>
                        {t.title}
                        {late && <StatusBadge tone="warn">Terlambat</StatusBadge>}
                      </p>
                      <p className="text-sm text-ink-3">
                        {p ? shortNav(p) : t.patientId} · {t.detail}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={taskHref(t)} className={navBtnNavy}>
                        {t.action.kind === "checkin" ? "Lihat check-in" : "Buka pasien"}
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleTask(t.id)}
                        className={`${navBtn} border bg-white ${done ? "border-line text-ink-3" : "border-ok-solid text-ok hover:bg-ok-bg"}`}
                      >
                        {done ? <RotateCcw aria-hidden className="size-4" /> : <Check aria-hidden className="size-4" />}
                        {done ? "Batalkan" : "Selesai"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <p className="text-sm text-ink-3">Tugas mendesak selesai otomatis saat check-in dieskalasikan ke dokter jaga.</p>
    </div>
  );
}
