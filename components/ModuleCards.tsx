import { ArrowRight, ChevronRight, FileText, FlaskConical, ListChecks, ShieldCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";

// The four rule modules, in the card style of the Pencil "alur demo" cards.
export const MODULES: { name: string; text: string; icon: LucideIcon; tile: string; example: { label: string; href: string } }[] = [
  {
    name: "Pemicu tes",
    text: "Menandai pasien HR+/HER2- stadium lanjut yang memburuk setelah terapi endokrin dan belum dites.",
    icon: FlaskConical,
    tile: "bg-primary-soft text-primary-strong",
    example: { label: "Ibu E · belum dites", href: "/pasien/E/laporan" },
  },
  {
    name: "SENTINEL",
    text: "Gerbang mutu S1 sampai S5. Sampel yang tidak terbaca tidak pernah dibaca sebagai \"tidak ada mutasi\".",
    icon: ShieldCheck,
    tile: "bg-sky-soft text-sky",
    example: { label: "Ibu F · TAHAN", href: "/pasien/F/sentinel" },
  },
  {
    name: "REFLEX",
    text: "Saran tes lanjutan bila hasil belum cukup. Selalu butuh persetujuan dokter.",
    icon: ListChecks,
    tile: "bg-violet-soft text-violet",
    example: { label: "Ibu D · 3 saran", href: "/pasien/D/reflex" },
  },
  {
    name: "TRIASE",
    text: "Laporan Pilih Terapi berbasis aturan, diurutkan menurut akses di Indonesia: BPOM, JKN, harga.",
    icon: FileText,
    tile: "bg-primary-soft text-primary-strong",
    example: { label: "Ibu A · Laporan", href: "/pasien/A/laporan" },
  },
];

export function ModuleCards() {
  return (
    <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
      {MODULES.map((m, i) => {
        const Icon = m.icon;
        return (
          <li key={m.name} className="relative">
            <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center justify-between">
                <span className={`flex size-11 items-center justify-center rounded-xl ${m.tile}`}>
                  <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <span className="font-mono text-sm text-ink-3">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                {i + 1}. {m.name}
              </h3>
              <p className="mt-1 flex-1 text-ink-2">{m.text}</p>
              <Link
                href={m.example.href}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Contoh: {m.example.label}
                <ArrowRight aria-hidden className="size-3.5" strokeWidth={2} />
              </Link>
            </div>
            {i < MODULES.length - 1 && (
              <ChevronRight
                aria-hidden
                className="absolute top-1/2 -right-7 hidden size-6 -translate-y-1/2 text-ink-3 lg:block"
                strokeWidth={1.5}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
