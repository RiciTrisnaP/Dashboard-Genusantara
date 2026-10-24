import { ArrowRight, Droplet, FlaskConical, Microscope } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { shortName } from "@/components/CaseHeader";
import { DoctorPatientList, type DoctorRow } from "@/components/DoctorPatientList";
import { ApprovalBadge, btnOnPink, StatusBadge } from "@/components/ui";
import { panel, patients } from "@/lib/data";
import { runCase, type CaseResult } from "@/lib/rules";

export const metadata: Metadata = { title: "Daftar Pasien" };

function triggerText(c: CaseResult): string {
  const p = c.patient.clinical;
  if (c.trigger.status === "PERLU_TES") return "Memburuk setelah terapi endokrin; belum dites";
  if (c.trigger.status === "SUDAH_DITES") {
    return p.progressedOnEndocrine ? "Sudah dites; progresi setelah terapi endokrin" : "Sudah dites";
  }
  return c.trigger.label;
}

function verdictDetail(c: CaseResult): string {
  if (!c.sentinel.tested) return "Perlu tes molekuler";
  return `${c.sentinel.s3.readableCount} dari ${c.sentinel.s3.totalTargets} target terbaca`;
}

export default function WorklistPage() {
  const cases = patients.map(runCase);
  const needTest = cases.filter((c) => c.trigger.status === "PERLU_TES");
  const spotlight = needTest[0];
  const rows: DoctorRow[] = cases.map((c) => ({
    id: c.patient.id,
    name: shortName(c.patient.displayName),
    age: c.patient.age,
    subtype: c.patient.clinical.subtype ?? "-",
    stage: `${c.patient.clinical.stage} (${c.patient.clinical.setting})`,
    prior: c.patient.clinical.priorTherapies?.join("; ") || "tidak ada terapi sebelumnya",
    triggerText: triggerText(c),
    needsTest: c.trigger.status === "PERLU_TES",
    verdict: c.sentinel.tested ? c.sentinel.verdict : null,
    verdictDetail: verdictDetail(c),
  }));

  return (
    <>
      {/* Title band + spotlight card */}
      <section className="bg-band text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-10 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Daftar Pasien</h1>
            <p className="mt-1 text-lg text-on-band-2">
              {patients.length} pasien simulasi · panel {panel.shortName} ({panel.targets.length} hotspot)
            </p>
            <p className="mt-3 max-w-md text-on-band-2">
              Daftar kerja untuk rapat tim tumor. Pemicu tes menandai pasien yang sudah waktunya dites.
            </p>
          </div>
          {spotlight && (
            <div className="rounded-3xl bg-gradient-to-br from-primary to-primary-deep p-6 shadow-xl ring-1 ring-white/10 lg:max-w-[780px] lg:flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge tone="warn" icon={FlaskConical} size="md">
                  Pemicu tes
                </StatusBadge>
                <ApprovalBadge size="md" />
              </div>
              <h3 className="mt-4 text-3xl font-bold">
                {needTest.length} pasien perlu tes molekuler
              </h3>
              <p className="mt-1 text-lg text-white/90">
                {shortName(spotlight.patient.displayName)} · {spotlight.patient.clinical.subtype}{" "}
                {spotlight.patient.clinical.setting} · memburuk setelah terapi endokrin · belum dites
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <div className="flex-1 rounded-lg border border-white/30 bg-white/10 px-4 py-3">
                  <p className="flex items-center gap-2 font-semibold">
                    <Microscope aria-hidden className="size-4 text-white" strokeWidth={1.75} />
                    Jaringan FFPE
                  </p>
                  <p className="mt-0.5 text-sm text-white/90">
                    untuk panel {panel.shortName}: <span className="font-mono">{[...new Set(panel.targets.map((t) => t.gene))].join(", ")}</span>
                  </p>
                </div>
                <div className="flex-1 rounded-lg border border-white/30 bg-white/10 px-4 py-3">
                  <p className="flex items-center gap-2 font-semibold">
                    <Droplet aria-hidden className="size-4 text-white" strokeWidth={1.75} />
                    Plasma ctDNA
                  </p>
                  <p className="mt-0.5 text-sm text-white/90">
                    tes <span className="font-mono">ESR1</span> terpisah (di luar {panel.shortName})
                  </p>
                </div>
                <Link
                  href={`/pasien/${spotlight.patient.id}/laporan`}
                  className={`${btnOnPink} sm:self-center`}
                >
                  <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
                  Buka {shortName(spotlight.patient.displayName)}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Patient list: same card style as the navigator's patient list */}
      <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-10">
        <DoctorPatientList rows={rows} />
      </section>
    </>
  );
}
