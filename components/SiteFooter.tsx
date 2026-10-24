import { Lock } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white text-sm print:hidden">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <p className="flex items-center gap-2 font-medium text-ink">
          <Lock aria-hidden className="size-4" strokeWidth={1.75} />
          Tidak ada data yang disimpan
        </p>
        <p className="text-ink-3">Genusa · prototipe hackathon · semua pasien adalah SIMULASI</p>
      </div>
    </footer>
  );
}
