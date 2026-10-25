import type { Metadata } from "next";
import { PathologistView } from "@/components/lab/PathologistView";
import { LabShell } from "@/components/lab/LabShell";

export const metadata: Metadata = { title: "Tinjauan patolog · Lab" };

export default function LabPathologistPage() {
  return (
    <LabShell active="patolog">
      <PathologistView />
    </LabShell>
  );
}
