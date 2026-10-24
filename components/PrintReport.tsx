// One-page A4 version of the Laporan Pilih Terapi. Rendered only in print (hidden on screen).
import type { CaseResult } from "@/lib/rules";
import { describeSpecimen } from "@/lib/rules/sentinel";
import { GROUP_TITLES, type TherapyGroupId, type TherapyOption } from "@/lib/rules/triase";
import { formatNumber } from "@/lib/format";
import { shortName } from "./CaseHeader";
import { PrintStatusBadge, SignatureBlock } from "./ReportControls";
import { capitalize } from "./TherapyGroup";
import { statusText } from "./ui";

const GROUP_FRAME: Record<TherapyGroupId, string> = {
  A: "border-ok-line",
  B: "border-warn-line",
  C: "border-line",
};
const GROUP_HEAD: Record<TherapyGroupId, string> = { A: "text-ok", B: "text-warn", C: "text-ink-2" };

function optionLine(o: TherapyOption, group: TherapyGroupId): string {
  const name = `${capitalize(o.regimen)}${o.brand ? ` (${o.brand})` : ""}${o.level ? ` (Level ${o.level})` : ""}`;
  if (group === "C") return `${name}: ${o.reason} BPOM: ${o.bpom.label}; ${o.jkn.label}. Dicek ${o.accessCheckedDate}.`;
  // A price reads on into its unit ("Rp87.025.221 per boks ..."); any other market detail goes in brackets.
  const market = o.market.detail ? (o.price != null ? `${o.market.label} ${o.market.detail}` : `${o.market.label} (${o.market.detail})`) : o.market.label;
  return `${name}: ${o.bpom.label}${o.bpom.detail ? ` ${o.bpom.detail}` : ""}; ${o.jkn.label}; ${market}. Dicek ${o.accessCheckedDate}.${
    o.isFallback ? ` ${o.statusLabel}.` : ""
  }`;
}

