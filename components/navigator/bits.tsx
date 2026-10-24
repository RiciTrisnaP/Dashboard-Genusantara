import { FileText, MessageCircle, Phone, Siren, UserRound, type LucideIcon } from "lucide-react";
import { JOURNEY_LABEL } from "@/lib/navigator/rules";
import type { Channel, Journey, NavPatient } from "@/lib/navigator/types";

const JOURNEY_STYLE: Record<Journey, string> = {
  menunggu_tes: "bg-neutral-bg text-ink-2",
  menunggu_hasil: "bg-sky-soft text-sky",
  menunggu_konsultasi: "bg-warn-bg text-warn",
  didampingi: "bg-violet-soft text-violet",
  selesai: "bg-ok-bg text-ok",
};

export function JourneyChip({ journey }: { journey: Journey }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${JOURNEY_STYLE[journey]}`}>{JOURNEY_LABEL[journey]}</span>;
}

export function monthText(p: NavPatient): string {
  if (p.journey === "selesai") return `Selesai · ${p.package.totalMonths} dari ${p.package.totalMonths} bulan`;
  if (p.package.month === 0) return "Belum mulai didampingi";
  return `Bulan ${p.package.month} dari ${p.package.totalMonths}`;
}

export const CHANNEL: Record<Channel, { label: string; icon: LucideIcon }> = {
  whatsapp: { label: "WhatsApp dari nomor RS", icon: MessageCircle },
  telepon: { label: "Telepon", icon: Phone },
  tatap_muka: { label: "Tatap muka", icon: UserRound },
  eskalasi: { label: "Eskalasi ke dokter jaga", icon: Siren },
  dokumen: { label: "Dokumen", icon: FileText },
};

export function shortNav(p: NavPatient): string {
  return p.displayName.replace(/\s*\(simulasi\)\s*$/, "");
}

/** Large touch targets (at least 44 px) as the navigator spec asks. */
export const navBtn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors";
export const navBtnNavy = `${navBtn} bg-band text-white hover:bg-band-deep`;
export const navBtnOutline = `${navBtn} border border-band bg-white text-band hover:bg-canvas`;
export const navBtnPink = `${navBtn} bg-primary text-white hover:bg-accent-hover`;
export const navBtnDanger = `${navBtn} bg-bad-solid text-white hover:bg-bad`;
export const navBtnDisabled = `${navBtn} cursor-not-allowed bg-neutral-bg text-ink-3`;
