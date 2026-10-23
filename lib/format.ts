const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "2026-10-23" -> "23 Okt 2026". Parsed by hand so the output never depends on the runtime's locale data. */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/** 87025221 -> "Rp87.025.221" */
export function formatRupiah(value: number): string {
  const digits = Math.round(value).toString();
  return `Rp${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

/** 1.8 -> "1,8" (Indonesian decimal comma). */
export function formatNumber(value: number): string {
  return value.toString().replace(".", ",");
}
