// Types for data/navigator.json (nurse navigator dashboard, simulated data).

export type Journey = "menunggu_tes" | "menunggu_hasil" | "menunggu_konsultasi" | "didampingi" | "selesai";
export type SummaryStatus = "belum_ada" | "menunggu_dokter" | "dirilis" | "diserahkan";
export type ConsentStatus = "ya" | "belum" | "tidak_berlaku";
export type ConsentKind = "pendampingan" | "whatsapp" | "registri" | "germline";
export type ReferralStatus = "belum_dirujuk" | "dirujuk" | "dijadwalkan";
export type Channel = "whatsapp" | "telepon" | "tatap_muka" | "eskalasi" | "dokumen";
export type Urgency = "mendesak" | "hari_ini" | "rutin";
export type PatientTab = "ringkasan" | "gejala" | "pesan" | "riwayat" | "persetujuan" | "serah";

export interface Contact {
  at: string;
  channel: Channel;
  text: string;
}

export interface NavPatient {
  id: string;
  displayName: string;
  age: number;
  subtype: string;
  stage: string;
  dpjp: string;
  journey: Journey;
  nextStep: string;
  summary: SummaryStatus;
  package: { name: string; month: number; totalMonths: number; endsOn: string | null };
  therapy: { regimen: string; since: string; note: string } | null;
  family: string;
  consents: Record<ConsentKind, ConsentStatus>;
  referral: { type: string; status: ReferralStatus } | null;
  minutesThisMonth: number;
  /** Only for navigator-only patients (not in data/patients.json). */
  gate?: { status: "lulus" | "tinjau" | "ditahan"; readable: number; total: number; testedOn: string };
  contacts: Contact[];
  handoff: string;
}

export type Lemas = 0 | 1 | 2 | 3;
export type Ruam = "tidak" | "ringan" | "luas";

export interface CheckinAnswers {
  /** Measured temperature in °C, or null when not feverish / not measured. */
  demamC: number | null;
  lemas: Lemas;
  diarePerHari: number;
  ruam: Ruam;
  sangatHaus: boolean;
}

export interface Checkin {
  id: string;
  patientId: string;
  at: string;
  answers: CheckinAnswers;
  keluhan: string;
  reviewedAt?: string;
  escalatedAt?: string;
}

export interface Task {
  id: string;
  patientId: string;
  urgency: Urgency;
  title: string;
  detail: string;
  due: string;
  action: { kind: "checkin"; checkinId: string } | { kind: "patient"; tab: PatientTab };
}

export interface NavigatorFile {
  _note: string;
  today: string;
  nurse: string;
  patients: NavPatient[];
  checkins: Checkin[];
  tasks: Task[];
  responseTimesHours: number[];
}
