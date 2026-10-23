import { patients } from "@/lib/data";

export function generateStaticParams() {
  return patients.map((p) => ({ id: p.id }));
}

export default function PatientLayout({ children }: LayoutProps<"/pasien/[id]">) {
  return children;
}
