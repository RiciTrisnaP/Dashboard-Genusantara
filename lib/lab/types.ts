// Types for data/lab.json (lab dashboard, simulated data). The lab sees sample codes, never patient names.

/** Where a sample is in the lab: intake, queued, in a run, quality gate, pathologist, released, or stopped. */
export type Stage = "masuk" | "antri" | "run_b" | "run" | "sentinel" | "patolog" | "rilis" | "ditolak" | "ditahan";

/** Gate status: LULUS, TINJAU, TAHAN, or not decided yet. */
export type Gate = "ok" | "warn" | "bad" | "wait";

export type TargetCall = "terdeteksi" | "tidak_terdeteksi" | "belum_pasti" | "tidak_terbaca";

export interface LabSample {
  code: string;
  /** Referring hospital (generic simulated name). */
  sender: string;
  doctor: string;
  specimen: "FFPE" | "Plasma ctDNA";
  /** Block description; null while the block has not arrived from the sender's pathology unit. */
  block: string | null;
  blockAgeMonths: number | null;
  decalcified: boolean;
  tumorPct: number | null;
  dnaNgUl: number | null;
  receivedAt: string;
  stage: Stage;
  run?: string;
  /** Internal control Ct per multiplex reaction (R1 to R4). Present once the run is finished. */
  ic?: Record<string, number>;
  /** Panel target ids called as detected, for example "PIK3CA H1047R". */
  detected?: string[];
  /** Demo flow link to the doctor and navigator dashboards. Never shown on lab screens. */
  patientId?: string;
}

export interface LabThresholds {
  icPassMaxCt: number;
  icReviewMaxCt: number;
  minTumorPct: number;
  maxBlockAgeMonths: number;
  minDnaNgUl: number;
}

export interface ReleasedSample {
  code: string;
  tatDays: number;
  delay?: string;
  patientId?: string;
}

export interface LabFile {
  _note: string;
  today: string;
  lab: string;
  analyst: string;
  pathologist: string;
  thresholds: LabThresholds;
  run: {
    capacity: number;
    minSamples: number;
    current: { id: string; startedAt: string; machine: string; step: number; eta: string };
    next: { id: string; scheduledAt: string; machine: string };
  };
  samples: LabSample[];
  released: ReleasedSample[];
  month: { label: string; samples: number; retests: number; heldBefore: number; senders: number };
  pricing: { licensePerSample: number; retestLimitPct: number; tatTargetDays: number; testPrice: number };
}
