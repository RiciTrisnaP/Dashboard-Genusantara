"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { navigator } from "@/lib/navigator/data";
import { flagCheckin } from "@/lib/navigator/rules";
import type {
  Channel,
  Checkin,
  ConsentKind,
  Contact,
  NavPatient,
  ReferralStatus,
  SummaryStatus,
  Task,
} from "@/lib/navigator/types";

// Session-only state for the navigator demo. Nothing is stored; a reload starts from data/navigator.json.
interface NavState {
  done: Record<string, boolean>;
  checkins: Checkin[];
  consents: Record<string, Partial<Record<ConsentKind, "ya">>>;
  summary: Record<string, SummaryStatus>;
  referral: Record<string, ReferralStatus>;
  contacts: Record<string, Contact[]>;
  handoff: Record<string, string>;
  minutes: Record<string, number>;
}

/** Simulated working minutes added per action (feeds the minutes-per-patient bar). */
const MINUTES_PER_ACTION = 5;

function stamp(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${navigator.today}T${hh}:${mm}`;
}

interface NavApi {
  state: NavState;
  patient: (id: string) => NavPatient | undefined;
  isTaskDone: (t: Task) => boolean;
  toggleTask: (id: string) => void;
  escalate: (checkinId: string) => void;
  review: (checkinId: string) => void;
  addCheckin: (c: Omit<Checkin, "id" | "at">) => Checkin;
  recordConsent: (patientId: string, kind: ConsentKind) => void;
  handOver: (patientId: string) => void;
  advanceReferral: (patientId: string) => void;
  logContact: (patientId: string, channel: Channel, text: string) => void;
  saveHandoff: (patientId: string, text: string) => void;
}

const NavContext = createContext<NavApi | null>(null);

export function NavigatorProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NavState>(() => ({
    done: {},
    checkins: navigator.checkins,
    consents: {},
    summary: {},
    referral: {},
    contacts: {},
    handoff: {},
    minutes: {},
  }));

  const addContact = (s: NavState, patientId: string, contact: Contact): NavState => ({
    ...s,
    contacts: { ...s.contacts, [patientId]: [...(s.contacts[patientId] ?? []), contact] },
    minutes: { ...s.minutes, [patientId]: (s.minutes[patientId] ?? 0) + MINUTES_PER_ACTION },
  });

  const patient = useCallback(
    (id: string): NavPatient | undefined => {
      const base = navigator.patients.find((p) => p.id === id);
      if (!base) return undefined;
      return {
        ...base,
        consents: { ...base.consents, ...state.consents[id] },
        summary: state.summary[id] ?? base.summary,
        referral: base.referral ? { ...base.referral, status: state.referral[id] ?? base.referral.status } : null,
        contacts: [...base.contacts, ...(state.contacts[id] ?? [])],
        handoff: state.handoff[id] ?? base.handoff,
        minutesThisMonth: base.minutesThisMonth + (state.minutes[id] ?? 0),
      };
    },
    [state],
  );

  const isTaskDone = useCallback(
    (t: Task) => {
      if (state.done[t.id]) return true;
      if (t.action.kind === "checkin") {
        const id = t.action.checkinId;
        return Boolean(state.checkins.find((c) => c.id === id)?.escalatedAt);
      }
      return false;
    },
    [state],
  );

  const api = useMemo<NavApi>(
    () => ({
      state,
      patient,
      isTaskDone,
      toggleTask: (id) => setState((s) => ({ ...s, done: { ...s.done, [id]: !s.done[id] } })),
      escalate: (checkinId) =>
        setState((s) => {
          const at = stamp();
          const c = s.checkins.find((x) => x.id === checkinId);
          if (!c) return s;
          const reasons = flagCheckin(c.answers).reasons.join(", ");
          const next = { ...s, checkins: s.checkins.map((x) => (x.id === checkinId ? { ...x, escalatedAt: at } : x)) };
          return addContact(next, c.patientId, { at, channel: "eskalasi", text: `Eskalasi ke dokter jaga: ${reasons}. Menunggu arahan dokter.` });
        }),
      review: (checkinId) =>
        setState((s) => ({ ...s, checkins: s.checkins.map((x) => (x.id === checkinId ? { ...x, reviewedAt: stamp() } : x)) })),
      addCheckin: (c) => {
        const created: Checkin = { ...c, id: `ci-${c.patientId.toLowerCase()}-${Date.now()}`, at: stamp() };
        setState((s) => ({ ...s, checkins: [created, ...s.checkins] }));
        return created;
      },
      recordConsent: (patientId, kind) =>
        setState((s) =>
          addContact({ ...s, consents: { ...s.consents, [patientId]: { ...s.consents[patientId], [kind]: "ya" } } }, patientId, {
            at: stamp(),
            channel: "dokumen",
            text: `Persetujuan dicatat dari formulir RS: ${kind === "whatsapp" ? "kontak WhatsApp" : kind}.`,
          }),
        ),
      handOver: (patientId) =>
        setState((s) =>
          addContact({ ...s, summary: { ...s.summary, [patientId]: "diserahkan" } }, patientId, {
            at: stamp(),
            channel: "dokumen",
            text: "Ringkasan hasil diserahkan sebagai dokumen setelah dijelaskan dokter.",
          }),
        ),
      advanceReferral: (patientId) =>
        setState((s) => {
          const base = navigator.patients.find((p) => p.id === patientId)?.referral;
          if (!base) return s;
          const current = s.referral[patientId] ?? base.status;
          const next: ReferralStatus = current === "belum_dirujuk" ? "dirujuk" : "dijadwalkan";
          return addContact({ ...s, referral: { ...s.referral, [patientId]: next } }, patientId, {
            at: stamp(),
            channel: "telepon",
            text: next === "dirujuk" ? `Rujukan dikirim: ${base.type}.` : `Rujukan dijadwalkan: ${base.type}.`,
          });
        }),
      logContact: (patientId, channel, text) => setState((s) => addContact(s, patientId, { at: stamp(), channel, text })),
      saveHandoff: (patientId, text) => setState((s) => ({ ...s, handoff: { ...s.handoff, [patientId]: text } })),
    }),
    [state, patient, isTaskDone],
  );

  return <NavContext.Provider value={api}>{children}</NavContext.Provider>;
}

export function useNavigator(): NavApi {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNavigator must be used inside NavigatorProvider");
  return ctx;
}
