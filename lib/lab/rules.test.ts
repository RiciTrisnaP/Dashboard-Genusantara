import { describe, expect, it } from "vitest";
import { getPatient, panel, patients } from "../data";
import { runCase } from "../rules";
import { getLabSample, lab } from "./data";
import {
  delayNote,
  evaluateLabS2,
  icStatus,
  labGates,
  labReflexOptions,
  medianTat,
  overallStatus,
  reactionResults,
  reactions,
  resultSummary,
  retestPct,
  reviewNote,
  runSizeWarning,
  sentinelNote,
  sortForSentinel,
  suggestedRejectReason,
  workdaysBetween,
} from "./rules";
import type { LabSample } from "./types";

const T = lab.thresholds;
const sample = (code: string): LabSample => {
  const s = getLabSample(code);
  if (!s) throw new Error(`missing ${code}`);
  return s;
};
const calls = (s: LabSample) => reactionResults(s, panel, T).flatMap((r) => r.targets);

describe("internal control thresholds (demo values)", () => {
  it("<= 32 LULUS, 32 to 35 TINJAU, > 35 TAHAN, missing MENUNGGU", () => {
    expect(icStatus(32, T)).toBe("ok");
    expect(icStatus(32.1, T)).toBe("warn");
    expect(icStatus(35, T)).toBe("warn");
    expect(icStatus(35.1, T)).toBe("bad");
    expect(icStatus(undefined, T)).toBe("wait");
  });
});

describe("reaction grouping", () => {
  it("puts all 11 NUSA11 targets in exactly one of 4 reactions", () => {
    const rx = reactions(panel);
    expect(rx.map((r) => r.id)).toEqual(["R1", "R2", "R3", "R4"]);
    expect(rx.flatMap((r) => r.targets.map((t) => t.id)).sort()).toEqual(panel.targets.map((t) => t.id).sort());
  });

  it("keeps every allele of a codon site in the same reaction", () => {
    for (const t of panel.targets) {
      const sameSite = panel.targets.filter((x) => x.site === t.site);
      expect(new Set(sameSite.map((x) => x.reaction)).size, t.site).toBe(1);
    }
  });
});

describe("S2 specimen check", () => {
  it("passes a good FFPE block", () => {
    expect(evaluateLabS2(sample("NS-2610-041"), T).status).toBe("ok");
  });

  it("waits while the block has not arrived", () => {
    const r = evaluateLabS2(sample("NS-2610-042"), T);
    expect(r.status).toBe("wait");
    expect(r.reasons[0]).toMatch(/belum diterima/);
  });

  it("flags low tumour content and an old block, and suggests the matching reject reason", () => {
    const s = sample("NS-2610-043");
    const r = evaluateLabS2(s, T);
    expect(r.status).toBe("warn");
    expect(r.reasons.join(" ")).toMatch(/Kadar tumor 15%/);
    expect(r.reasons.join(" ")).toMatch(/4 tahun/);
    expect(suggestedRejectReason(s, T)).toMatch(/Kadar tumor kurang dari 20%/);
  });
});

