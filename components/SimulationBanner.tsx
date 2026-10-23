export function SimulationBanner() {
  return (
    <div
      role="note"
      className="sticky top-0 z-50 border-b-2 border-amber-500 bg-amber-300 text-amber-950 print:static print:border-b print:bg-amber-200"
    >
      <p className="mx-auto max-w-6xl px-4 py-1.5 text-center text-sm font-bold tracking-wide print:py-0.5 print:text-[8pt]">
        SIMULASI, bukan untuk keputusan klinis
        <span className="font-normal"> · Semua pasien dan hasil tes adalah data simulasi.</span>
      </p>
    </div>
  );
}