export function PrintReport({ result }: { result: CaseResult }) {
  const { patient, sentinel, triase, reflex } = result;
  if (!triase.issued || !sentinel.tested || !patient.molecularTest.done) return null;
  const test = patient.molecularTest;
  const c = patient.clinical;
  const facts: [string, string][] = [
    ["Pasien", `${patient.displayName}, ${patient.age} th`],
    ["Subtipe", c.subtype ?? "-"],
    ["Stadium", `${c.stage} (${c.setting})`],
    ["Terapi sebelumnya", c.priorTherapies?.join("; ") ?? "-"],
    ["Spesimen", describeSpecimen(test.specimen)],
  ];

  return (
    <article className="hidden text-[8pt] leading-snug text-ink print:block">
      <header className="flex items-start justify-between border-b-2 border-ink pb-1.5">
        <div>
          <p className="text-[8pt] text-primary">Genusa · tepat obatnya, tuntas terapinya</p>
          <h1 className="text-[16pt] font-bold">Laporan Pilih Terapi</h1>
        </div>
        <div className="text-right">
          <PrintStatusBadge patientId={patient.id} />
          <p className="mt-0.5 font-mono text-[7pt] text-ink-3">LPT-SIM-{patient.id}</p>
        </div>
      </header>

      <dl className="mt-2 grid grid-cols-[1.4fr_0.8fr_0.9fr_1.5fr_1.6fr] divide-x divide-line rounded border border-line">
        {facts.map(([k, v]) => (
          <div key={k} className="px-2 py-1">
            <dt className="text-[6.5pt] text-ink-3 uppercase">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-2.5 text-[8.5pt] font-bold tracking-wide text-primary-strong uppercase">1 Status mutu dan target yang tidak dinilai</h2>
      <p className="mt-0.5">
        <strong className="text-ok">SENTINEL: {statusText(sentinel.verdict)}</strong> {sentinel.s3.readableCount} dari{" "}
        {sentinel.s3.totalTargets} target terbaca. Target tidak dinilai:{" "}
        {triase.notAssessed.length ? triase.notAssessed.join(", ") : "tidak ada"}. {sentinel.reason}
        {sentinel.s1.status !== "LAYAK" && ` Catatan S1: ${sentinel.s1.reason}`}
      </p>

      <h2 className="mt-2.5 text-[8.5pt] font-bold tracking-wide text-primary-strong uppercase">
        2 Varian terdeteksi di {test.specimen.type === "plasma_ctDNA" ? "plasma (ctDNA)" : "jaringan tumor"}
      </h2>
      {triase.noActionableText && <p className="mt-0.5 font-semibold">{triase.noActionableText}</p>}
      {triase.findings.length > 0 && (
        <table className="mt-1 w-full border border-line text-left">
          <thead className="text-[6.5pt] text-ink-3 uppercase">
            <tr>
              <th className="px-2 py-0.5 font-medium">Varian</th>
              <th className="px-2 py-0.5 font-medium">VAF</th>
              <th className="px-2 py-0.5 font-medium">OncoKB</th>
              <th className="px-2 py-0.5 font-medium">Tingkat</th>
              <th className="px-2 py-0.5 font-medium">CIViC</th>
              <th className="px-2 py-0.5 font-medium">ClinVar</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {triase.findings.map(({ readout, evidence }) => (
              <tr key={readout.key} className="border-t border-line">
                <td className="bg-primary-soft px-2 py-0.5 font-semibold">{readout.key}</td>
                <td className="px-2 py-0.5">{formatNumber(readout.variant.vaf)}%</td>
                <td className="px-2 py-0.5">{evidence.record?.oncokb.oncogenicity ?? "-"}</td>
                <td className="px-2 py-0.5">{evidence.record?.oncokb.highestLevelBreast ? `Level ${evidence.record.oncokb.highestLevelBreast}` : "-"}</td>
                <td className="px-2 py-0.5">{evidence.record?.civic.molecularProfile ?? "-"}</td>
                <td className="px-2 py-0.5">{evidence.record?.clinvar.vcv ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="mt-2.5 text-[8.5pt] font-bold tracking-wide text-primary-strong uppercase">3 Pilihan terapi</h2>
      <div className="mt-1 space-y-1.5">
        {(["A", "B", "C"] as const).map((g) => (
          <div key={g} className={`avoid-break rounded border px-2 py-1 ${GROUP_FRAME[g]}`}>
            <p className={`font-semibold ${GROUP_HEAD[g]}`}>
              ({g.toLowerCase()}) {GROUP_TITLES[g]}
            </p>
            {triase.groups[g].length === 0 ? (
              <p className="text-ink-3">Tidak ada.</p>
            ) : (
              triase.groups[g].map((o) => (
                <p key={o.drug} className="mt-0.5">
                  {optionLine(o, g)}
                </p>
              ))
            )}
            {g === "A" && triase.groups.A.length > 0 && (
              <p className="mt-0.5 text-[7pt] text-ink-3">
                Pilihan untuk dibahas, bukan resep. Kelayakan pasien dan ketersediaan stok dikonfirmasi oleh dokter.
              </p>
            )}
          </div>
        ))}
      </div>

      <h2 className="mt-2.5 text-[8.5pt] font-bold tracking-wide text-primary-strong uppercase">
        4 Saran REFLEX (butuh persetujuan dokter)
      </h2>
      {reflex.items.length === 0 ? (
        <p className="mt-0.5 text-ink-3">Tidak ada saran tes lanjutan dari aturan.</p>
      ) : (
        <ol className="mt-0.5 list-decimal space-y-0.5 pl-4">
          {reflex.items.map((i) => (
            <li key={i.id}>{i.advice.join(" ")}</li>
          ))}
        </ol>
      )}

      <div className="mt-2.5 h-[28mm] rounded border border-line px-2 py-1">
        <p className="text-[6.5pt] text-ink-3 uppercase">Catatan dokter</p>
      </div>

      <div className="mt-2.5">
        <SignatureBlock patientId={patient.id} reportId={`LPT-SIM-${patient.id}`} />
      </div>

      <footer className="mt-2 border-t border-line pt-1">
        <p className="font-semibold">{triase.footer}</p>
        <p className="text-[6.5pt] text-ink-3">
          Versi bukti: {triase.evidenceVersion} · {shortName(patient.displayName)} adalah pasien simulasi · Tidak ada data yang
          disimpan · Halaman 1 dari 1
        </p>
      </footer>
    </article>
  );
}
