import { ArrowLeft, FileText, FlaskConical, ListChecks, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { CaseResult } from "@/lib/rules";
import { describeSpecimen, type Tone } from "@/lib/rules/sentinel";
import { StatusBadge, statusText } from "./ui";

export type CaseTab = "sentinel" | "reflex" | "laporan" | "ringkasan";

const TABS: { id: CaseTab; label: string; icon: LucideIcon }[] = [
  { id: "sentinel", label: "SENTINEL", icon: ShieldCheck },
  { id: "reflex", label: "REFLEX", icon: ListChecks },
  { id: "laporan", label: "Laporan Pilih Terapi", icon: FileText },
  { id: "ringkasan", label: "Ringkasan Pasien", icon: Users },
];

export function verdictTone(c: CaseResult): Tone {
  if (!c.sentinel.tested) return "warn";
  return c.sentinel.verdict === "LANJUT" ? "ok" : "block";
}

export function VerdictBadge({ result, prefix = false, size }: { result: CaseResult; prefix?: boolean; size?: "sm" | "md" }) {
  if (!result.sentinel.tested) {
    return (
      <StatusBadge tone="warn" icon={FlaskConical} size={size}>
        Belum dites
      </StatusBadge>
    );
  }
  return (
    <StatusBadge tone={verdictTone(result)} size={size}>
      {prefix ? "SENTINEL: " : ""}
      {statusText(result.sentinel.verdict)}
    </StatusBadge>
  );
}

export function shortName(displayName: string): string {
  return displayName.replace(/\s*\(simulasi\)\s*$/, "");
}

export function CaseHeader({ result, active }: { result: CaseResult; active: CaseTab }) {
  const { patient } = result;
  const c = patient.clinical;
  const test = patient.molecularTest;
  const facts: [string, string][] = [
    ["Usia", `${patient.age} tahun`],
    ["Subtipe", c.subtype ?? "-"],
    ["Stadium", `${c.stage ?? "-"} (${c.setting ?? "-"})`],
    ["Terapi sebelumnya", c.priorTherapies?.join("; ") || "tidak ada"],
    ["Spesimen", test.done ? describeSpecimen(test.specimen) : "Belum ada spesimen untuk tes molekuler"],
  ];

  return (
    <div className="bg-band text-white print:hidden">
      <div className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-10">
        <Link href="/pasien" className="inline-flex items-center gap-1.5 text-sm text-on-band-2 hover:text-white">
          <ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} />
          Daftar Pasien
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight sm:text-[40px]">{shortName(patient.displayName)}</h1>
            <VerdictBadge result={result} prefix size="md" />
          </div>
          <p className="font-mono text-sm text-on-band-2">
            Pasien simulasi · SIM-{patient.id}
            {test.done && test.sampleCode && <> · Sampel {test.sampleCode}</>}
          </p>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-10">
          {facts.map(([label, value], i) => (
            <div key={label} className={i >= 3 ? "col-span-2" : ""}>
              <dt className="text-xs font-semibold tracking-[0.1em] text-on-band-2 uppercase">{label}</dt>
              <dd className="mt-0.5 text-base font-semibold sm:text-lg">{value}</dd>
            </div>
          ))}
        </dl>
        <nav aria-label="Modul" className="mt-5 -mb-px flex gap-1 overflow-x-auto overflow-y-hidden">
          {TABS.map((t) => {
            const isActive = t.id === active;
            const Icon = t.icon;
            return (
              <Link
                key={t.id}
                href={`/pasien/${patient.id}/${t.id}`}
                aria-current={isActive ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 border-b-[3px] px-3 py-3 text-sm font-semibold whitespace-nowrap transition-colors sm:text-base ${
                  isActive ? "border-accent text-white" : "border-transparent text-on-band-2 hover:text-white"
                }`}
              >
                <Icon aria-hidden className="size-4" strokeWidth={isActive ? 2 : 1.75} />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/** Page body container below the header. */
export function CaseBody({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-10 print:max-w-none print:p-0">{children}</div>;
}
