"use client";

import { createContext, useContext, useMemo, useRef, useState } from "react";
import { panel } from "@/lib/data";
import { lab } from "@/lib/lab/data";
import { reviewNote, workdaysBetween } from "@/lib/lab/rules";
import type { LabSample, ReleasedSample } from "@/lib/lab/types";

// Session-only state for the lab demo. Nothing is stored; a reload starts from data/lab.json.
interface LabState {
  samples: LabSample[];
  runB: string[];
  released: ReleasedSample[];
  /** Note printed with the result when a TINJAU sample is forwarded instead of repeated. */
  notes: Record<string, string>;
  reminded: Record<string, boolean>;
  rejected: Record<string, string>;
  advice: Record<string, string[]>;
  retests: number;
  runDone: boolean;
}

export interface Toast {
  id: number;
  text: string;
  link?: { href: string; label: string };
}

interface LabApi {
  state: LabState;
  byStage: (...stages: LabSample["stage"][]) => LabSample[];
  toast: Toast | null;
  accept: (code: string) => void;
  reject: (code: string, reason: string) => void;
  remind: (code: string) => void;
  addToRunB: (code: string) => void;
  finishRun: () => void;
  sendToPathologist: (code: string) => void;
  repeatReactions: (code: string, labels: string[]) => void;
  hold: (code: string, advice: string[]) => void;
  release: (code: string) => void;
  returnToAnalyst: (code: string) => void;
}

const LabContext = createContext<LabApi | null>(null);

export function LabProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LabState>(() => ({
    samples: lab.samples,
    runB: [],
    released: lab.released,
    notes: {},
    reminded: {},
    rejected: {},
    advice: {},
    retests: 0,
    runDone: false,
  }));
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const api = useMemo<LabApi>(() => {
    const say = (text: string, link?: Toast["link"]) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ id: Date.now(), text, link });
      timer.current = setTimeout(() => setToast(null), link ? 7000 : 3500);
    };
    const patch = (code: string, change: Partial<LabSample>) => (s: LabState): LabState => ({
      ...s,
      samples: s.samples.map((x) => (x.code === code ? { ...x, ...change } : x)),
    });
    const find = (code: string) => state.samples.find((x) => x.code === code);

    return {
      state,
      toast,
      byStage: (...stages) => state.samples.filter((x) => stages.includes(x.stage)),
      accept: (code) => {
        setState(patch(code, { stage: "antri" }));
        say(`${code} diterima dan masuk antrian run. Dokter dan perawat melihat: sampel diterima lab.`);
      },
      reject: (code, reason) => {
        setState((s) => ({ ...patch(code, { stage: "ditolak" })(s), rejected: { ...s.rejected, [code]: reason } }));
        say(`${code} ditolak. Alasan dikirim ke dokter peminta lewat Genusa.`);
      },
      remind: (code) => {
        setState((s) => ({ ...s, reminded: { ...s.reminded, [code]: true } }));
        say(`Pengingat kirim blok untuk ${code} terkirim ke patologi ${find(code)?.sender ?? "RS pengirim"}.`);
      },
      addToRunB: (code) => {
        setState((s) => ({ ...patch(code, { stage: "run_b" })(s), runB: [...s.runB, code] }));
        say(`${code} masuk draf ${lab.run.next.id}.`);
      },
      finishRun: () => {
        setState((s) => ({
          ...s,
          runDone: true,
          samples: s.samples.map((x) => (x.stage === "run" ? { ...x, stage: "sentinel", run: lab.run.current.id } : x)),
        }));
        say(`${lab.run.current.id} selesai. Hasil masuk gerbang mutu SENTINEL.`);
      },
      sendToPathologist: (code) => {
        const x = find(code);
        const note = x ? reviewNote(x, panel, lab.thresholds) : null;
        setState((s) => ({ ...patch(code, { stage: "patolog" })(s), notes: note ? { ...s.notes, [code]: note } : s.notes }));
        say(note ? `${code} dikirim ke patolog dengan catatan: target terkait tercetak belum pasti.` : `${code} dikirim ke patolog.`);
      },
      repeatReactions: (code, labels) => {
        setState((s) => ({ ...patch(code, { stage: "antri", ic: undefined, detected: undefined })(s), retests: s.retests + 1 }));
        say(`${code}: ${labels.join(", ").toLowerCase()} dijadwalkan ulang dan masuk antrian run. Hanya reaksi itu yang diulang.`);
      },
      hold: (code, advice) => {
        const pid = find(code)?.patientId;
        setState((s) => ({ ...patch(code, { stage: "ditahan" })(s), advice: { ...s.advice, [code]: advice } }));
        say(
          `${code} ditahan. Saran tes lanjutan dikirim ke dokter peminta; dokter yang memutuskan.`,
          pid ? { href: `/pasien/${pid}/reflex`, label: "Lihat yang diterima dokter (alur demo)" } : undefined,
        );
      },
      release: (code) => {
        const x = find(code);
        const pid = x?.patientId;
        setState((s) => ({
          ...patch(code, { stage: "rilis" })(s),
          released: [...s.released, { code, tatDays: x ? workdaysBetween(x.receivedAt, lab.today) : 0 }],
        }));
        say(
          `${code} ditandatangani dan dirilis ke dokter peminta.`,
          pid ? { href: `/pasien/${pid}/laporan`, label: "Lihat laporan di dashboard dokter (alur demo)" } : undefined,
        );
      },
      returnToAnalyst: (code) => {
        setState((s) => {
          const notes = { ...s.notes };
          delete notes[code];
          return { ...patch(code, { stage: "sentinel" })(s), notes };
        });
        say(`${code} dikembalikan ke analis untuk ditinjau ulang.`);
      },
    };
  }, [state, toast]);

  return <LabContext.Provider value={api}>{children}</LabContext.Provider>;
}

export function useLab(): LabApi {
  const ctx = useContext(LabContext);
  if (!ctx) throw new Error("useLab must be used inside LabProvider");
  return ctx;
}
