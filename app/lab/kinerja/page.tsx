import type { Metadata } from "next";
import { LabPerformanceView } from "@/components/lab/LabPerformanceView";
import { LabShell } from "@/components/lab/LabShell";

export const metadata: Metadata = { title: "Kinerja lab · Lab" };

export default function LabPerformancePage() {
  return (
    <LabShell active="kinerja">
      <LabPerformanceView />
    </LabShell>
  );
}
