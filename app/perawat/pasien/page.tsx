import type { Metadata } from "next";
import { NurseShell } from "@/components/navigator/NurseShell";
import { PatientsView } from "@/components/navigator/PatientsView";

export const metadata: Metadata = { title: "Pasien · Navigator" };

export default function NursePatientsPage() {
  return (
    <NurseShell active="pasien">
      <PatientsView />
    </NurseShell>
  );
}
