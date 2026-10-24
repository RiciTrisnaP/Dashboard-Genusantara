"use client";

import { ArrowRight, CircleCheck, PencilLine, Printer, Users } from "lucide-react";
import Link from "next/link";
import { useSignOff } from "./SignOffProvider";
import { btnPrimary, btnSecondary, StatusBadge } from "./ui";

export const SIGNER = "dr. Demo, Sp.PD-KHOM (simulasi)";

/** Next stop in the 90-second demo after signing a report. */
const DEMO_NEXT: Record<string, { href: string; label: string }> = {
  A: { href: "/pasien/F/sentinel", label: "Lanjut ke Ibu F · SENTINEL" },
};

export function ReportStatusBadge({ patientId }: { patientId: string }) {
  const { signed, signedAt } = useSignOff(patientId);
  return signed ? (
    <StatusBadge tone="ok" size="md">
      Terbit · {signedAt}
    </StatusBadge>
  ) : (
    <StatusBadge tone="warn" icon={PencilLine} size="md">
      DRAF, menunggu tanda tangan dokter
    </StatusBadge>
  );
}

export function ReportEyebrow({ patientId }: { patientId: string }) {
  const { signed } = useSignOff(patientId);
  return <>{signed ? "Laporan Pilih Terapi · terbit, versi 1" : "Laporan Pilih Terapi · draf berbasis aturan"}</>;
}

export function ReportStatusPanel({ patientId }: { patientId: string }) {
  const { signed, signedAt, sign, unsign } = useSignOff(patientId);
  const next = DEMO_NEXT[patientId] ?? { href: "/", label: "Kembali ke Daftar Pasien" };

  if (!signed) {
    return (
      <div className="rounded-2xl border-2 border-warn-line bg-white p-6">
        <p className="text-xs font-semibold tracking-[0.1em] text-ink-2 uppercase">Status laporan</p>
        <div className="mt-3 flex items-start gap-3">
          <span className="flex size-11 items-center justify-center rounded-lg bg-warn-bg text-warn">
            <PencilLine aria-hidden className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-2xl font-bold text-warn">DRAF</p>
            <p className="text-ink-2">Menunggu tanda tangan dokter</p>
          </div>
        </div>
        <button type="button" onClick={sign} className={`${btnPrimary} mt-5 w-full`}>
          <PencilLine aria-hidden className="size-4" strokeWidth={2} />
          Tandatangani sebagai dokter (simulasi)
        </button>
        <button type="button" onClick={() => window.print()} className={`${btnSecondary} mt-3 w-full`}>
          <Printer aria-hidden className="size-4" strokeWidth={2} />
          Cetak / simpan PDF
        </button>
        <p className="mt-4 text-sm text-ink-3">
          Tanda tangan di prototipe ini adalah simulasi. Setelah ditandatangani, status berubah menjadi Terbit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl bg-ok-solid px-5 py-4 text-white">
        <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0" strokeWidth={2} />
        <div>
          <p className="font-semibold">Laporan terbit</p>
          <p className="text-sm text-white/90">Tanda tangan simulasi tercatat. Siap dicetak.</p>
        </div>
      </div>
      <div className="rounded-2xl border-2 border-ok-line bg-white p-6">
        <p className="text-xs font-semibold tracking-[0.1em] text-ink-2 uppercase">Status laporan</p>
        <div className="mt-3 flex items-start gap-3">
          <span className="flex size-11 items-center justify-center rounded-lg bg-ok-bg text-ok">
            <CircleCheck aria-hidden className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-2xl font-bold text-ok">TERBIT</p>
            <p className="text-ink-2">
              Ditandatangani dr. Demo (simulasi) · {signedAt}
            </p>
          </div>
        </div>
        <button type="button" onClick={() => window.print()} className={`${btnPrimary} mt-5 w-full`}>
          <Printer aria-hidden className="size-4" strokeWidth={2} />
          Cetak / simpan PDF
        </button>
        <Link href={next.href} className={`${btnSecondary} mt-3 w-full`}>
          {next.href === "/" ? (
            <Users aria-hidden className="size-4" strokeWidth={2} />
          ) : (
            <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
          )}
          {next.label}
        </Link>
        <p className="mt-4 text-sm text-ink-3">
          Status hanya tersimpan selama sesi demo ini.{" "}
          <button type="button" onClick={unsign} className="underline hover:text-ink">
            Batalkan tanda tangan (demo)
          </button>
        </p>
      </div>
    </div>
  );
}

export function SignatureBlock({ patientId, reportId }: { patientId: string; reportId: string }) {
  const { signed, signedAt } = useSignOff(patientId);
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <p className="text-xs font-semibold tracking-[0.1em] text-ink-3 uppercase print:text-[6.5pt]">Tanda tangan dokter</p>
        {signed ? (
          <p className="mt-0.5 text-lg font-semibold print:text-[9pt]">
            {SIGNER} · {signedAt}
          </p>
        ) : (
          <p className="mt-0.5 text-lg text-ink-2 italic print:text-[9pt]">Belum ditandatangani</p>
        )}
      </div>
      <p className="font-mono text-sm text-ink-3 print:text-[7pt]">
        {reportId} · {signed ? `v1 · terbit ${signedAt}` : "draf"}
      </p>
    </div>
  );
}

export function PrintStatusBadge({ patientId }: { patientId: string }) {
  const { signed } = useSignOff(patientId);
  return signed ? (
    <StatusBadge tone="ok">Terbit · v1</StatusBadge>
  ) : (
    <StatusBadge tone="warn" icon={PencilLine}>
      Draf
    </StatusBadge>
  );
}

export function PrintButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={`${btnSecondary} ${className}`}>
      <Printer aria-hidden className="size-4" strokeWidth={2} />
      Cetak / simpan PDF
    </button>
  );
}
