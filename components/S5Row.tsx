"use client";

import { evaluateS5, type Verdict } from "@/lib/rules/sentinel";
import { LayerRow } from "./LayerRow";
import { useSignOff } from "./SignOffProvider";

export function S5Row({ patientId, verdict, accessCheckedDate }: { patientId: string; verdict: Verdict; accessCheckedDate: string }) {
  const { signed } = useSignOff(patientId);
  return <LayerRow layer={evaluateS5(verdict, signed, accessCheckedDate)} />;
}
