import { ArrowRight, Banknote, CircleDashed, ClipboardList, FileText, HeartHandshake, HeartPulse, ListChecks, PencilLine, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ModuleCards } from "@/components/ModuleCards";
import { btnOnDark, btnPrimary } from "@/components/ui";
import { getPatient, panel, patients } from "@/lib/data";
import { runCase } from "@/lib/rules";

const VALUES: { icon: LucideIcon; tile: string; title: string; text: string }[] = [
  {
    icon: ShieldCheck,
    tile: "bg-sky-soft text-sky",
    title: "Jujur soal mutu",
    text: 'Gerbang mutu SENTINEL memeriksa sampel dan hasil sebelum dibaca. Target yang tidak terbaca tidak pernah dibaca sebagai "tidak ada mutasi".',
  },
  {
    icon: Banknote,
    tile: "bg-primary-soft text-primary-strong",
    title: "Sesuai akses di Indonesia",
    text: "Pilihan terapi diurutkan menurut yang bisa didapat: status BPOM, JKN, harga, dan tanggal cek selalu tampil.",
  },
  {
    icon: HeartHandshake,
    tile: "bg-violet-soft text-violet",
    title: "Dipahami pasien",
    text: "Ringkasan bahasa awam: apa yang ditemukan, bahwa mutasi tumor tidak diturunkan ke anak, dan biaya yang terbuka.",
  },
];

function demoSteps() {
  const f = getPatient("F");
  const fCase = f ? runCase(f) : null;
  const fRead =
    fCase?.sentinel.tested ? `${fCase.sentinel.s3.readableCount} dari ${fCase.sentinel.s3.totalTargets} target terbaca, spesimen tulang rusak` : "spesimen rusak";
  return [
    { time: "0:00", icon: Users, tile: "bg-sky-soft text-sky", title: "Daftar Pasien", text: "Kartu sorotan: 1 pasien perlu tes molekuler.", href: "/pasien" },
    { time: "0:15", icon: FileText, tile: "bg-primary-soft text-primary-strong", title: "Ibu A · Laporan", text: "PIK3CA H1047R. Capivasertib dengan status BPOM, JKN, dan harga.", href: "/pasien/A/laporan" },
    { time: "0:40", icon: PencilLine, tile: "bg-ok-bg text-ok", title: "Tanda tangan", text: "Status DRAF berubah menjadi Terbit, siap dicetak A4.", href: "/pasien/A/laporan" },
    { time: "0:50", icon: ShieldCheck, tile: "bg-bad-bg text-bad", title: "Ibu F · SENTINEL", text: `TAHAN: ${fRead}. Bukan "tidak ada mutasi".`, href: "/pasien/F/sentinel" },
    { time: "1:10", icon: ListChecks, tile: "bg-violet-soft text-violet", title: "Ibu D · REFLEX", text: "Tidak terdeteksi varian; saran tes lanjutan, butuh persetujuan dokter.", href: "/pasien/D/reflex" },
  ];
}

