import type { Metadata } from "next";
import { SentinelView } from "@/components/lab/SentinelView";
import { LabShell } from "@/components/lab/LabShell";

export const metadata: Metadata = { title: "Gerbang mutu SENTINEL · Lab" };

export default function LabSentinelPage() {
  return (
    <LabShell active="sentinel">
      <SentinelView />
    </LabShell>
  );
}
