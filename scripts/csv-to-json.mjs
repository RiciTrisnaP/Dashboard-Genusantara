// Converts data/evidence_check.csv to data/evidence_check.json.
// Run once after the CSV changes: `npm run data:convert`.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "data", "evidence_check.csv");
const out = join(root, "data", "evidence_check.json");

/** Minimal RFC 4180 parser: quoted fields, escaped quotes, commas inside quotes. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Empty, "-" and "not found"-style cells become null so the UI can say "tidak ada". */
function clean(value) {
  const v = value.trim();
  if (v === "" || v === "-") return null;
  return v;
}

const [header, ...body] = parseCsv(readFileSync(src, "utf8"));
const records = body.map((cells) => {
  const raw = Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
  const level = raw.oncokb_highest_level_breast.trim();
  const civicMp = clean(raw.civic_mp);
  const clinvar = clean(raw.clinvar_vcv);
  return {
    variant: raw.variant.trim(),
    oncokb: {
      oncogenicity: raw.oncokb_oncogenicity.trim(),
      highestLevelBreast: /^\d[AB]?$/.test(level) ? level : null,
      levelNote: /^\d[AB]?$/.test(level) ? null : level,
      drugsBreast: clean(raw.oncokb_drugs_breast),
      link: clean(raw.oncokb_link),
    },
    civic: {
      molecularProfile: civicMp && civicMp.startsWith("MP") ? civicMp : null,
      note: civicMp && !civicMp.startsWith("MP") ? civicMp : null,
      bestPredictiveAny: clean(raw.civic_best_predictive_any),
      bestPredictiveBreast: clean(raw.civic_best_predictive_breast),
      link: clean(raw.civic_link),
    },
    clinvar: {
      vcv: clinvar && clinvar.startsWith("VCV") ? clinvar : null,
      note: clinvar && !clinvar.startsWith("VCV") ? clinvar : null,
      oncogenicity: clean(raw.clinvar_oncogenicity),
      somaticImpact: clean(raw.clinvar_somatic_impact),
      link: clean(raw.clinvar_link),
    },
    checked: raw.checked.trim(),
  };
});

writeFileSync(
  out,
  JSON.stringify(
    {
      _note: "Dibuat otomatis dari evidence_check.csv oleh scripts/csv-to-json.mjs. Jangan edit manual.",
      source: "OncoKB v7.6 (data 30 Sep 2026), CIViC dan ClinVar",
      checkedDate: "2026-10-23",
      variants: records,
    },
    null,
    1,
  ) + "\n",
);
console.log(`Wrote ${records.length} variants to ${out}`);
