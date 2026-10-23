import { redirect } from "next/navigation";

export default async function PatientIndex({ params }: PageProps<"/pasien/[id]">) {
  const { id } = await params;
  redirect(`/pasien/${id}/sentinel`);
}
