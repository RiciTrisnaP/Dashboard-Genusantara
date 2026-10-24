"use client";

import { CircleCheck, Siren } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import { navigator } from "@/lib/navigator/data";
import { formatWhen } from "@/lib/navigator/format";
import { checkinState, CHECKIN_THRESHOLDS as T, flagCheckin, LEMAS_LABEL, RUAM_LABEL } from "@/lib/navigator/rules";
import type { Checkin } from "@/lib/navigator/types";
import { formatNumber } from "@/lib/format";
import { navBtn, navBtnDanger, navBtnOutline, shortNav } from "./bits";
import { useNavigator } from "./NavigatorProvider";

type Tone = "ok" | "warn" | "bad";
const CHIP: Record<Tone, string> = {
  ok: "bg-canvas text-ink-2",
  warn: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
};

function answerChips(c: Checkin): { q: string; a: string; tone: Tone }[] {
  const a = c.answers;
  return [
    {
      q: "Demam",
      a: a.demamC == null ? "Tidak" : `Ya, ${formatNumber(a.demamC)}°C`,
      tone: a.demamC == null ? "ok" : a.demamC >= T.FEVER_URGENT_C ? "bad" : a.demamC >= T.FEVER_WATCH_C ? "warn" : "ok",
    },
    { q: "Lemas", a: LEMAS_LABEL[a.lemas], tone: a.lemas === 3 ? "bad" : a.lemas === 2 ? "warn" : "ok" },
    {
      q: "Diare",
      a: a.diarePerHari === 0 ? "Tidak" : `${a.diarePerHari} kali sehari`,
      tone: a.diarePerHari >= T.DIARRHEA_URGENT_PER_DAY ? "bad" : a.diarePerHari >= T.DIARRHEA_WATCH_PER_DAY ? "warn" : "ok",
    },
    { q: "Ruam", a: RUAM_LABEL[a.ruam], tone: a.ruam === "luas" ? "bad" : a.ruam === "ringan" ? "warn" : "ok" },
    { q: "Sangat haus", a: a.sangatHaus ? "Ya" : "Tidak", tone: a.sangatHaus ? "warn" : "ok" },
  ];
}

export function CheckinCard({ checkin, showPatient = true, highlight = false }: { checkin: Checkin; showPatient?: boolean; highlight?: boolean }) {
  const { escalate, review, patient } = useNavigator();
  const f = flagCheckin(checkin.answers);
  const st = checkinState(checkin);
  const p = patient(checkin.patientId);
  const open = st === "baru";
  const frame = !open ? "border border-line" : f.flag === "mendesak" ? "border-2 border-bad-line" : "border border-line";

  return (
    <article id={checkin.id} className={`scroll-mt-28 rounded-2xl bg-white p-5 ${frame} ${highlight ? "ring-4 ring-primary/25" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-bold">
          {showPatient && p ? `${shortNav(p)} · ` : ""}
          <span className="text-sm font-normal text-ink-3">{formatWhen(checkin.at, navigator.today)}</span>
        </p>
        {open ? (
          <StatusBadge tone={f.tone} size="md">
            {f.label}
          </StatusBadge>
        ) : (
          <StatusBadge tone="ok" icon={CircleCheck} size="md">
            Sudah ditindaklanjuti
          </StatusBadge>
        )}
      </div>
      <ul className="my-3 flex flex-wrap gap-2">
        {answerChips(checkin).map((c) => (
          <li key={c.q} className={`rounded-full px-3 py-1 text-sm font-semibold ${CHIP[c.tone]}`}>
            {c.q}: {c.a}
          </li>
        ))}
      </ul>
      {checkin.keluhan && <p className="rounded-lg bg-canvas px-4 py-2.5 text-ink-2">&ldquo;{checkin.keluhan}&rdquo;</p>}
      {open && f.flag !== "normal" && <p className="mt-2 text-sm text-ink-3">Ditandai karena: {f.reasons.join(", ")}.</p>}

      {open ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {f.flag === "mendesak" ? (
            <button type="button" onClick={() => escalate(checkin.id)} className={navBtnDanger}>
              <Siren aria-hidden className="size-4" />
              Eskalasi ke dokter jaga
            </button>
          ) : (
            <button type="button" onClick={() => review(checkin.id)} className={navBtnOutline}>
              Tandai sudah ditinjau
            </button>
          )}
          {showPatient && (
            <Link href={`/perawat/pasien/${checkin.patientId}#gejala`} className={`${navBtn} bg-canvas text-ink hover:bg-neutral-bg`}>
              Buka pasien
            </Link>
          )}
        </div>
      ) : (
        <p className="mt-3 font-semibold text-ok">
          {st === "dieskalasi"
            ? `Dieskalasikan ke dokter jaga pukul ${checkin.escalatedAt!.slice(11, 16).replace(":", ".")}. Menunggu arahan dokter; keputusan klinis ada di dokter.`
            : `Ditinjau perawat pukul ${checkin.reviewedAt!.slice(11, 16).replace(":", ".")}. Lanjut pemantauan rutin.`}
        </p>
      )}
    </article>
  );
}
