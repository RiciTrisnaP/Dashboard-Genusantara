# Rules specification (SENTINEL, REFLEX, Pemicu Tes, TRIASE)

Source: team proposal "OnkoTepat x NUSA-15, Proposal Gabungan", pages 8 to 11, turned into explicit rules.
All thresholds marked DEMO are demo values from the proposal, not clinical cut-offs. Put them in one constants file (`lib/rules/thresholds.ts`) so they are easy to show and change.

Every rule returns `{ status, reason }` where `reason` is a short Indonesian sentence shown in the UI.

## 0. Thresholds (DEMO)

| Name | Value | Meaning |
|---|---|---|
| MIN_TUMOR_CONTENT_TISSUE | 20 (%) | Tissue below this: hold |
| MIN_DEPTH | 300 (x) | Target with lower depth (or failed internal control for PCR) counts as unreadable |
| MAX_UNREADABLE_BEFORE_HOLD | 3 | More unreadable targets than this: whole test on hold |
| MIN_VAF_TISSUE | 5 (%) | Variant below this in tissue: review |
| MIN_VAF_PLASMA | 0.5 (%) | Variant below this in plasma: review |
| MIN_ALT_READS | 10 | Fewer supporting reads: review |
| MAX_PLASMA_PROCESSING_HOURS | 6 | Plasma processed later than this: S2 warning |

For a PCR test (PathGen-style), S3 uses `internalControlPass` instead of depth; the data already carries both.

## 1. Pemicu Tes (test trigger, before testing)

Flag "Perlu tes" when ALL hold:
- `clinical.subtype == "HR+/HER2-"`
- `clinical.stage == "IV"` or `clinical.setting in ["metastatik", "kambuh"]`
- `clinical.progressedOnEndocrine == true`
- `molecularTest.done == false`

Suggested specimen text: "Jaringan FFPE untuk PIK3CA dan AKT1; plasma ctDNA untuk ESR1 (mutasi ESR1 biasanya muncul setelah terapi hormon)."
Otherwise show "Sudah dites" or "Tidak memenuhi kriteria" with the reason (for example subtype not HR+/HER2-).

## 2. SENTINEL (quality gate)

Run S1 and S2 before testing (they only need clinical and specimen data) and S3 to S5 after testing.

| Layer | Checks | Output values | Rule |
|---|---|---|---|
| S1 Klinis | diagnosisConfirmed, subtype, stage, priorTherapies | LAYAK, KONTEKS_KURANG, DI_LUAR_INDIKASI | KONTEKS_KURANG if any field missing. DI_LUAR_INDIKASI (warning, not a block) if subtype is not HR+/HER2-: panel drugs are indicated only for HR+/HER2- |
| S2 Spesimen | type, tumorContentPct, decalcified, dnaIntegrity, plasmaProcessingHours | LANJUT, TAHAN, AMBIL_ULANG | TAHAN if `decalcified` is true, or `dnaIntegrity == "rusak"`, or tissue with tumorContentPct < MIN_TUMOR_CONTENT_TISSUE (list every cause). AMBIL_ULANG if plasma processed after 24 hours. Warning (still LANJUT) if plasma processed after MAX_PLASMA_PROCESSING_HOURS |
| S3 Analitik | per target depth / internalControlPass | TERBACA (all), SEBAGIAN (1 to MAX_UNREADABLE_BEFORE_HOLD unreadable), TAHAN (more) | List the unreadable targets by name |
| S4 Varian | per variant vaf, altReads, specimen type | LULUS, TINJAU per variant | TINJAU if vaf below the specimen's minimum or altReads < MIN_ALT_READS. Only LULUS variants go to TRIASE |
| S5 Pelaporan | evidence version, access check date, doctor sign-off | DRAF, TERBIT, ULANG | DRAF until the doctor signs in the UI. ULANG if overall verdict is TAHAN or AMBIL_ULANG |

Overall verdict:
- AMBIL_ULANG if S2 is AMBIL_ULANG
- else TAHAN if S2 is TAHAN or S3 is TAHAN
- else LANJUT (S1 warnings and S3 SEBAGIAN are shown but do not block)

When the verdict is not LANJUT: do not produce the therapy report. Show: "Hasil tidak boleh dibaca sebagai 'tidak ada mutasi'."

## 3. REFLEX (next steps, after testing). Always labelled "Saran, butuh persetujuan dokter"

Evaluate in this order and show every rule that fires:

1. **Mutu gagal** (verdict TAHAN or AMBIL_ULANG): hold the report. Cause-specific advice:
   - decalcified bone or damaged DNA: "Tes plasma ctDNA, atau gunakan blok jaringan lain yang bukan tulang."
   - low tumour content: "Pilih blok dengan kadar sel tumor lebih tinggi atau lakukan makrodiseksi."
