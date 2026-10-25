import type { Metadata } from "next";
import { IntakeView } from "@/components/lab/IntakeView";
import { LabShell } from "@/components/lab/LabShell";

export const metadata: Metadata = { title: "Sampel masuk · Lab" };

export default function LabIntakePage() {
  return (
    <LabShell active="masuk">
      <IntakeView />
    </LabShell>
  );
}
