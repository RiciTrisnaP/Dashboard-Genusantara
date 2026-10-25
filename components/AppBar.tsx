import { Dna, FlaskConical, HeartHandshake, Stethoscope } from "lucide-react";
import Link from "next/link";

export function AppBar() {
  return (
    <header className="bg-band-deep text-white print:hidden">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3.5 sm:px-10">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-ink">
            <Dna aria-hidden className="size-5" strokeWidth={2} />
          </span>
          <span className="text-xl font-bold tracking-tight">Genusa</span>
          <span className="hidden border-l border-white/25 pl-3 text-sm text-on-band-2 italic md:inline">
            tepat obatnya, tuntas terapinya
          </span>
        </Link>
        <nav aria-label="Pilih peran" className="flex items-center gap-1 rounded-full bg-white/10 p-1 text-sm">
          <Link href="/pasien" className="flex min-h-9 items-center gap-2 rounded-full px-3 font-medium hover:bg-white/15">
            <Stethoscope aria-hidden className="hidden size-4 sm:block" strokeWidth={1.75} />
            Dokter
          </Link>
          <Link href="/perawat" className="flex min-h-9 items-center gap-2 rounded-full px-3 font-medium hover:bg-white/15">
            <HeartHandshake aria-hidden className="hidden size-4 sm:block" strokeWidth={1.75} />
            Perawat
          </Link>
          <Link href="/lab" className="flex min-h-9 items-center gap-2 rounded-full px-3 font-medium hover:bg-white/15">
            <FlaskConical aria-hidden className="hidden size-4 sm:block" strokeWidth={1.75} />
            Lab
          </Link>
        </nav>
      </div>
    </header>
  );
}
