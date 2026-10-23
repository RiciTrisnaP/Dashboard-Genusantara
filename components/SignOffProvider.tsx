"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

// Doctor sign-off lives in memory only, so it resets on reload. Nothing is stored.
interface SignOffState {
  isSigned: (patientId: string) => boolean;
  setSigned: (patientId: string, signed: boolean) => void;
}

const SignOffContext = createContext<SignOffState | null>(null);

export function SignOffProvider({ children }: { children: React.ReactNode }) {
  const [signed, setSignedMap] = useState<Record<string, boolean>>({});
  const isSigned = useCallback((id: string) => signed[id] === true, [signed]);
  const setSigned = useCallback((id: string, value: boolean) => {
    setSignedMap((prev) => ({ ...prev, [id]: value }));
  }, []);
  const value = useMemo(() => ({ isSigned, setSigned }), [isSigned, setSigned]);
  return <SignOffContext.Provider value={value}>{children}</SignOffContext.Provider>;
}

export function useSignOff(patientId: string) {
  const ctx = useContext(SignOffContext);
  if (!ctx) throw new Error("useSignOff must be used inside SignOffProvider");
  return { signed: ctx.isSigned(patientId), setSigned: (v: boolean) => ctx.setSigned(patientId, v) };
}
