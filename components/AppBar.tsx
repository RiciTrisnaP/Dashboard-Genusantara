import { Dna, Stethoscope, Users } from "lucide-react";
import Link from "next/link";

export function AppBar() {
  return (
    <header className="bg-band-deep text-white print:hidden">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3.5 sm:px-10">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-ink">
            <Dna aria-hidden className="size-5" strokeWidth={2} />
          </span>
          <span className="text-xl font-bold tracking-tight">OnkoTepat</span>
          <span className="hidden border-l border-white/25 pl-3 text-sm text-on-band-2 italic md:inline">
            tepat obatnya, tuntas terapinya
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="flex items-center gap-2 font-medium hover:text-on-band-2">
            <Users aria-hidden className="size-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">Daftar Pasien</span>
          </Link>
          <span className="hidden items-center gap-2 rounded-full bg-white/10 py-1 pr-3.5 pl-1 lg:flex">
            <span className="flex size-7 items-center justify-center rounded-full bg-white text-band">
              <Stethoscope aria-hidden className="size-4" strokeWidth={2} />
            </span>
            dr. Demo, Sp.PD-KHOM (simulasi)
          </span>
        </nav>
      </div>
    </header>
  );
}
