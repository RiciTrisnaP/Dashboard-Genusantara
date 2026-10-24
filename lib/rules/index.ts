// Runs every rule for one patient. The UI renders only what this returns.
import { drugAccess, evidence, panel } from "../data";
import type { Patient } from "../types";
import { evaluateReflex } from "./reflex";
import { evaluateSentinel } from "./sentinel";
import { buildPatientSummary } from "./summary";
import { evaluateTriase } from "./triase";
import { evaluateTrigger } from "./trigger";

export function runCase(patient: Patient) {
  const trigger = evaluateTrigger(patient, panel);
  const sentinel = evaluateSentinel(patient, panel);
  const reflex = evaluateReflex(patient, sentinel, panel);
  const triase = evaluateTriase(sentinel, patient.clinical, evidence.variants, drugAccess);
  const summary = buildPatientSummary(patient, panel, sentinel, reflex, triase);
  return { patient, trigger, sentinel, reflex, triase, summary };
}

export type CaseResult = ReturnType<typeof runCase>;
