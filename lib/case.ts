import { notFound } from "next/navigation";
import { getPatient } from "./data";
import { runCase } from "./rules";

/** Runs the rules for a route's patient id, or shows the 404 page. */
export function loadCase(id: string) {
  const patient = getPatient(id);
  if (!patient) notFound();
  return runCase(patient);
}
