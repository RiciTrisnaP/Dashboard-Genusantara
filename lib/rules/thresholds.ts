// DEMO thresholds from the team proposal (docs/rules_spec.md section 0).
// These are demo values, not clinical cut-offs. Change them here only.

export const THRESHOLDS = {
  /** Tissue with lower tumour content (%) is put on hold. */
  MIN_TUMOR_CONTENT_TISSUE: 20,
  /** Target with lower read depth (x) counts as unreadable (NGS). */
  MIN_DEPTH: 300,
  /** More unreadable targets than this puts the whole test on hold. */
  MAX_UNREADABLE_BEFORE_HOLD: 3,
  /** Variant below this VAF (%) in tissue goes to review. */
  MIN_VAF_TISSUE: 5,
  /** Variant below this VAF (%) in plasma goes to review. */
  MIN_VAF_PLASMA: 0.5,
  /** Fewer supporting reads than this goes to review. */
  MIN_ALT_READS: 10,
  /** Plasma processed later than this (hours) gets an S2 warning. */
  MAX_PLASMA_PROCESSING_HOURS: 6,
  /** Plasma processed later than this (hours) must be resampled. */
  PLASMA_RESAMPLE_HOURS: 24,
} as const;

export const THRESHOLD_LABELS: Record<keyof typeof THRESHOLDS, string> = {
  MIN_TUMOR_CONTENT_TISSUE: "Kadar sel tumor minimum (jaringan)",
  MIN_DEPTH: "Cakupan baca minimum per target",
  MAX_UNREADABLE_BEFORE_HOLD: "Maksimum target tidak terbaca sebelum TAHAN",
  MIN_VAF_TISSUE: "VAF minimum (jaringan)",
  MIN_VAF_PLASMA: "VAF minimum (plasma)",
  MIN_ALT_READS: "Jumlah baca varian minimum",
  MAX_PLASMA_PROCESSING_HOURS: "Batas waktu proses plasma (peringatan)",
  PLASMA_RESAMPLE_HOURS: "Batas waktu proses plasma (ambil ulang)",
};

export const THRESHOLD_UNITS: Record<keyof typeof THRESHOLDS, string> = {
  MIN_TUMOR_CONTENT_TISSUE: "%",
  MIN_DEPTH: "x",
  MAX_UNREADABLE_BEFORE_HOLD: " target",
  MIN_VAF_TISSUE: "%",
  MIN_VAF_PLASMA: "%",
  MIN_ALT_READS: " baca",
  MAX_PLASMA_PROCESSING_HOURS: " jam",
  PLASMA_RESAMPLE_HOURS: " jam",
};
