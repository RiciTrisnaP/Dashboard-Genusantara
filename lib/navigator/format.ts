import { formatDate } from "../format";

/** "2026-10-26T07:40" -> "Hari ini, 07.40" / "Kemarin, 19.10" / "18 Okt 2026, 08.20", relative to the demo day. */
export function formatWhen(iso: string, today: string): string {
  const day = iso.slice(0, 10);
  const time = iso.length >= 16 ? iso.slice(11, 16).replace(":", ".") : "";
  const t = new Date(`${today}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() - 1);
  const yesterday = t.toISOString().slice(0, 10);
  const label = day === today ? "Hari ini" : day === yesterday ? "Kemarin" : formatDate(day);
  return time ? `${label}, ${time}` : label;
}

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** "2026-10-26" -> "Senin, 26 Okt 2026" */
export function formatDayLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${DAYS[d.getUTCDay()]}, ${formatDate(iso)}`;
}
