import { ArrowDown, ArrowRight, ChevronRight, Droplet, FileText, FlaskConical, ListChecks, Microscope, ShieldCheck, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { shortName, VerdictBadge } from "@/components/CaseHeader";
import { ApprovalBadge, btnPrimary, btnSecondary, StatusBadge } from "@/components/ui";
import { panel, patients } from "@/lib/data";
import { runCase, type CaseResult } from "@/lib/rules";

const MODULES: { name: string; text: string; icon: LucideIcon; tile: string; example: { label: string; href: string } }[] = [
  {
    name: "Pemicu tes",
    text: "Menandai pasien HR+/HER2- stadium lanjut yang memburuk setelah terapi endokrin dan belum dites.",
    icon: FlaskConical,
    tile: "bg-warn-bg text-warn",
    example: { label: "Ibu E · belum dites", href: "/pasien/E/laporan" },
  },
  {
    name: "SENTINEL",
    text: "Gerbang mutu S1 sampai S5. Sampel yang tidak terbaca tidak pernah dibaca sebagai \"tidak ada mutasi\".",
    icon: ShieldCheck,
    tile: "bg-primary-soft text-primary-strong",
    example: { label: "Ibu F · TAHAN", href: "/pasien/F/sentinel" },
  },
  {
    name: "REFLEX",
    text: "Saran tes lanjutan bila hasil belum cukup. Selalu butuh persetujuan dokter.",
    icon: ListChecks,
    tile: "bg-warn-bg text-warn",
    example: { label: "Ibu D · 3 saran", href: "/pasien/D/reflex" },
  },
  {
    name: "TRIASE",
    text: "Laporan Pilih Terapi berbasis aturan, diurutkan menurut akses di Indonesia: BPOM, JKN, harga.",
    icon: FileText,
    tile: "bg-primary-soft text-primary-strong",
    example: { label: "Ibu A · Laporan", href: "/pasien/A/laporan" },
  },
];

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
      {/* Hero */}
      <section className="relative overflow-hidden bg-band-deep text-white">
        <Image
          src="/hero-dokter.jpg"
          alt="Ilustrasi dokter onkologi (gambar buatan AI)"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[75%_20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-band-deep from-25% via-band-deep/60 via-55% to-transparent max-lg:via-band-deep/80" />
        <div className="relative mx-auto max-w-[1440px] px-4 pt-12 pb-12 sm:px-10 lg:pb-32">
          <p className="text-sm font-semibold tracking-[0.12em] text-accent uppercase">
            Alat bantu dokter onkologi · kanker payudara
          </p>
          <h1 className="mt-3 max-w-xl text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
            Tepat obatnya,
            <br />
            tuntas terapinya.
          </h1>
          <p className="mt-4 max-w-lg text-lg text-white/90">
            Pilih terapi dari hasil tes mutasi tumor, dengan gerbang mutu sebelum hasil dibaca.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#pasien" className={btnPrimary}>
              <ArrowDown aria-hidden className="size-4" strokeWidth={2} />
              Lihat daftar pasien
            </a>
            <a href="#cara-kerja" className={btnSecondary}>
              <ShieldCheck aria-hidden className="size-4" strokeWidth={2} />
              Cara kerja SENTINEL
            </a>
          </div>
        </div>
      </section>

      {/* Title band + spotlight card overlapping the hero */}
      <section className="bg-band text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 pb-6 sm:px-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="pt-6 lg:pt-8">
            <h2 className="text-2xl font-bold">Daftar Pasien</h2>
            <p className="mt-1 text-on-band-2">
              {patients.length} pasien simulasi · panel {panel.targets.length} target hotspot
            </p>
          </div>
          {spotlight && (
            <div className="relative z-10 rounded-3xl bg-gradient-to-br from-primary to-primary-strong p-6 shadow-xl ring-1 ring-white/10 lg:-mt-24 lg:max-w-[780px] lg:flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge tone="warn" icon={FlaskConical} size="md">
                  Pemicu tes
                </StatusBadge>
                <ApprovalBadge size="md" />
              </div>
              <h3 className="mt-4 text-3xl font-bold">
                {needTest.length} pasien perlu tes molekuler
              </h3>
              <p className="mt-1 text-lg text-on-band-2">
                {shortName(spotlight.patient.displayName)} · {spotlight.patient.clinical.subtype}{" "}
                {spotlight.patient.clinical.setting} · memburuk setelah terapi endokrin · belum dites
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <div className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-3">
                  <p className="flex items-center gap-2 font-semibold">
                    <Microscope aria-hidden className="size-4 text-accent" strokeWidth={1.75} />
                    Jaringan FFPE
                  </p>
                  <p className="mt-0.5 font-mono text-sm text-on-band-2">untuk PIK3CA, AKT1</p>
                </div>
                <div className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-3">
                  <p className="flex items-center gap-2 font-semibold">
                    <Droplet aria-hidden className="size-4 text-accent" strokeWidth={1.75} />
                    Plasma ctDNA
                  </p>
                  <p className="mt-0.5 font-mono text-sm text-on-band-2">untuk ESR1</p>
                </div>
                <Link href={`/pasien/${spotlight.patient.id}/laporan`} className={`${btnPrimary} sm:self-center`}>
                  <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
                  Buka {shortName(spotlight.patient.displayName)}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Patient table */}
      <section id="pasien" className="mx-auto max-w-[1440px] scroll-mt-12 px-4 py-10 sm:px-10">
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

      {/* How it works: same card style as the Pencil "alur demo" cards. */}
      <section id="cara-kerja" className="mx-auto max-w-[1440px] scroll-mt-12 px-4 pb-12 sm:px-10">
        <h2 className="text-2xl font-bold">Cara kerja</h2>
        <p className="mt-1 text-ink-2">Semua keputusan berbasis aturan tetap, tanpa ML. Setiap hasil membawa alasan yang bisa dibaca.</p>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {MODULES.map((m, i) => {
            const Icon = m.icon;
            return (
              <li key={m.name} className="relative">
                <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-5">
                  <div className="flex items-center justify-between">
                    <span className={`flex size-11 items-center justify-center rounded-xl ${m.tile}`}>
                      <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                    </span>
                    <span className="font-mono text-sm text-ink-3">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    {i + 1}. {m.name}
                  </h3>
                  <p className="mt-1 flex-1 text-ink-2">{m.text}</p>
                  <Link
                    href={m.example.href}
                    className="mt-4 inline-flex items-center gap-1.5 font-mono text-sm text-primary hover:underline"
                  >
                    Contoh: {m.example.label}
                    <ArrowRight aria-hidden className="size-3.5" strokeWidth={2} />
                  </Link>
                </div>
                {i < MODULES.length - 1 && (
                  <ChevronRight
                    aria-hidden
                    className="absolute top-1/2 -right-7 hidden size-6 -translate-y-1/2 text-ink-3 lg:block"
                    strokeWidth={1.5}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
