"use client";

import { useSignOff } from "./SignOffProvider";

export function ReportStatus({ patientId }: { patientId: string }) {
  const { signed } = useSignOff(patientId);
  return signed ? (
    <span className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1 text-sm font-bold text-white print:px-2 print:py-0.5">
      Terbit
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md bg-amber-100 px-3 py-1 text-sm font-bold text-amber-950 ring-1 ring-amber-400 ring-inset print:px-2 print:py-0.5">
      DRAF, menunggu tanda tangan dokter
    </span>
  );
}

export function SignOffButton({ patientId }: { patientId: string }) {
  const { signed, setSigned } = useSignOff(patientId);
  return signed ? (
    <button
      type="button"
      onClick={() => setSigned(false)}
      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      Batalkan tanda tangan (demo)
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setSigned(true)}
      className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
    >
      Tandatangani sebagai dokter (simulasi)
    </button>
  );
}

export function SignatureLine({ patientId }: { patientId: string }) {
  const { signed } = useSignOff(patientId);
  return (
    <p className="text-slate-600">
      {signed
        ? "Ditandatangani dokter penanggung jawab (simulasi). Status: Terbit."
        : "Tanda tangan dokter: ____________________  (laporan belum terbit)"}
    </p>
  );
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      Cetak / simpan PDF (A4)
    </button>
  );
}
