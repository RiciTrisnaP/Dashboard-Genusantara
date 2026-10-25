import type { Metadata } from "next";
import { RunView } from "@/components/lab/RunView";
import { LabShell } from "@/components/lab/LabShell";

export const metadata: Metadata = { title: "Antrian run · Lab" };

export default function LabRunPage() {
  return (
    <LabShell active="run">
      <RunView />
    </LabShell>
  );
}
