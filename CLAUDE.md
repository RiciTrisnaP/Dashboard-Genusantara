# OnkoTepat x NUSA-15: Prototype Brief for Claude Code

Read this file fully before writing code. Then read `docs/rules_spec.md` and the files in `data/`.
`docs/proposal_onkotepat_x_nusa15.txt` is the team's full proposal (text extracted from the PDF) for background.

## 1. Context in 60 seconds

- Event: GenoHack 2026 (ITB), Team B, Track 1 "Precision Diagnostics Based on Genomics". Hackathon 23 to 25 Oct 2026. Pitch on Sunday 25 Oct, 6 minutes, with a live demo of about 90 seconds.
- Challenge: PathGen industry challenge. Design a compact, low-cost breast cancer mutation panel (max 15 targets, somatic hotspots) for **treatment selection after a confirmed diagnosis**, optimised for Indonesian and Asian patients. Screening and primary diagnosis are out of scope.
- Team product name: **Genusa** (renamed from OnkoTepat on 24 Oct 2026; the source docs still say OnkoTepat) (tagline: "tepat obatnya, tuntas terapinya"). The panel is called **NUSA-15** (Asian-designed) and is compared with **WEST-15** (Western-designed).
- Four modules:
  - **BRIDGE**: picks the 15 panel targets (done in a separate Colab notebook by the bioinformatics teammate, NOT part of this app).
  - **SENTINEL**: quality gate. Decides whether a sample and a test result are fit to read, so "not detected" is never read as "no mutation".
  - **REFLEX**: suggests next tests when the result is insufficient. Merged with the "pemicu tes" (test trigger) that flags patients who should be tested.
  - **TRIASE**: rule-based therapy report ("Laporan Pilih Terapi"), with therapy options ordered by what is actually accessible in Indonesia (BPOM registration, JKN coverage, price).
- Plus the OnkoTepat layer: patient summary in lay Indonesian, and (pitch only) registry and therapy coaching.

## 2. What to build (MVP for the pitch)

One web app, demo only, all data simulated or public, rule-based (no ML). Five screens:

1. **Daftar Pasien / Pemicu Tes** (worklist): list of demo patients. Flag "Perlu tes" for HR+/HER2- advanced patients whose disease progressed on endocrine therapy and who have no molecular test yet. Clicking a patient opens their case.
2. **SENTINEL**: quality status per layer S1 to S5 with a clear overall verdict: LANJUT (proceed), TAHAN (hold), AMBIL ULANG (resample). Show which panel targets were readable and which were not.
3. **REFLEX**: ordered next-step suggestions with reasons. Always shows "Butuh persetujuan dokter".
4. **Laporan Pilih Terapi** (doctor report, one printable page): QC status, unreadable targets, detected variants with evidence level, therapy options grouped into: (a) Sesuai dan tersedia, (b) Sesuai tetapi belum terdaftar / tidak tersedia, (c) Tidak sesuai (with reason). Each option shows BPOM status, JKN status, price, and the access check date. Report status "DRAF, menunggu tanda tangan dokter" with a sign-off button that flips it to "Terbit".
5. **Ringkasan Pasien** (patient summary): plain Indonesian, what was found, that tumour mutations are NOT inherited by children, costs shown openly, list of questions to ask the doctor, family's role.

Every screen shows a visible "SIMULASI, bukan untuk keputusan klinis" banner.

NOT in scope (pitch slides only): real pilot deployment, registry, therapy coaching app, FASTQ/NGS pipeline, authentication, real patient data, backend database.

## 3. Tech choices

- Next.js (App Router) + TypeScript + Tailwind. Static data from JSON in `data/`. No backend, no database, no login. Deployable to Vercel.
- Rules engine as pure TypeScript functions in `lib/rules/` (`sentinel.ts`, `reflex.ts`, `triase.ts`, `trigger.ts`), each with unit tests (Vitest) covering every demo patient. The UI only renders what the rules return.
- Every rule result carries a human-readable `reason` string (Indonesian) so the UI can explain itself.
- Print stylesheet for the report (A4, one page) so it can be saved as PDF from the browser.
- Store no data. Mention in the footer: "Tidak ada data yang disimpan".
- UI language: Indonesian. Code and identifiers: English.

## 4. Data files

| File | What it is | Use |
|---|---|---|
| `data/panel_consensus_15.csv` | Earlier 15-target consensus panel (codon level) from the analysis, with per-cohort frequency | Historical reference only. The app now uses NUSA11 in `data/panel.json` |
| `data/evidence_check.csv` | OncoKB level, oncogenicity, CIViC and ClinVar IDs with links for 35 variants, checked 23 Oct 2026 | Evidence level shown per variant in the report |
| `data/drug_access.json` | Indonesian access status per drug (BPOM, JKN/e-Fornas, price), team check 23 Oct 2026 | Grouping in TRIASE |
| `data/patients.json` | Demo patients and their test results | Drives all screens and tests |

