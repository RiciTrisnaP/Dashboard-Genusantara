import { getPatient } from "../data";
import type { Patient } from "../types";
import { runCase } from "./index";

export function patient(id: string): Patient {
  const p = getPatient(id);
  if (!p) throw new Error(`Demo patient ${id} not found`);
  return p;
}

export function run(id: string) {
  return runCase(patient(id));
}

/** Narrow a tested sentinel result or fail the test. */
export function tested(id: string) {
  const r = run(id);
  if (!r.sentinel.tested) throw new Error(`Patient ${id} has no test result`);
  return { ...r, sentinel: r.sentinel };
}

export function issued(id: string) {
  const r = tested(id);
  if (!r.triase.issued) throw new Error(`Patient ${id} has no therapy report`);
  return { ...r, triase: r.triase };
}
