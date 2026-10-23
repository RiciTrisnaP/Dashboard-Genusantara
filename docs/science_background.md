# Science background (short)

Read this only if you need to understand the domain. The rules file is what the code needs.

## Terms
- **Somatic mutation**: arose in the tumour, not inherited. This panel only reads somatic hotspots.
- **Hotspot / codon target**: a protein position mutated in many patients (for example PIK3CA codon 1047). Any allele at that codon counts (H1047R, H1047L, H1047Y).
- **Actionable**: linked to an approved drug. Ranked by OncoKB levels (1 = FDA-recognised, 2 = guideline, 3A/3B/4 = weaker).
- **HR+/HER2-**: hormone-receptor positive, HER2 negative breast cancer. All targeted drugs in this app are indicated only for this subtype in advanced disease after endocrine therapy.
- **ESR1 mutations** appear after hormone therapy (resistance). Best found in blood (ctDNA) at progression.
- **FFPE**: formalin-fixed paraffin-embedded tissue block. Decalcified bone biopsies often have damaged DNA.
- **VAF**: variant allele fraction, the share of reads carrying the mutation.

## Results of the panel analysis (public data, real)
- Data: cBioPortal (Korean SMC 186, TCGA 2015 split by race, METABRIC 2,433, MBC Project 301, IGR 216) plus the Indonesian PIK3CA study (PMC12052133, 207 patients, summary counts only).
- Consensus 15-codon panel: PIK3CA H1047, E545, E542, AKT1 E17, PIK3CA N345, ESR1 D538, ESR1 Y537, PIK3CA C420, Q546, M1043, N1044, E103, K111, G118, ESR1 E380. About 8 amplicons.
- Coverage: 37 to 49% of HR+/HER2- primary patients, 30 to 35% of metastatic patients. ESR1 adds about 10 points in metastatic patients and nothing in primary tumours.
- Asian-designed vs Western-designed panel: no difference found (Asian 2.0 points lower on held-out Asian patients, 95% range -5.8 to 0).
- Indonesian study: PIK3CA 32.9%; H1047L is 63% of H1047 mutants vs 8 to 26% in all other cohorts (unexplained).

## Evidence check (23 Oct 2026)
- OncoKB is the most current source; CIViC lags (many Level 1 OncoKB variants only have CIViC level C/D or no entry).
- PIK3CA E726K and ERBB2 G727A are "Inconclusive" in OncoKB: treat as not actionable.
- ClinVar "germline Pathogenic" labels on PIK3CA hotspots come from overgrowth syndromes (PROS), not breast cancer; use the oncogenicity / somatic columns.
- OncoKB requires a licence for commercial use; CIViC is free. Record the evidence version on every report.
