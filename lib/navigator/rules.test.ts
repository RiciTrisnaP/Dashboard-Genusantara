import { describe, expect, it } from "vitest";
import { patients } from "../data";
import { getNavPatient, navigator } from "./data";
import {
  addWorkdays,
  canHandOverSummary,
  canSendWhatsApp,
  contactsInMonth,
  flagCheckin,
  gateView,
  groupTasks,
  isOverdue,
  median,
  MESSAGE_TEMPLATES,
  openUrgentCount,
  sortCheckins,
  stageIndex,
} from "./rules";
import type { CheckinAnswers } from "./types";

const calm: CheckinAnswers = { demamC: null, lemas: 0, diarePerHari: 0, ruam: "tidak", sangatHaus: false };

function nav(id: string) {
  const p = getNavPatient(id);
  if (!p) throw new Error(`navigator patient ${id} missing`);
  return p;
}

describe("navigator data", () => {
  it("links patients A to F to the doctor-side data and keeps G and H navigator-only", () => {
    const doctorIds = patients.map((p) => p.id);
    for (const p of navigator.patients) {
      if (doctorIds.includes(p.id)) expect(p.gate).toBeUndefined();
      else expect(p.gate).toBeDefined();
    }
    expect(navigator.patients.map((p) => p.id)).toEqual(["A", "B", "C", "D", "E", "F", "G", "H"]);
  });

  it("every task and check-in points to a known patient", () => {
    const ids = new Set(navigator.patients.map((p) => p.id));
    for (const t of navigator.tasks) expect(ids.has(t.patientId)).toBe(true);
    for (const c of navigator.checkins) expect(ids.has(c.patientId)).toBe(true);
  });
});

describe("check-in flagging", () => {
  it("normal when nothing is reported", () => {
    expect(flagCheckin(calm).flag).toBe("normal");
  });

  it("fever of 38 °C or more, 7+ diarrhoea a day, widespread rash or severe weakness is urgent", () => {
    expect(flagCheckin({ ...calm, demamC: 38.0 }).flag).toBe("mendesak");
    expect(flagCheckin({ ...calm, diarePerHari: 7 }).flag).toBe("mendesak");
    expect(flagCheckin({ ...calm, ruam: "luas" }).flag).toBe("mendesak");
    expect(flagCheckin({ ...calm, lemas: 3 }).flag).toBe("mendesak");
  });

  it("borderline signs are 'perlu dipantau'", () => {
    expect(flagCheckin({ ...calm, demamC: 37.6 }).flag).toBe("dipantau");
    expect(flagCheckin({ ...calm, diarePerHari: 4 }).flag).toBe("dipantau");
    expect(flagCheckin({ ...calm, ruam: "ringan" }).flag).toBe("dipantau");
    expect(flagCheckin({ ...calm, lemas: 2 }).flag).toBe("dipantau");
    expect(flagCheckin({ ...calm, sangatHaus: true }).flag).toBe("dipantau");
    expect(flagCheckin({ ...calm, diarePerHari: 3 }).flag).toBe("normal");
  });

  it("urgent reasons are listed first and keep the watch signs", () => {
    const r = flagCheckin({ demamC: 38.6, lemas: 2, diarePerHari: 7, ruam: "ringan", sangatHaus: true });
    expect(r.label).toBe("Mendesak");
    expect(r.reasons).toEqual(["Demam 38,6°C", "Diare 7 kali sehari", "Ruam ringan", "Lemas sedang", "Sangat haus"]);
  });

  it("the seeded data has exactly one open urgent check-in (Ibu G today) and it sorts first", () => {
    expect(openUrgentCount(navigator.checkins)).toBe(1);
    expect(sortCheckins(navigator.checkins)[0].id).toBe("ci-g2");
    const escalated = navigator.checkins.map((c) => (c.id === "ci-g2" ? { ...c, escalatedAt: "2026-10-26T10:20" } : c));
    expect(openUrgentCount(escalated)).toBe(0);
  });
});

describe("test status for the nurse (no variant data)", () => {
  it("follows SENTINEL for doctor-side patients", () => {
    expect(gateView(nav("A")).label).toBe("Lulus mutu");
    expect(gateView(nav("E")).status).toBe("belum_dites");
    const f = gateView(nav("F"));
    expect(f.status).toBe("ditahan");
    expect(f.warning).toBe('Hasil tidak boleh dibaca sebagai "tidak ada mutasi".');
    expect(f.next).toMatch(/menunggu persetujuan dokter/);
  });

  it("uses the stored gate for navigator-only patients", () => {
    expect(gateView(nav("G"))).toMatchObject({ status: "lulus", detail: "11 dari 11 target terbaca." });
  });

  it("never exposes variant names", () => {
    for (const p of navigator.patients) {
      const g = gateView(p);
      expect(`${g.label} ${g.detail} ${g.next ?? ""}`).not.toMatch(/H1047|E545|E542|C420|N345|E17K|L755|V777/);
    }
  });
});

describe("safety locks", () => {
  it("WhatsApp is locked without recorded consent", () => {
    expect(canSendWhatsApp(nav("A")).ok).toBe(true);
    expect(canSendWhatsApp(nav("B")).ok).toBe(false);
    expect(canSendWhatsApp(nav("B")).reason).toMatch(/telepon/);
  });

  it("summary hand-over only after the doctor releases it", () => {
    expect(canHandOverSummary("dirilis").ok).toBe(true);
    expect(canHandOverSummary("menunggu_dokter").ok).toBe(false);
    expect(canHandOverSummary("belum_ada").ok).toBe(false);
    expect(canHandOverSummary("diserahkan").ok).toBe(false);
  });

  it("message templates never carry result content", () => {
    for (const t of MESSAGE_TEMPLATES) {
      const text = t.body(nav("A"));
      expect(text).not.toMatch(/PIK3CA|AKT1|ERBB2|mutasi|varian|capivasertib|positif|negatif/i);
    }
    expect(MESSAGE_TEMPLATES.find((t) => t.id === "kabar")?.body(nav("A"))).toMatch(/hasil tidak dikirim lewat pesan ini/);
  });
});

describe("tasks and performance", () => {
  it("groups tasks by urgency", () => {
    const g = groupTasks(navigator.tasks);
    expect(g.mendesak.map((t) => t.id)).toEqual(["t-g-checkin"]);
    expect(g.hari_ini.length).toBe(5);
    expect(g.rutin.length).toBe(3);
  });

  it("overdue means open more than 1 working day after the due date", () => {
    expect(addWorkdays("2026-10-22", 1)).toBe("2026-10-23");
    expect(addWorkdays("2026-10-23", 1)).toBe("2026-10-26");
    const late = navigator.tasks.filter((t) => isOverdue(t, navigator.today, false)).map((t) => t.id);
    expect(late).toEqual(["t-c-rujuk"]);
    expect(isOverdue(navigator.tasks.find((t) => t.id === "t-c-rujuk")!, navigator.today, true)).toBe(false);
  });

  it("median response time and monthly contacts", () => {
    expect(median([1, 3, 2])).toBe(2);
    expect(median(navigator.responseTimesHours)).toBe(2.25);
    expect(median([])).toBeNull();
    expect(contactsInMonth(navigator.patients, "2026-10")).toBeGreaterThan(10);
  });

  it("stage line positions", () => {
    expect(stageIndex("menunggu_tes")).toBe(0);
    expect(stageIndex("didampingi")).toBe(3);
    expect(stageIndex("selesai")).toBe(4);
  });
});