**Panel update (25 Oct 2026): the team's final panel is NUSA11**, 11 allele-level hotspots: PIK3CA H1047R, H1047L, H1047Y, E545K, E545A, E542K, C420R, N345K; AKT1 E17K; ERBB2 L755S, V777L. It is defined in `data/panel.json` (`id` = allele, `site` = codon where read quality is measured). Only the listed alleles are reported. ESR1 is not on the panel, so ESR1 is advised as a separate plasma ctDNA test.

## 5. Acceptance criteria (the demo must show exactly this)

- Patient A (PIK3CA H1047R, tissue, good quality): SENTINEL LANJUT; TRIASE puts capivasertib (Truqap) in "Sesuai dan tersedia" with price Rp87.025.221 per box and "tidak dijamin JKN"; alpelisib in group (b) as "terdaftar BPOM, tidak ditemukan di pasar"; inavolisib in group (b) "belum terdaftar".
- Patient B (ERBB2 L755S, plasma ctDNA at progression; changed from ESR1 Y537S on 25 Oct 2026 because ESR1 is not on NUSA11): neratinib (OncoKB Level 2) in group (b) "Status akses belum dinilai"; no option in group (a). The ESR1/fulvestrant fallback rule stays in the code and is unit-tested with a synthetic variant.
- Patient F (decalcified bone biopsy, 8 of 11 NUSA11 targets readable, tumour content 10%): SENTINEL TAHAN; no therapy report issued; REFLEX suggests plasma ctDNA test or another non-bone tissue block; the screen states clearly that the result must not be read as "tidak ada mutasi".
- Patient D (all targets readable, no variant found, strong family history): SENTINEL LANJUT; report says "Tidak terdeteksi varian yang dapat ditindaklanjuti pada 11 target yang diperiksa" (never "negatif total"); REFLEX suggests broader NGS and germline BRCA1/2 testing from blood with counselling.
- Patient E (progressed on endocrine therapy, not yet tested): flagged "Perlu tes" on the worklist.
- All unit tests pass. No em dash characters anywhere in UI text.

## 6. Forbidden claims (never put these in UI text)

- Do not present frequencies from synthetic data as Asian or Indonesian prevalence.
- Do not claim NUSA-15 is better than WEST-15. The analysis found no difference (Asian-designed panel about 2 points lower on held-out Asian patients, 95% range -5.8 to 0).
- Do not claim the hotspot panel fully covers BRCA1/2 or PTEN.
- Do not call a tumour variant inherited (germline) without confirmation.
- Do not equate "relevan secara terapi" with "bisa diresepkan"; always show BPOM/JKN status and its check date.
- Do not call unreadable regions negative.
- Do not call the assay clinically ready.
- Do not name a hospital or institution as a partner.

## 7. Key numbers the UI or pitch may reference (from the real analysis, public data)

Note: the coverage numbers below were computed for the earlier 15-target consensus panel, not NUSA11. Do not show them as NUSA11 coverage.

- Panel covers 37 to 49% of HR+/HER2- primary patients and 30 to 35% of metastatic patients.
- 15 targets fit in about 8 amplicons (about 4 to 5 multiplex reactions, assumption).
- Indonesian study (PMC12052133, 207 patients): PIK3CA mutated in 32.9%; H1047L was 63% of H1047 mutants there vs 8 to 26% elsewhere (unexplained; may be real or an assay artefact).

## 8. Suggested build order

1. Data files and TypeScript types.
2. Rules engine plus tests for all demo patients (this is the core; get it right first).
3. Report screen (most important for the demo), then SENTINEL, REFLEX, worklist, patient summary.
4. Print stylesheet, banner, polish, deploy.

## 9. Nurse navigator dashboard (added 26 Oct 2026)

Spec: `/home/nekora/Downloads/NUSA11_Dashboard_Navigator_Penjelasan_Fitur.pdf` and the team's HTML mockup. Routes under `/perawat`. Rules in `lib/navigator/rules.ts` (tested). Guard rails enforced by design: the nurse never sees variants; the result summary can only be handed over after the doctor releases it; WhatsApp is locked without recorded consent; urgent check-ins can only be escalated to the doctor on call (no treatment advice); no per-doctor referral metrics. Check-in thresholds are demo assumptions to be aligned with the hospital's escalation SOP. Do not name the hospital (the mockup's "RS Mitra Premium" is replaced by "RS").

## 10. Framework notes

@AGENTS.md
