import type { Metadata } from "next";
import { NurseShell } from "@/components/navigator/NurseShell";
import { PerformanceView } from "@/components/navigator/PerformanceView";

export const metadata: Metadata = { title: "Kinerja · Navigator" };

export default function NursePerformancePage() {
  return (
    <NurseShell active="kinerja">
      <PerformanceView />
    </NurseShell>
  );
}
