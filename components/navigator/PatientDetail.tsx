"use client";

import { ArrowLeft, EyeOff, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/ui";
import { sampleCodeOf } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { navigator } from "@/lib/navigator/data";
import { formatWhen } from "@/lib/navigator/format";
import {
  canHandOverSummary,
  canSendWhatsApp,
  CONSENT_LABEL,
  CONSENT_STATUS_LABEL,
  gateView,
  MESSAGE_TEMPLATES,
  sortCheckins,
  STAGE_LINE,
  stageIndex,
  SUMMARY_LABEL,
} from "@/lib/navigator/rules";
import type { ConsentKind, NavPatient, PatientTab, SummaryStatus } from "@/lib/navigator/types";
import type { Tone } from "@/lib/rules/sentinel";
import { CHANNEL, monthText, navBtnDisabled, navBtnNavy, navBtnOutline, navBtnPink } from "./bits";
import { CheckinCard } from "./CheckinCard";
import { CheckinForm } from "./CheckinForm";
import { useNavigator } from "./NavigatorProvider";
import { useHash } from "./useHash";

const TABS: { id: PatientTab; label: string }[] = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "gejala", label: "Gejala & efek samping" },
  { id: "pesan", label: "Kirim pesan" },
  { id: "riwayat", label: "Riwayat kontak" },
  { id: "persetujuan", label: "Persetujuan & rujukan" },
  { id: "serah", label: "Serah terima" },
];

const SUMMARY_TONE: Record<SummaryStatus, Tone> = { belum_ada: "neutral", menunggu_dokter: "warn", dirilis: "ok", diserahkan: "ok" };

function card(title: string, children: React.ReactNode) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="mb-3 text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

/** The data's "next step" goes stale once the nurse acts; these overrides keep it truthful in the session. */
function nextStep(p: NavPatient, base: NavPatient): string {
  if (base.summary === "dirilis" && p.summary === "diserahkan") {
    return p.referral && p.referral.status !== "dijadwalkan"
      ? "Ringkasan sudah diserahkan. Lanjutkan rujukan konseling genetik sampai dijadwalkan."
      : "Ringkasan sudah diserahkan. Lanjutkan check-in gejala rutin.";
  }
  if (base.referral && p.referral?.status === "dijadwalkan" && base.referral.status !== "dijadwalkan") {
    return "Rujukan sudah dijadwalkan. Lanjutkan check-in gejala rutin.";
  }
  return base.nextStep;
}

