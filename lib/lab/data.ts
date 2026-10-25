import labJson from "@/data/lab.json";
import type { LabFile, LabSample } from "./types";

export const lab = labJson as LabFile;

export function getLabSample(code: string): LabSample | undefined {
  return lab.samples.find((s) => s.code === code);
}
