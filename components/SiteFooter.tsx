import { Lock, TriangleAlert } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white text-sm print:hidden">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-5">
          <p className="flex items-center gap-2 font-semibold text-warn">
            <TriangleAlert aria-hidden className="size-4" strokeWidth={1.75} />
            SIMULASI, bukan untuk keputusan klinis
          </p>
          <p className="flex items-center gap-2 font-medium text-ink">
            <Lock aria-hidden className="size-4" strokeWidth={1.75} />
            Tidak ada data yang disimpan
          </p>
        </div>
        <p className="text-ink-3">Genusa · prototipe hackathon · semua pasien dan angka adalah simulasi</p>
      </div>
    </footer>
  );
}