export default function LandingPage() {
  const genes = [...new Set(panel.targets.map((t) => t.gene))];
  const steps = demoSteps();

  return (
    <>
      {/* Hero (navy) */}
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
        <div className="relative mx-auto max-w-[1440px] px-4 py-16 sm:px-10 lg:py-24">
          <p className="text-sm font-semibold tracking-[0.12em] text-accent-light uppercase">
            Genusa · alat bantu dokter onkologi
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
            Tepat obatnya,
            <br />
            tuntas terapinya.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/90">
            Membantu dokter memilih terapi kanker payudara dari hasil panel mutasi tumor {panel.shortName}, dengan gerbang
            mutu sebelum hasil dibaca dan pilihan obat yang diurutkan menurut akses di Indonesia.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/pasien" className={btnPrimary}>
              <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
              Masuk sebagai dokter
            </Link>
            <Link href="/perawat" className={btnOnDark}>
              <HeartHandshake aria-hidden className="size-4" strokeWidth={2} />
              Masuk sebagai perawat navigator
            </Link>
          </div>
          <p className="mt-6 max-w-xl text-sm text-on-band-2">
            Untuk pasien dengan diagnosis kanker payudara yang sudah terkonfirmasi. Bukan untuk skrining atau diagnosis awal.
          </p>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-10">
        <ul className="grid gap-4 md:grid-cols-3">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <li key={v.title} className="rounded-2xl border border-line bg-white p-6">
                <span className={`flex size-11 items-center justify-center rounded-xl ${v.tile}`}>
                  <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <h2 className="mt-4 text-xl font-semibold">{v.title}</h2>
                <p className="mt-1 text-ink-2">{v.text}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Panel */}
      <section className="mx-auto max-w-[1440px] px-4 pb-12 sm:px-10">
        <div className="grid gap-8 rounded-3xl border border-line bg-white p-6 sm:p-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">Panel</p>
            <h2 className="mt-1 text-3xl font-bold">
              {panel.shortName}: {panel.targets.length} hotspot di {genes.length} gen
            </h2>
            <p className="mt-3 text-ink-2">
              Panel ringkas yang dipilih tim untuk pemilihan terapi setelah diagnosis terkonfirmasi. Setiap target adalah alel
              tertentu; hanya alel yang tercantum yang dilaporkan.
            </p>
            <div className="mt-5 rounded-xl bg-canvas p-4">
              <p className="font-semibold">Tidak dicakup panel ini</p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink-2">
                {[
                  ["ESR1", "dinilai lewat tes plasma ctDNA terpisah bila perlu"],
                  ["PTEN", "tidak termasuk target panel"],
                  ["BRCA1/2", "dinilai lewat tes germline dari darah dengan konseling"],
                ].map(([gene, note]) => (
                  <li key={gene} className="flex gap-2">
                    <CircleDashed aria-hidden className="mt-0.5 size-4 shrink-0 text-warn-solid" strokeWidth={1.75} />
                    <span>
                      <span className="font-mono font-semibold text-ink">{gene}</span>: {note}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-5">
            {genes.map((gene) => {
              const ts = panel.targets.filter((t) => t.gene === gene);
              return (
                <div key={gene}>
                  <p className="flex items-baseline gap-2">
                    <span className="font-mono text-lg font-semibold">{gene}</span>
                    <span className="text-sm text-ink-3">{ts.length} hotspot</span>
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {ts.map((t) => (
                      <li
                        key={t.id}
                        className="rounded-lg border border-primary/30 bg-primary-soft px-3 py-1.5 font-mono font-semibold text-primary-strong"
                      >
                        {t.allele}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="cara-kerja" className="mx-auto max-w-[1440px] scroll-mt-12 px-4 pb-12 sm:px-10">
        <h2 className="text-3xl font-bold">Cara kerja</h2>
        <p className="mt-1 text-ink-2">Semua keputusan berbasis aturan tetap, tanpa ML. Setiap hasil membawa alasan yang bisa dibaca.</p>
        <ModuleCards />
      </section>

      {/* Navigator role */}
      <section className="mx-auto max-w-[1440px] px-4 pb-12 sm:px-10">
        <div className="grid gap-6 rounded-3xl border border-line bg-white p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">Untuk perawat navigator</p>
            <h2 className="mt-1 text-3xl font-bold">Mendampingi pasien premium sepanjang pengobatan</h2>
            <p className="mt-3 text-ink-2">
              Dashboard navigator membantu perawat memegang setiap langkah: dari tes sampai pendampingan selesai. Keluhan dan efek samping obat dicatat
              terstruktur, tanda bahaya diteruskan ke dokter jaga, dan aturan keselamatan dijaga otomatis.
            </p>
            <Link href="/perawat" className={`${btnPrimary} mt-5`}>
              <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
              Buka dashboard navigator
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: ClipboardList, tile: "bg-sky-soft text-sky", title: "Tugas hari ini", text: "Diurutkan menurut urgensi: mendesak, hari ini, rutin." },
              { icon: HeartPulse, tile: "bg-bad-bg text-bad", title: "Check-in gejala", text: "Demam, diare, ruam, lemas, sangat haus. Yang berbahaya ditandai otomatis." },
              { icon: ShieldCheck, tile: "bg-primary-soft text-primary-strong", title: "Aturan terjaga", text: "Hasil tidak lewat chat; WhatsApp terkunci tanpa persetujuan." },
              { icon: Users, tile: "bg-violet-soft text-violet", title: "Serah terima", text: "Riwayat kontak dan catatan untuk perawat berikutnya." },
            ].map((f) => (
              <li key={f.title} className="rounded-2xl bg-canvas p-4">
                <span className={`flex size-10 items-center justify-center rounded-xl ${f.tile}`}>
                  <f.icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <p className="mt-3 font-semibold">{f.title}</p>
                <p className="text-sm text-ink-2">{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Demo flow */}
      <section className="mx-auto max-w-[1440px] px-4 pb-14 sm:px-10">
        <h2 className="text-3xl font-bold">Alur demo, sekitar 90 detik</h2>
        <p className="mt-1 text-ink-2">Lima klik, tiga pesan: tepat obatnya, jujur mutunya, jelas langkah berikutnya.</p>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title}>
                <Link href={s.href} className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 transition-colors hover:border-primary/40">
                  <div className="flex items-center justify-between">
                    <span className={`flex size-11 items-center justify-center rounded-xl ${s.tile}`}>
                      <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                    </span>
                    <span className="font-mono text-sm text-ink-3">{s.time}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    {i + 1}. {s.title}
                  </h3>
                  <p className="mt-1 flex-1 text-ink-2">{s.text}</p>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Closing CTA (navy) */}
      <section className="bg-band text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-12 sm:px-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Coba dengan {patients.length} pasien simulasi</h2>
            <p className="mt-1 text-on-band-2">Semua data simulasi. Tidak ada data yang disimpan. Keputusan terapi tetap pada dokter.</p>
          </div>
          <Link href="/pasien" className={`${btnPrimary} self-start md:self-center`}>
            <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
            Masuk ke Daftar Pasien
          </Link>
        </div>
      </section>
    </>
  );
}
