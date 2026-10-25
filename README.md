# Genusa: panel NUSA11 (prototipe demo)

Nama produk sebelumnya: OnkoTepat. Dokumen sumber tim di `docs/` masih memakai nama lama.

Prototipe web untuk pitch GenoHack 2026. **SIMULASI, bukan untuk keputusan klinis.** Semua pasien simulasi, aturan berbasis spesifikasi tim (tanpa ML), tanpa backend, tanpa penyimpanan data.

Brief lengkap: [CLAUDE.md](CLAUDE.md). Aturan: [docs/rules_spec.md](docs/rules_spec.md).

## Menjalankan

```bash
npm install
npm test          # unit test Vitest (aturan + pemeriksaan teks UI)
npm run dev       # http://localhost:3000
npm run build     # build statis, siap Vercel
```

Bila `data/evidence_check.csv` berubah: `npm run data:convert` (menulis ulang `data/evidence_check.json`).

## Struktur

```
app/page.tsx                      Landing page (hero, panel NUSA11, cara kerja, alur demo)
app/pasien/page.tsx               Daftar Pasien + pemicu tes (peran dokter)
app/perawat/                      Dashboard navigator (peran perawat): tugas, pasien, check-in gejala, kinerja
lib/navigator/                    Aturan navigator: penandaan check-in, kunci persetujuan, tugas, kinerja (+ test)
data/navigator.json               Data simulasi navigator (Ibu A sampai H; G dan H hanya di sisi perawat)
app/lab/                          Dashboard lab (analis dan patolog): sampel masuk, antrian run, SENTINEL, tinjauan patolog, kinerja
lib/lab/                          Aturan lab: cek spesimen S2, kontrol internal per reaksi, hasil per target, kinerja (+ test)
data/lab.json                     Data simulasi lab (kode sampel NS-2610-0xx; NS-2610-024 = Ibu F di dashboard dokter dan perawat)
app/pasien/[id]/sentinel          SENTINEL S1 sampai S5, target terbaca/tidak
app/pasien/[id]/reflex            REFLEX, saran berurutan (butuh persetujuan dokter)
app/pasien/[id]/laporan           Laporan Pilih Terapi (cetak A4 satu halaman, tanda tangan simulasi)
app/pasien/[id]/ringkasan         Ringkasan Pasien (bahasa awam)
lib/rules/                        Mesin aturan murni: thresholds, trigger, sentinel, reflex, evidence, triase, summary
lib/rules/*.test.ts               Test per modul untuk pasien A sampai F
tests/ui-text.test.ts             Klaim terlarang (CLAUDE.md bagian 6) dan em dash
data/                             Data demo; panel NUSA11 (11 alel) di data/panel.json
```

UI hanya menampilkan hasil `runCase(patient)` dari `lib/rules/index.ts`. Ambang batas DEMO ada di `lib/rules/thresholds.ts`.

## Keputusan yang tidak diatur spesifikasi

- **Vepdegestrant** (OncoKB L1 untuk ESR1) tidak ada di `drug_access.json`: masuk grup (b) "Status akses belum dinilai".
- **Inavolisib** untuk pasien yang progresi pada terapi lini metastatik tetap di grup (b) dengan catatan indikasi adjuvan, tidak dipindah ke (c).
- **REFLEX aturan 5** (plasma negatif) hanya berlaku bila SENTINEL LANJUT, supaya hasil yang gagal tidak disebut negatif.
- Varian di luar tabel bukti tim (misalnya PIK3CA H1047Q) ditandai "perlu kurasi manual", tanpa obat.
- Merek placeholder di `drug_access.json` (camizestrant) tidak ditampilkan.
- Tanda tangan dokter hanya di memori; hilang saat halaman dimuat ulang.
