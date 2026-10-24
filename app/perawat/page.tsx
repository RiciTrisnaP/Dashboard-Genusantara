import type { Metadata } from "next";
import { NurseShell } from "@/components/navigator/NurseShell";
import { TasksView } from "@/components/navigator/TasksView";

export const metadata: Metadata = { title: "Tugas hari ini · Navigator" };

export default function NurseTasksPage() {
  return (
    <NurseShell active="tugas">
      <TasksView />
    </NurseShell>
  );
}
