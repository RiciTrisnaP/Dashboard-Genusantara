import navigatorJson from "@/data/navigator.json";
import type { NavigatorFile, NavPatient } from "./types";

export const navigator = navigatorJson as NavigatorFile;

export function getNavPatient(id: string): NavPatient | undefined {
  return navigator.patients.find((p) => p.id === id);
}
