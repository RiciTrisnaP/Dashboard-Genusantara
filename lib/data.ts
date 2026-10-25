// Static demo data. Everything is bundled at build time; nothing is fetched or stored.
import patientsJson from "@/data/patients.json";
import panelJson from "@/data/panel.json";
import drugAccessJson from "@/data/drug_access.json";
import evidenceJson from "@/data/evidence_check.json";
import type { DrugAccessFile, EvidenceFile, Panel, Patient, PatientsFile } from "./types";

export const patientsData = patientsJson as PatientsFile;
export const panel = panelJson as Panel;
export const drugAccess = drugAccessJson as DrugAccessFile;
export const evidence = evidenceJson as EvidenceFile;

export const patients: Patient[] = patientsData.patients;

export function getPatient(id: string): Patient | undefined {
  return patients.find((p) => p.id === id);
}

/** Lab sample code for a tested demo patient; the same code appears on the lab dashboard. */
export function sampleCodeOf(id: string): string | undefined {
  const test = getPatient(id)?.molecularTest;
  return test?.done ? test.sampleCode : undefined;
}
