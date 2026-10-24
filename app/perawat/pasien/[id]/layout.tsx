import { navigator } from "@/lib/navigator/data";

export function generateStaticParams() {
  return navigator.patients.map((p) => ({ id: p.id }));
}

export default function NursePatientLayout({ children }: LayoutProps<"/perawat/pasien/[id]">) {
  return children;
}