describe("per-target calls: unreadable is never negative", () => {
  it("LULUS sample: detected allele plus 10 tidak terdeteksi", () => {
    const s = sample("NS-2610-025");
    expect(overallStatus(s, panel, T)).toBe("ok");
    const c = calls(s);
    expect(c.filter((x) => x.call === "terdeteksi").map((x) => x.target.id)).toEqual(["PIK3CA E545K"]);
    expect(c.filter((x) => x.call === "tidak_terdeteksi")).toHaveLength(10);
    expect(sentinelNote(s, panel, T)).toBe("Semua kontrol dalam rentang.");
  });

  it("TINJAU reaction: its targets are belum pasti, the detected allele elsewhere stays detected", () => {
    const s = sample("NS-2610-021");
    expect(overallStatus(s, panel, T)).toBe("warn");
    const c = calls(s);
    expect(c.find((x) => x.target.id === "PIK3CA H1047R")?.call).toBe("terdeteksi");
    expect(c.filter((x) => x.call === "belum_pasti").map((x) => x.target.id)).toEqual(["PIK3CA C420R", "ERBB2 L755S", "ERBB2 V777L"]);
    expect(reviewNote(s, panel, T)).toMatch(/^Reaksi 4 .*belum pasti$/);
    expect(sentinelNote(s, panel, T)).toMatch(/belum boleh dibaca sebagai tidak ada mutasi/);
  });

  it("TAHAN (failed reaction): its targets are tidak terbaca, and a weak specimen makes the rest belum pasti", () => {
    const s = sample("NS-2610-024");
    expect(overallStatus(s, panel, T)).toBe("bad");
    const c = calls(s);
    expect(c.filter((x) => x.call === "tidak_terbaca").map((x) => x.target.id)).toEqual(["PIK3CA C420R", "ERBB2 L755S", "ERBB2 V777L"]);
    expect(c.filter((x) => x.call === "tidak_terdeteksi")).toHaveLength(0);
    expect(c.filter((x) => x.call === "belum_pasti")).toHaveLength(8);
    expect(sentinelNote(s, panel, T)).toMatch(/tidak terbaca, bukan negatif/);
    expect(resultSummary(s, panel, T)).not.toMatch(/negatif/i);
  });

  it("gates: S2 TINJAU and S4 TAHAN for the held sample; S5 waits for the pathologist", () => {
    const g = labGates(sample("NS-2610-024"), panel, T);
    expect(g.map((x) => x.status)).toEqual(["ok", "warn", "ok", "bad", "wait"]);
  });

  it("sorts SENTINEL TAHAN, TINJAU, LULUS", () => {
    const list = sortForSentinel(lab.samples.filter((s) => s.stage === "sentinel"), panel, T);
    expect(list.map((s) => s.code)).toEqual(["NS-2610-024", "NS-2610-021", "NS-2610-025"]);
  });

  it("REFLEX for a decalcified bone block suggests a non-bone block and plasma ctDNA", () => {
    const opts = labReflexOptions(sample("NS-2610-024"));
    expect(opts.filter((o) => o.checked).map((o) => o.id)).toEqual(["blok_lain", "ctdna"]);
    expect(opts[0].label).toMatch(/bukan jaringan tulang/);
  });
});

describe("pathologist summary", () => {
  it("says tidak terdeteksi pada 11 target, never negatif", () => {
    expect(resultSummary(sample("NS-2610-019"), panel, T)).toBe("Tidak terdeteksi pada 11 target yang diperiksa.");
    expect(resultSummary(sample("NS-2610-018"), panel, T)).toBe("AKT1 E17K terdeteksi.");
  });
});

describe("runs and performance", () => {
  it("warns below 6 samples per run, not at 0 or 6", () => {
    expect(runSizeWarning(0, 6)).toBeNull();
    expect(runSizeWarning(2, 6)).toMatch(/^Baru 2 sampel/);
    expect(runSizeWarning(6, 6)).toBeNull();
  });

  it("counts working days, skipping the weekend", () => {
    expect(workdaysBetween("2026-10-20", "2026-10-26")).toBe(4);
    expect(workdaysBetween("2026-10-23", "2026-10-26")).toBe(1);
  });

  it("matches the mockup KPIs: median 6 days, 9% retests, two late samples with one cause", () => {
    expect(medianTat(lab.released)).toBe(6);
    expect(retestPct(lab.month.retests, lab.month.samples)).toBe(9);
    expect(delayNote(lab.released, lab.pricing.tatTargetDays)).toMatch(/^2 sampel di atas target sama-sama tertunda karena run diundur/);
  });
});

describe("one sample code across the doctor, lab, and navigator dashboards", () => {
  const known = new Set([...lab.samples.map((s) => s.code), ...lab.released.map((r) => r.code)]);

  it("every tested demo patient has a sample code the lab knows", () => {
    for (const p of patients) {
      if (!p.molecularTest.done) continue;
      expect(p.molecularTest.sampleCode, p.id).toBeDefined();
      expect(known.has(p.molecularTest.sampleCode!), p.id).toBe(true);
    }
  });

  it("lab links point back to the patient carrying that code", () => {
    for (const s of [...lab.samples, ...lab.released]) {
      if (!s.patientId) continue;
      const p = getPatient(s.patientId);
      expect(p?.molecularTest.done && p.molecularTest.sampleCode, s.code).toBe(s.code);
    }
  });

  it("Ibu F / NS-2610-024: the lab's unreadable targets equal the doctor's SENTINEL", () => {
    const f = runCase(getPatient("F")!);
    expect(f.sentinel.tested && f.sentinel.verdict).toBe("TAHAN");
    const unread = calls(sample("NS-2610-024"))
      .filter((x) => x.call === "tidak_terbaca")
      .map((x) => x.target.id);
    expect(f.sentinel.tested && f.sentinel.s3.unreadable).toEqual(unread);
  });
});