export function PatientDetail({ id }: { id: string }) {
  const nav = useNavigator();
  const p = nav.patient(id);
  const base = navigator.patients.find((x) => x.id === id);
  const hash = useHash();
  const [picked, setPicked] = useState<PatientTab | null>(null);
  // Task links open a specific tab via #tab. A click writes its tab into the hash too, so a later link
  // with a different hash (this page can stay mounted between visits) still wins over the old click.
  const fromHash = TABS.find((t) => t.id === hash)?.id;
  const tab: PatientTab = picked && picked === hash ? picked : (fromHash ?? picked ?? "ringkasan");

  if (!p || !base) return <p>Pasien tidak ditemukan.</p>;

  const pick = (t: PatientTab) => {
    setPicked(t);
    history.replaceState(null, "", `#${t}`);
  };
  const gate = gateView(p);
  const step = stageIndex(p.journey);
  const sampleCode = sampleCodeOf(p.id);

  return (
    <div className="space-y-4">
      <Link href="/perawat/pasien" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary hover:underline">
        <ArrowLeft aria-hidden className="size-4" />
        Kembali ke daftar pasien
      </Link>

      <header className="rounded-3xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">{p.displayName}</h1>
            <p className="text-ink-3">
              {p.age} th · {p.subtype} · {p.stage} · DPJP {p.dpjp}
            </p>
            {sampleCode && <p className="text-sm text-ink-3">Kode sampel lab: <span className="font-mono font-semibold text-ink-2">{sampleCode}</span></p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={gate.tone} size="md">
              Tes: {gate.label}
            </StatusBadge>
            <span className="rounded-full bg-canvas px-3 py-1 text-sm font-semibold">{monthText(p)}</span>
          </div>
        </div>
        <ol aria-label="Tahap pasien" className="mt-5 grid grid-cols-5 gap-1.5">
          {STAGE_LINE.map((label, i) => {
            const state = i < step ? "done" : i === step ? "now" : "next";
            return (
              <li key={label} className="flex flex-col gap-1.5" aria-current={state === "now" ? "step" : undefined}>
                <span className={`h-2 rounded-full ${state === "done" ? "bg-band" : state === "now" ? "bg-primary" : "bg-neutral-bg"}`} />
                <span className={`text-xs sm:text-sm ${state === "now" ? "font-bold" : state === "next" ? "text-ink-3" : ""}`}>{label}</span>
              </li>
            );
          })}
        </ol>
        <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-2xl bg-primary-soft px-4 py-3">
          <span className="text-xs font-bold tracking-[0.08em] text-primary-strong uppercase">Langkah berikutnya</span>
          <span className="font-semibold">{nextStep(p, base)}</span>
        </div>
      </header>

      <div role="tablist" aria-label="Bagian detail pasien" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => pick(t.id)}
            className={`-mb-px min-h-11 shrink-0 border-b-[3px] px-3 text-sm font-semibold whitespace-nowrap sm:text-base ${
              tab === t.id ? "border-primary text-ink" : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ringkasan" && <SummaryTab p={p} />}
      {tab === "gejala" && <SymptomsTab p={p} />}
      {tab === "pesan" && <MessageTab p={p} />}
      {tab === "riwayat" && <HistoryTab p={p} />}
      {tab === "persetujuan" && <ConsentTab p={p} />}
      {tab === "serah" && <HandoffTab p={p} />}
    </div>
  );
}

function SummaryTab({ p }: { p: NavPatient }) {
  const { handOver } = useNavigator();
  const gate = gateView(p);
  const hand = canHandOverSummary(p.summary);
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {card(
        "Status tes dan sampel",
        <>
          <StatusBadge tone={gate.tone} size="md">
            {gate.label}
          </StatusBadge>
          <p className="mt-3 text-ink-2">{gate.detail}</p>
          {gate.warning && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-bad-bg px-3 py-2 text-sm font-semibold text-bad">
              <EyeOff aria-hidden className="mt-0.5 size-4 shrink-0" />
              {gate.warning}
            </p>
          )}
          {gate.next && <p className="mt-3 text-sm text-ink-3">{gate.next}</p>}
          <p className="mt-3 text-xs text-ink-3">Perawat melihat status saja; isi hasil dan varian ada di laporan dokter.</p>
        </>,
      )}
      {card(
        "Ringkasan hasil untuk pasien",
        <>
          <StatusBadge tone={SUMMARY_TONE[p.summary]} icon={p.summary === "menunggu_dokter" ? Lock : undefined} size="md">
            {SUMMARY_LABEL[p.summary]}
          </StatusBadge>
          <p className="mt-3 text-ink-2">
            {p.summary === "menunggu_dokter"
              ? "Hasil sudah keluar atau sedang ditinjau, tetapi dokter belum menjelaskan. Jangan sampaikan isi hasil ke pasien atau keluarga."
              : hand.reason}
          </p>
          <button type="button" disabled={!hand.ok} onClick={() => handOver(p.id)} className={`mt-4 ${hand.ok ? navBtnNavy : navBtnDisabled}`}>
            {!hand.ok && p.summary !== "diserahkan" && <Lock aria-hidden className="size-4" />}
            {p.summary === "diserahkan" ? "Ringkasan sudah diserahkan" : hand.ok ? "Serahkan ringkasan (dokumen)" : "Belum bisa diserahkan"}
          </button>
        </>,
      )}
      {card(
        "Paket dan pendampingan",
        <>
          <p className="font-semibold">{p.package.name}</p>
          <p className="text-ink-2">
            {monthText(p)}
            {p.package.endsOn ? ` · berakhir ${formatDate(p.package.endsOn)}` : ""}
          </p>
          <p className="mt-2 text-sm text-ink-3">Setiap bulan didampingi tercatat otomatis untuk tagihan.</p>
          <p className="mt-3">
            Pendamping keluarga: <span className="font-semibold">{p.family}</span>
          </p>
        </>,
      )}
      {card(
        "Terapi yang sedang dijalani",
        p.therapy ? (
          <>
            <p className="font-semibold">{p.therapy.regimen}</p>
            <p className="text-ink-2">Sejak {formatDate(p.therapy.since)}</p>
            <p className="mt-2 text-sm text-ink-3">{p.therapy.note}. Perawat mencatat keluhan dan efek samping; perubahan terapi hanya oleh dokter.</p>
          </>
        ) : (
          <p className="text-ink-2">Belum ada terapi yang diputuskan dokter.</p>
        ),
      )}
    </div>
  );
}

function SymptomsTab({ p }: { p: NavPatient }) {
  const { state } = useNavigator();
  const mine = sortCheckins(state.checkins.filter((c) => c.patientId === p.id));
  const [highlight, setHighlight] = useState("");
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {p.journey === "selesai" ? (
        <p className="rounded-2xl border border-line bg-white p-5 text-ink-2">Pendampingan sudah selesai; check-in baru tidak dicatat lagi.</p>
      ) : (
        <CheckinForm fixedPatientId={p.id} onSaved={setHighlight} />
      )}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">Riwayat check-in ({mine.length})</h2>
        {mine.length === 0 && <p className="rounded-2xl border border-dashed border-line bg-white p-5 text-ink-3">Belum ada check-in.</p>}
        {mine.map((c) => (
          <CheckinCard key={c.id} checkin={c} showPatient={false} highlight={c.id === highlight} />
        ))}
      </div>
    </div>
  );
}

function MessageTab({ p }: { p: NavPatient }) {
  const { logContact } = useNavigator();
  const [tplId, setTplId] = useState(MESSAGE_TEMPLATES[0].id);
  const [sent, setSent] = useState(false);
  const tpl = MESSAGE_TEMPLATES.find((t) => t.id === tplId)!;
  const wa = canSendWhatsApp(p);
  return (
    <section className="max-w-3xl rounded-2xl border border-line bg-white p-5">
      <h2 className="text-base font-bold">Kirim pesan dari nomor WhatsApp RS</h2>
      <p className="mb-3 text-sm text-ink-3">Hasil tes tidak pernah dikirim lewat chat.</p>
      <div role="group" aria-label="Pilih templat" className="mb-3 flex flex-wrap gap-2">
        {MESSAGE_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={t.id === tplId}
            onClick={() => {
              setTplId(t.id);
              setSent(false);
            }}
            className={`min-h-10 rounded-full border px-4 text-sm ${t.id === tplId ? "border-primary bg-primary-soft font-bold" : "border-line font-medium"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="rounded-xl bg-canvas px-4 py-3 whitespace-pre-line">{tpl.body(p)}</p>
      {!wa.ok && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-bad-bg px-4 py-2.5 text-sm font-semibold text-bad">
          <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
          {wa.reason}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!wa.ok}
          onClick={() => {
            logContact(p.id, "whatsapp", `Terkirim: ${tpl.label}.`);
            setSent(true);
          }}
          className={wa.ok ? navBtnPink : navBtnDisabled}
        >
          {!wa.ok && <Lock aria-hidden className="size-4" />}
          Kirim dan catat di riwayat
        </button>
        {sent && <span className="text-sm font-semibold text-ok">Terkirim dan tercatat di riwayat kontak (simulasi).</span>}
      </div>
    </section>
  );
}

function HistoryTab({ p }: { p: NavPatient }) {
  const items = [...p.contacts].reverse();
  return (
    <section className="max-w-3xl rounded-2xl border border-line bg-white px-5 py-2">
      {items.length === 0 && <p className="py-4 text-ink-3">Belum ada kontak.</p>}
      <ol className="divide-y divide-line">
        {items.map((c, i) => {
          const ch = CHANNEL[c.channel];
          const Icon = ch.icon;
          return (
            <li key={`${c.at}-${i}`} className="flex gap-3 py-3">
              <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${c.channel === "eskalasi" ? "bg-bad-bg text-bad" : "bg-canvas text-ink-2"}`}>
                <Icon aria-hidden className="size-4" />
              </span>
              <div>
                <p className="text-sm text-ink-3">
                  {formatWhen(c.at, navigator.today)} · {ch.label}
                </p>
                <p>{c.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

const CONSENT_TONE = { ya: "ok", belum: "block", tidak_berlaku: "neutral" } as const;
const REFERRAL_LABEL = { belum_dirujuk: "Belum dirujuk", dirujuk: "Dirujuk, menunggu jadwal", dijadwalkan: "Dijadwalkan" } as const;

function ConsentTab({ p }: { p: NavPatient }) {
  const { recordConsent, advanceReferral } = useNavigator();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {card(
        "Persetujuan pasien",
        <ul className="space-y-3">
          {(Object.keys(CONSENT_LABEL) as ConsentKind[]).map((k) => {
            const v = p.consents[k];
            return (
              <li key={k} className="flex flex-wrap items-center justify-between gap-2">
                <span>{CONSENT_LABEL[k]}</span>
                <span className="flex items-center gap-2">
                  <StatusBadge tone={CONSENT_TONE[v]}>{CONSENT_STATUS_LABEL[v]}</StatusBadge>
                  {v === "belum" && (
                    <button type="button" onClick={() => recordConsent(p.id, k)} className={navBtnOutline}>
                      Catat dari formulir RS
                    </button>
                  )}
                </span>
              </li>
            );
          })}
          <li className="pt-1 text-sm text-ink-3">Data genetik termasuk data pribadi spesifik (UU PDP); setiap pemakaian butuh persetujuan tercatat.</li>
        </ul>,
      )}
      {card(
        "Rujukan",
        p.referral ? (
          <>
            <p>{p.referral.type}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge tone={p.referral.status === "dijadwalkan" ? "ok" : "warn"} size="md">
                {REFERRAL_LABEL[p.referral.status]}
              </StatusBadge>
              {p.referral.status !== "dijadwalkan" && (
                <button type="button" onClick={() => advanceReferral(p.id)} className={navBtnOutline}>
                  {p.referral.status === "belum_dirujuk" ? "Catat rujukan dikirim" : "Tandai sudah dijadwalkan"}
                </button>
              )}
            </div>
            {p.consents.germline === "belum" && (
              <p className="mt-3 text-sm text-ink-3">Persetujuan data germline belum tercatat; lengkapi sebelum tes germline.</p>
            )}
            <p className="mt-3 text-sm text-ink-3">Panel somatik tidak menilai risiko keturunan; rujukan memastikan pasien berisiko tetap tertangani.</p>
          </>
        ) : (
          <p className="text-ink-3">Tidak ada rujukan aktif. Kriteria rujukan keturunan belum terpenuhi.</p>
        ),
      )}
    </div>
  );
}

function HandoffTab({ p }: { p: NavPatient }) {
  const { saveHandoff } = useNavigator();
  const [draft, setDraft] = useState(p.handoff);
  const [saved, setSaved] = useState(false);
  return (
    <section className="max-w-3xl rounded-2xl border border-line bg-white p-5">
      <label htmlFor="catatan-serah" className="block text-base font-bold">
        Catatan untuk perawat berikutnya
      </label>
      <p className="mb-3 text-sm text-ink-3">Tulis hal yang perlu diketahui bila pasien ditangani perawat lain.</p>
      <textarea
        id="catatan-serah"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setSaved(false);
        }}
        rows={5}
        className="w-full rounded-lg border border-line px-3 py-2.5 focus:border-primary focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            saveHandoff(p.id, draft.trim());
            setSaved(true);
          }}
          className={navBtnNavy}
        >
          Simpan catatan
        </button>
        {saved && <span className="text-sm font-semibold text-ok">Tersimpan untuk perawat berikutnya (selama sesi demo).</span>}
      </div>
    </section>
  );
}
