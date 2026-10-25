// Guards CLAUDE.md section 6 (forbidden claims) and the no-em-dash rule.
// Scans UI source files and every string the rules produce for the demo patients.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { drugAccess, panel, patients } from "@/lib/data";
import { lab } from "@/lib/lab/data";
import {
  delayNote,
  evaluateLabS2,
  labGates,
  labReflexOptions,
  reactionResults,
  resultSummary,
  reviewNote,
  runSizeWarning,
  sentinelNote,
} from "@/lib/lab/rules";
import { runCase } from "@/lib/rules";

const ROOT = join(__dirname, "..");
const UI_DIRS = ["app", "components", "lib"];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(tsx?|css)$/.test(name) && !/\.test\.ts$|test-helpers\.ts$/.test(name) ? [p] : [];
  });
}

const sourceFiles = UI_DIRS.flatMap((d) => walk(join(ROOT, d)));

/** Every string reachable from the rule results, minus the team's `expected` notes (tests only). */
function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) if (k !== "expected") collectStrings(v, out);
  }
  return out;
}

const ruleText = patients.flatMap((p) => collectStrings(runCase(p))).join("\n");
const dataText = collectStrings([panel, drugAccess]).join("\n");
const T = lab.thresholds;
const labText = collectStrings([
  lab,
  ...lab.samples.map((x) => [
    evaluateLabS2(x, T),
    reactionResults(x, panel, T),
    labGates(x, panel, T),
    sentinelNote(x, panel, T),
    reviewNote(x, panel, T),
    resultSummary(x, panel, T),
    labReflexOptions(x),
  ]),
  delayNote(lab.released, lab.pricing.tatTargetDays),
  runSizeWarning(2, lab.run.minSamples),
]).join("\n");

const corpora: [string, string][] = [
  ...sourceFiles.map((f): [string, string] => [f.replace(ROOT, ""), readFileSync(f, "utf8")]),
  ["rule output", ruleText],
  ["panel and drug access data", dataText],
  ["lab data and lab rule output", labText],
];

/** CLAUDE.md section 6, as patterns. Negated statements ("tidak mencakup ... secara utuh") are allowed. */
const FORBIDDEN: [string, RegExp][] = [
  ["prevalence from synthetic data", /prevalensi\s+(di\s+)?(asia|indonesia)/i],
  ["NUSA-15 better than WEST-15", /NUSA-15[^.\n]{0,40}(lebih (baik|unggul|akurat|tinggi)|mengungguli|superior)/i],
  ["NUSA-15 better than WEST-15", /(lebih (baik|unggul|akurat)|mengungguli)[^.\n]{0,40}WEST-15/i],
  ["full BRCA/PTEN coverage", /(?<!tidak\s+)mencakup[^.\n]{0,30}(BRCA|PTEN)[^.\n]{0,30}(secara )?(utuh|penuh|lengkap)/i],
  ["tumour variant called inherited", /(varian|mutasi)( (tumor|ini|di tumor ini))? (adalah|bersifat|merupakan) (germline|bawaan|turunan)/i],
  ["therapy-relevant equated with prescribable", /(?<!(tidak|belum)\s+)(bisa|dapat)\s+diresepkan/i],
  ["unreadable called negative", /tidak (terbaca|dinilai)[^.\n]{0,40}(=|berarti|dianggap|adalah)\s*negatif/i],
  ["negatif total", /negatif total/i],
  ["assay clinically ready", /(siap (dipakai )?(secara )?klinis|clinically ready|tervalidasi klinis|siap untuk klinik)/i],
  ["named partner institution", /\b(mitra|bermitra|kerja sama dengan)\b/i],
  ["named hospital", /\b(RSUP|RSUD|RSCM|Rumah Sakit)\b/],
];

describe("UI text", () => {
  it("scans a meaningful amount of text", () => {
    expect(sourceFiles.length).toBeGreaterThan(15);
    expect(ruleText.length).toBeGreaterThan(5000);
  });

  it.each(corpora)("%s has no em dash", (_name, text) => {
    expect(text.includes("—")).toBe(false);
  });

  for (const [label, pattern] of FORBIDDEN) {
    it(`no forbidden claim: ${label} (${pattern.source.slice(0, 30)}...)`, () => {
      const hits = corpora.filter(([, text]) => pattern.test(text)).map(([name, text]) => `${name}: ${text.match(pattern)?.[0]}`);
      expect(hits).toEqual([]);
    });
  }

  it("the forbidden patterns actually catch violations", () => {
    const samples = [
      "Prevalensi Indonesia 32%",
      "NUSA-15 lebih baik dari WEST-15",
      "Panel mencakup BRCA1/2 secara utuh",
      "Varian ini bersifat bawaan",
      "Obat ini bisa diresepkan",
      "Hasil negatif total",
      "Assay siap dipakai klinis",
    ];
    for (const s of samples) expect(FORBIDDEN.some(([, p]) => p.test(s)), s).toBe(true);
    expect(FORBIDDEN.some(([, p]) => p.test("Panel hotspot tidak mencakup PTEN dan BRCA1/2 secara utuh."))).toBe(false);
  });

  it("every screen carries the simulation notice in the shared footer (team decision 26 Oct 2026)", () => {
    const layout = readFileSync(join(ROOT, "app/layout.tsx"), "utf8");
    const footer = readFileSync(join(ROOT, "components/SiteFooter.tsx"), "utf8");
    expect(layout).toContain("<SiteFooter />");
    expect(footer).toContain("SIMULASI, bukan untuk keputusan klinis");
    expect(footer).toContain("Tidak ada data yang disimpan");
  });
});
