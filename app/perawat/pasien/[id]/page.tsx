import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NurseShell } from "@/components/navigator/NurseShell";
import { PatientDetail } from "@/components/navigator/PatientDetail";
import { getNavPatient } from "@/lib/navigator/data";

export async function generateMetadata({ params }: PageProps<"/perawat/pasien/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `${getNavPatient(id)?.displayName ?? "Pasien"} · Navigator` };
}

export default async function NursePatientPage({ params }: PageProps<"/perawat/pasien/[id]">) {
  const { id } = await params;
  if (!getNavPatient(id)) notFound();
  return (
    <NurseShell active="pasien">
      <PatientDetail id={id} />
    </NurseShell>
  );
}
