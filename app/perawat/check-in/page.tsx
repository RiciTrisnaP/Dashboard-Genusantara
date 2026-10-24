import type { Metadata } from "next";
import { CheckinView } from "@/components/navigator/CheckinView";
import { NurseShell } from "@/components/navigator/NurseShell";

export const metadata: Metadata = { title: "Check-in gejala · Navigator" };

export default function NurseCheckinPage() {
  return (
    <NurseShell active="check-in">
      <CheckinView />
    </NurseShell>
  );
}
