import { drugAccess } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { EVIDENCE_VERSION } from "@/lib/rules/sentinel";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-xs text-slate-500 print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:flex-row sm:justify-between">
        <p>
          <strong className="text-slate-700">Tidak ada data yang disimpan.</strong> Prototipe demo berbasis aturan
          (tanpa ML). Ambang batas adalah nilai demo, bukan batas klinis. Assay belum divalidasi klinis.
        </p>
        <p className="sm:text-right">
          Bukti: {EVIDENCE_VERSION}. Akses obat dicek {formatDate(drugAccess.checkedDate)}.
        </p>
      </div>
    </footer>
  );
}
