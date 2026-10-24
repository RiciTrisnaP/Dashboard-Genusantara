"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

// Demo-only state (doctor sign-off, recorded approvals) lives in memory and resets on reload. Nothing is stored.
interface SimState {
  get: (key: string) => string | undefined;
  set: (key: string, value: string | undefined) => void;
}

const SimContext = createContext<SimState | null>(null);

export function SignOffProvider({ children }: { children: React.ReactNode }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const get = useCallback((key: string) => values[key], [values]);
  const set = useCallback((key: string, value: string | undefined) => {
    setValues((prev) => {
      const next = { ...prev };
      if (value === undefined) delete next[key];
      else next[key] = value;
      return next;
    });
  }, []);
  const ctx = useMemo(() => ({ get, set }), [get, set]);
  return <SimContext.Provider value={ctx}>{children}</SimContext.Provider>;
}

function useSim() {
  const ctx = useContext(SimContext);
  if (!ctx) throw new Error("Sim state must be used inside SignOffProvider");
  return ctx;
}

/** "24 Okt 2026, 09.20" in the viewer's local time. */
export function formatStamp(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${hh}.${mm}`;
}

/** A simulated action that records when it happened (sign-off, approval, test request). */
export function useSimAction(key: string) {
  const { get, set } = useSim();
  const at = get(key);
  return {
    done: at !== undefined,
    at,
    record: () => set(key, formatStamp(new Date())),
    undo: () => set(key, undefined),
  };
}

export function useSignOff(patientId: string) {
  const action = useSimAction(`signoff:${patientId}`);
  return { signed: action.done, signedAt: action.at, sign: action.record, unsign: action.undo };
}