2. **Target tertentu tidak terbaca** (S3 SEBAGIAN): "Laporkan area yang tidak dinilai." If an unreadable target is PIK3CA H1047, E545, E542, AKT1 E17 or any ESR1 codon: "Ulangi, target ini penting untuk pilihan obat."
3. **Panel negatif, kebutuhan klinis besar** (verdict LANJUT, zero LULUS variants, setting metastatik/kambuh): "Pertimbangkan profil genomik yang lebih luas (NGS panel besar)." Add: "Panel hotspot tidak mencakup PTEN dan BRCA1/2 secara utuh."
4. **Petunjuk BRCA bawaan** (familyHistory mentions breast or ovarian cancer, or age < 40, or subtype triple-negatif): "Rujuk tes germline BRCA1/2 dari darah dengan konseling genetik (PNPK 2026)." Never state that the tumour variant is inherited.
5. **Plasma negatif** (specimen plasma, zero LULUS variants): "Hasil plasma negatif belum tentu informatif (kadar ctDNA bisa rendah); pertimbangkan tes jaringan."
6. **ESR1 belum dinilai saat progresi** (progressedOnEndocrine and specimen is tissue only): "Pertimbangkan tes plasma ctDNA untuk ESR1."

## 4. TRIASE (therapy report)

Input: LULUS variants, clinical context, `data/evidence_check.csv`, `data/drug_access.json`.

### 4.1 Variant to drug map (from OncoKB, checked 23 Oct 2026)

| Variant | Drugs (regimen) | OncoKB level (breast) | Indication condition |
|---|---|---|---|
| PIK3CA therascreen alleles (C420R, E542K, E545A/D/G/K, Q546E/R, H1047L/R/Y) | alpelisib + fulvestrant; capivasertib + fulvestrant; inavolisib + palbociclib + fulvestrant | 1 | HR+/HER2-, advanced, after endocrine therapy (inavolisib: relapse during or soon after adjuvant endocrine therapy) |
| PIK3CA E545Q, G1049R, M1043I/V, N345K, Q546K/P, R88Q | capivasertib (L1), inavolisib (L1), alpelisib (L2) | 1 | same |
| Other oncogenic PIK3CA (for example N1044K, G118D, K111E, E110del, E103 in-frame deletions) | inavolisib (L1), capivasertib (L2), alpelisib (L2) | 1 | same |
| PIK3CA E726K | none (oncogenicity Inconclusive in OncoKB) | none | show as "variant dengan makna belum jelas" |
| AKT1 E17K | capivasertib + fulvestrant | 1 | HR+/HER2-, advanced, after endocrine therapy |
| ESR1 ligand-binding domain missense (D538G, Y537S/N/C, E380Q, L536H, ...) | elacestrant; imlunestrant; camizestrant + CDK4/6 inhibitor; vepdegestrant | 1 | ER+/HER2-, advanced, after at least one endocrine therapy |
| ERBB2 oncogenic mutations (L755S, V777L, D769H/Y, S310F, L869R) | neratinib + trastuzumab + fulvestrant | 2 | research or guideline level only. ERBB2 G727A is Inconclusive: no drug |

Take the exact level and links per variant from `data/evidence_check.csv`. Show the evidence source version: "OncoKB v7.6 (data 30 Sep 2026), CIViC dan ClinVar, dicek 23 Okt 2026".

### 4.2 Grouping

For each candidate drug:
- If the patient's subtype or setting does not match the indication: group **(c) Tidak sesuai**, with reason (for example "Indikasi hanya untuk HR+/HER2-").
- Else by `drug_access.json` accessGroup:
  - `tersedia`: group **(a) Sesuai dan tersedia**. Show price and JKN status.
  - `terdaftar_tidak_di_pasar`: group **(b)**, label "Terdaftar BPOM, tidak ditemukan di pasar".
  - `belum_terdaftar`: group **(b)**, label "Belum terdaftar di BPOM".
  - `belum_dinilai`: group **(b)**, label "Status akses belum dinilai".
- When an ESR1 variant is found and all ESR1-specific drugs are in group (b), add the available fallback: fulvestrant (Fornas, maksimal 6 bulan), labelled "pilihan endokrin yang tersedia; bukan terapi khusus ESR1".

Sort inside each group by OncoKB level, then by price (cheapest first, unknown last).

### 4.3 Report wording rules

- No variant and verdict LANJUT: "Tidak terdeteksi varian yang dapat ditindaklanjuti pada 15 target yang diperiksa." Never "negatif".
- Always list unreadable targets as "Tidak dinilai".
- Always show the access check date next to BPOM, JKN and price.
- Footer: "Laporan draf berbasis aturan untuk dokter. Keputusan terapi tetap pada dokter. SIMULASI."

## 5. Patient summary (Ringkasan Pasien)

Template sections, plain Indonesian, about 150 to 250 words:
1. Apa yang diperiksa (tumor, bukan gen bawaan).
2. Apa hasilnya (one sentence per finding, no jargon; codon names in brackets only).
3. "Mutasi di tumor ini tidak diturunkan ke anak." (Exception: if REFLEX rule 4 fired, add that a separate blood test for inherited genes is recommended.)
4. Pilihan pengobatan dan biaya nyata (from group a), with "tidak dijamin JKN" when true.
5. Pertanyaan untuk dokter (3 to 5 bullets).
6. Peran keluarga (1 to 2 sentences).
