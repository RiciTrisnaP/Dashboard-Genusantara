/** Lowercase, strip accents and collapse spaces so "Ibu  É" matches "ibu e". */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** True when every word of the query appears somewhere in the given fields (order does not matter). */
export function matchesQuery(query: string, fields: (string | number | null | undefined)[]): boolean {
  const terms = normalize(query).split(" ").filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalize(fields.filter((f) => f != null).join(" "));
  return terms.every((t) => haystack.includes(t));
}
