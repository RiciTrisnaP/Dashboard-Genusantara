import { ArrowRight, ChevronRight, Droplet, FlaskConical, Microscope } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { shortName, VerdictBadge } from "@/components/CaseHeader";
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

      {/* Patient table */}
      <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Semua pasien</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-3">
            Status SENTINEL:
            <StatusBadge tone="ok">Lanjut</StatusBadge>
            <StatusBadge tone="block">Tahan</StatusBadge>
            <StatusBadge tone="warn" icon={FlaskConical}>
              Belum dites
            </StatusBadge>
          </div>
        </div>
        {/* Phone: one card per patient. */}
        <ul className="mt-4 space-y-3 md:hidden">
          {cases.map((c) => {
            const p = c.patient;
            const flagged = c.trigger.status === "PERLU_TES";
            return (
              <li
                key={p.id}
                className={`relative rounded-2xl border p-4 ${flagged ? "border-warn-line bg-warn-bg/60" : "border-line bg-white"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/pasien/${p.id}/sentinel`} className="text-lg font-semibold after:absolute after:inset-0">
                      {shortName(p.displayName)}
                    </Link>
                    <p className="text-sm text-ink-3">
                      {p.age} tahun · {p.clinical.subtype} · {p.clinical.stage} ({p.clinical.setting})
                    </p>
                  </div>
                  <ChevronRight aria-hidden className="mt-1 size-5 shrink-0 text-primary" strokeWidth={2} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <VerdictBadge result={c} size="md" />
                  <span className="text-sm text-ink-3">{verdictDetail(c)}</span>
                </div>
                <p className="mt-2 text-sm text-ink-2">{p.clinical.priorTherapies?.join("; ")}</p>
                <p className="text-sm text-ink-2">{triggerText(c)}</p>
              </li>
            );
          })}
        </ul>

        {/* Tablet and up: table. `relative` keeps the row-link overlay inside the scroll area. */}
        <div className="relative mt-4 hidden overflow-x-auto rounded-2xl border border-line bg-white md:block">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-line bg-canvas text-xs tracking-[0.1em] text-ink-3 uppercase">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Pasien</th>
                <th className="px-4 py-3.5 font-semibold">Subtipe</th>
                <th className="px-4 py-3.5 font-semibold">Stadium</th>
                <th className="px-4 py-3.5 font-semibold">Terapi sebelumnya</th>
                <th className="px-4 py-3.5 font-semibold">Pemicu tes</th>
                <th className="px-4 py-3.5 font-semibold">Status SENTINEL</th>
                <th className="px-6 py-3.5">
                  <span className="sr-only">Buka</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {cases.map((c) => {
                const p = c.patient;
                const flagged = c.trigger.status === "PERLU_TES";
                return (
                  <tr key={p.id} className={`group relative ${flagged ? "bg-warn-bg/60" : ""} hover:bg-primary-soft/60`}>
                    <td className="px-6 py-4">
                      <Link href={`/pasien/${p.id}/sentinel`} className="text-lg font-semibold after:absolute after:inset-0">
                        {shortName(p.displayName)}
                      </Link>
                      <div className="text-sm text-ink-3">{p.age} tahun</div>
                    </td>
                    <td className="px-4 py-4 font-semibold">{p.clinical.subtype}</td>
                    <td className="px-4 py-4 text-ink-2">
                      {p.clinical.stage} ({p.clinical.setting})
                    </td>
                    <td className="px-4 py-4 text-ink-2">{p.clinical.priorTherapies?.join("; ")}</td>
                    <td className="px-4 py-4 text-ink-2">{triggerText(c)}</td>
                    <td className="px-4 py-4">
                      <VerdictBadge result={c} size="md" />
                      <div className="mt-1 text-sm text-ink-3">{verdictDetail(c)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:underline">
                        Buka
                        <ChevronRight aria-hidden className="size-4" strokeWidth={2} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

    </>
  );
}
