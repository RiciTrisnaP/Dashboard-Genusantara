"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui";
import { navigator } from "@/lib/navigator/data";
import { canSendWhatsApp, flagCheckin, LEMAS_LABEL } from "@/lib/navigator/rules";
import type { CheckinAnswers, Channel, Lemas, Ruam } from "@/lib/navigator/types";
import { navBtnPink, shortNav } from "./bits";
import { useNavigator } from "./NavigatorProvider";

const SOURCES: { id: Extract<Channel, "whatsapp" | "telepon" | "tatap_muka">; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "telepon", label: "Telepon" },
  { id: "tatap_muka", label: "Tatap muka" },
];

const field = "mt-1 block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base focus:border-primary focus:outline-none";

/** Records a symptom check-in (complaints and side effects) reported by the patient or family. */
export function CheckinForm({ fixedPatientId, onSaved }: { fixedPatientId?: string; onSaved?: (id: string) => void }) {
  const { addCheckin, logContact, patient } = useNavigator();
  const candidates = navigator.patients.filter((p) => p.journey !== "selesai");
  const [pid, setPid] = useState(fixedPatientId ?? "");
  const [source, setSource] = useState<(typeof SOURCES)[number]["id"]>("telepon");
  const [hasFever, setHasFever] = useState(false);
  const [temp, setTemp] = useState("");
  const [lemas, setLemas] = useState<Lemas>(0);
  const [diare, setDiare] = useState("0");
  const [ruam, setRuam] = useState<Ruam>("tidak");
  const [haus, setHaus] = useState(false);
  const [keluhan, setKeluhan] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState("");

  const p = pid ? patient(pid) : undefined;
  const waAllowed = p ? canSendWhatsApp(p).ok : true;
  const tempNum = Number(temp.replace(",", "."));
  const diareNum = Number(diare);
  const answers: CheckinAnswers = {
    demamC: hasFever && temp !== "" && Number.isFinite(tempNum) ? tempNum : null,
    lemas,
    diarePerHari: Number.isInteger(diareNum) && diareNum >= 0 ? diareNum : 0,
    ruam,
    sangatHaus: haus,
  };
  const preview = flagCheckin(answers);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!pid) errs.pid = "Pilih pasien dulu.";
    if (hasFever && (temp === "" || !Number.isFinite(tempNum) || tempNum < 34 || tempNum > 43)) errs.temp = "Isi suhu antara 34 dan 43 °C.";
    if (!/^\d+$/.test(diare) || diareNum > 30) errs.diare = "Isi jumlah diare per hari (0 sampai 30).";
    if (source === "whatsapp" && !waAllowed) errs.source = "Belum ada persetujuan kontak WhatsApp; pilih sumber lain.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const c = addCheckin({ patientId: pid, answers, keluhan: keluhan.trim() });
    logContact(pid, source, `Check-in gejala dicatat (${flagCheckin(answers).label.toLowerCase()})${keluhan.trim() ? `: "${keluhan.trim()}"` : "."}`);
    setSaved(`Check-in tersimpan dan ditandai "${flagCheckin(answers).label}".`);
    setHasFever(false);
    setTemp("");
    setLemas(0);
    setDiare("0");
    setRuam("tidak");
    setHaus(false);
    setKeluhan("");
    onSaved?.(c.id);
  }

  const clear = (k: string) => setErrors((e) => {
    const { [k]: _drop, ...rest } = e;
    void _drop;
    return rest;
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Catat keluhan dan efek samping</h2>
        <StatusBadge tone={preview.tone} size="md">
          {preview.label}
        </StatusBadge>
      </div>
      <p className="text-sm text-ink-3">
        Isi sesuai jawaban pasien atau keluarga. Penandaan otomatis memakai ambang demo; sesuaikan dengan SOP eskalasi RS.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {!fixedPatientId && (
          <label className="block text-sm font-semibold">
            Pasien
            <select value={pid} onChange={(e) => { setPid(e.target.value); clear("pid"); }} className={field}>
              <option value="">Pilih pasien</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {shortNav(c)}
                </option>
              ))}
            </select>
            {errors.pid && <span className="mt-1 block font-normal text-bad">{errors.pid}</span>}
          </label>
        )}
        <fieldset className="text-sm font-semibold">
          <legend>Sumber laporan</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {SOURCES.map((s) => {
              const disabled = s.id === "whatsapp" && !waAllowed;
              return (
                <label
                  key={s.id}
                  className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 font-medium ${
                    source === s.id ? "border-primary bg-primary-soft" : "border-line"
                  } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <input type="radio" name="source" value={s.id} checked={source === s.id} disabled={disabled} onChange={() => { setSource(s.id); clear("source"); }} />
                  {s.label}
                </label>
              );
            })}
          </div>
          {!waAllowed && <span className="mt-1 block font-normal text-ink-3">WhatsApp nonaktif: belum ada persetujuan kontak.</span>}
          {errors.source && <span className="mt-1 block font-normal text-bad">{errors.source}</span>}
        </fieldset>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="text-sm font-semibold">
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={hasFever} onChange={(e) => { setHasFever(e.target.checked); clear("temp"); }} className="size-5" />
            Demam
          </label>
          {hasFever && (
            <label className="block">
              Suhu (°C)
              <input inputMode="decimal" value={temp} onChange={(e) => { setTemp(e.target.value); clear("temp"); }} placeholder="38,5" className={field} />
            </label>
          )}
          {errors.temp && <span className="mt-1 block font-normal text-bad">{errors.temp}</span>}
        </div>
        <label className="block text-sm font-semibold">
          Lemas
          <select value={lemas} onChange={(e) => setLemas(Number(e.target.value) as Lemas)} className={field}>
            {LEMAS_LABEL.map((l, i) => (
              <option key={l} value={i}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Diare (kali per hari)
          <input inputMode="numeric" value={diare} onChange={(e) => { setDiare(e.target.value); clear("diare"); }} className={field} />
          {errors.diare && <span className="mt-1 block font-normal text-bad">{errors.diare}</span>}
        </label>
        <fieldset className="text-sm font-semibold">
          <legend>Ruam kulit</legend>
          <div className="mt-1 flex gap-2">
            {(["tidak", "ringan", "luas"] as Ruam[]).map((r) => (
              <label key={r} className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 font-medium capitalize ${ruam === r ? "border-primary bg-primary-soft" : "border-line"}`}>
                <input type="radio" name="ruam" value={r} checked={ruam === r} onChange={() => setRuam(r)} className="sr-only" />
                {r}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold sm:mt-6">
          <input type="checkbox" checked={haus} onChange={(e) => setHaus(e.target.checked)} className="size-5" />
          Sangat haus atau sering buang air kecil
        </label>
      </div>

      <label className="block text-sm font-semibold">
        Keluhan atau efek samping lain (kata-kata pasien)
        <textarea value={keluhan} onChange={(e) => setKeluhan(e.target.value)} rows={3} placeholder="Contoh: mual setelah minum obat pagi, sariawan, sulit tidur" className={field} />
      </label>

      {preview.flag !== "normal" && (
        <p className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${preview.flag === "mendesak" ? "bg-bad-bg text-bad" : "bg-warn-bg text-warn"}`}>
          {preview.label}: {preview.reasons.join(", ")}.
          {preview.flag === "mendesak" ? " Setelah disimpan, eskalasikan ke dokter jaga." : ""}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={navBtnPink}>
          Simpan check-in
        </button>
        {saved && <span className="text-sm font-semibold text-ok">{saved}</span>}
      </div>
    </form>
  );
}
