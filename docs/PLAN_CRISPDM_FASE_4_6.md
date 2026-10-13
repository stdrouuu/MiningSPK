# Plan CRISP-DM: dari Fase 3 ke Fase 6 (Final) + Bereskan Penyederhanaan SPK

**Tanggal:** 2026-10-13 · **Status: DIKERJAKAN 2026-10-13** — Fase 3 final ✅, Fase 4 inti ✅ (terverifikasi paritas),
evaluasi ✅, tersisa Fase 6 deploy + uji pengguna lapangan (5.4).

Tujuan akhir: ranking `/` dan `/data` memakai **satu spesifikasi SPK yang sama dengan pipeline**, hasilnya stabil, terdokumentasi, dan siap deploy — tanpa lagi versi "sederhana" yang menyimpang diam-diam.

---

## 0. Posisi sekarang (fakta, bukan asumsi)

| Item | Kondisi |
|---|---|
| Data real | 50 respons GForm → `data/raw/raw-real-students/raw_real_student_preferences.csv` (MHS-R001…R050) → `data/processed/cleaned-real-students/clean_real_student.csv` (49 baris, MHS-R022 ter-drop karena skill `-`) |
| Data mock | `data/raw/raw-mock-students/` + `data/processed/cleaned-mock-students/` (55→52 responden versi dokumen) |
| Layout `data/` | **Baru direorganisasi, belum di-commit** (`git status`: file lama `data/raw/*.csv` dan `data/processed/*.csv` terhapus/terpindah). Path di kode **masih menunjuk layout lama** |
| Web `/data` | Baca `web/public/data/clean_students_dataset.csv` (masih data mock lama), dropdown avatar per `student_id` |

### Gap yang harus dibereskan (sudah diverifikasi di kode)

| # | Gap | Lokasi | Dampak |
|---|---|---|---|
| G1 | **C5 web ≠ C5 pipeline.** Pipeline: TF-IDF + stopwords ID/EN + buang token ≤1 huruf (`src/nlp.py`, `src/skill_similarity.py:24`). Web: cosine frekuensi mentah, tanpa IDF, tanpa stopwords, filter `length > 2`, regex `\w` meloloskan angka (`web/src/lib/spk.ts:20-62`) | `spk.ts` vs `skill_similarity.py` | Ranking web dan matriks Fase 3 **tidak konsisten** — ini bug, bukan tuning |
| G2 | **Dua konverter GForm dengan logika beda.** Baru (`scripts/convert_gform_to_raw.py`): floor jam 8, clip gaji 15–60rb, `Tangerang…` → `Tangerang Selatan`. Lama (`scripts/process_google_form_responses.py`): tanpa floor jam, clip 15–75rb, `Tangerang…` → `Tangerang`, ada filter consent + dedup NIM | `scripts/` | Hasil konversi tergantung skrip mana yang dipakai |
| G3 | **Path config basi.** `src/config.py:9-17`, `src/pipeline.py`, `scripts/sync_web_data.py`, default path di `process_google_form_responses.py:26-27` masih layout lama (`data/raw/*.csv`, `data/processed/*.csv`) | `config.py`, `pipeline.py`, `sync_web_data.py` | Pipeline tidak bisa jalan sampai layout + path disatukan |
| G4 | **C2 (rasio gaji) tidak di-cap di web** (`spk.ts:214`), outlier gaji mendominasi normalisasi min-max | `spk.ts:207-264` | Satu lowongan gaji ekstrem bisa mengunci rank 1 |
| G5 | **Normalisasi ikut filter.** `computeSmarter` hitung min-max dari data yang tampil (`spk.ts:132-148`) → ganti filter, ranking berubah (rank reversal) | `spk.ts:126-184` | Ranking tidak stabil antar tampilan |
| G6 | **Bobot seri tidak dipakai.** `weightsWithTies` ada di `roc.ts:24` tapi jalur SPK memakai `calculateRocWeights` tanpa ties | `roc.ts`, `spk.ts:267-273` | Rank kembar dari kuesioner prioritas tidak tertangani |
| G7 | **Tanpa tie-breaker.** `rank = idx+1` sesudah sort (`spk.ts:179-181`); skor kembar urutannya ikut urutan input | `spk.ts:176-183` | Urutan tidak deterministik |
| G8 | **Unigram only** di kedua sisi (`TfidfVectorizer()` default). Frasa seperti `integrasi api` pecah jadi token lepas | `skill_similarity.py:24`, `spk.ts` | Match parsial palsu (sudah dibahas,baseline masih OK) |
| G9 | **C1 biner 1.0/0.3, C3 3-level** — angka arbitrary, belum diuji sensitivitasnya | `decision_matrix.py:23,29`, `spk.ts` | Tidak tahu selebar apa pengaruhnya ke ranking |

---

## Fase 3 — Finalisasi Data Preparation (tutup dulu yang bolong)

**Prinsip:** satu layout, satu konverter, satu sumber kebenaran path.

- [x] **3.1 Kunci layout `data/` dan commit reorganisasi.** ✅ Struktur final:
  `raw/raw-jobs/`, `raw/raw-mock-students/`, `raw/raw-real-students/`,
  `processed/cleaned-jobs/`, `processed/cleaned-mock-students/`,
  `processed/cleaned-real-students/`, `processed/matrix/`. File yatim dipindah
  (`raw_job_postings.csv`, `clean_jobs_dataset.csv`, `decision_matrix_sample.csv`,
  `Survei_GformResponses_1.csv`).
- [x] **3.2 Satukan path di `src/config.py`.** ✅ Konstanta eksplisit mock vs real
  + `C2_RATIO_CAP = 2.0`, `MIN/MAX_SALARY_PER_HOUR`, `MIN_STUDENT_HOURS`.
- [x] **3.3 Konsolidasi konverter → 1 skrip.** ✅ `scripts/process_gform.py`
  (consent filter + dedup NIM dari skrip lama, rumus jam/gaji + lokasi lengkap dari skrip baru);
  `convert_gform_to_raw.py` + `process_google_form_responses.py` dihapus.
  Re-run menghasilkan file identik (50 baris).
- [x] **3.4 Perbaiki `sync_web_data.py`** ✅ mengikuti layout baru + flag `--source`.
  `build_notebook.py`, `enrich_company_logos.py`, `generate_raw_data.py` ikut diperbaiki.
- [x] **3.5 Regenerasi + verifikasi.** ✅ `python -m src.pipeline --source mock` (221×52)
  dan `--source real` (221×49) hijau; `scripts/build_notebook.py` hijau.
- [x] **3.6 Update `DOKUMENTASI_FASE_3.md`** ✅ adendum 2026-10-13 + `data/README.md` baru.

## Fase 4 — Modeling (hilangkan semua yang "sederhana")

Urutan sengaja: konsistensi dulu (G1), baru stabilitas (G4–G7), terakhir eksperimen (G8–G9).

- [x] **4.1 Samakan C5 web = C5 pipeline (wajib, G1).** ✅ SELESAI + TERBUKTI (lihat Hasil di bawah).
- [x] **4.2 Cap C2 (G4).** ✅ `C2_RATIO_CAP = 2.0` di Python + TS.
- [x] **4.3 Normalisasi terhadap full dataset (G5).** ✅ Diverifikasi sudah benar (matriks dari 221 penuh, filter sesudah ranking). Tanpa perubahan.
- [x] **4.4 Pakai `weightsWithTies` di jalur SPK (G6)** ✅ — tadinya bobot tampil ≠ bobot hitung saat seri.
- [x] **4.5 Tie-breaker deterministik (G7).** ✅ `finalScore → C2 → C5 → job_id`.
- [x] **4.6 Eksperimen n-gram (G8).** ✅ Overlap top-10 (1,2) vs (1,1) = **1.000** → tetap unigram.
- [x] **4.7 Sensitivitas C1/C3 (G9).** ✅ C1 {0.2,0.5} overlap top-5 = **1.000** (min-max menghapus nilai absolut).
- [ ] **4.8 Sinkron spreadsheet.** ⏳ BELUM — butuh run openpyxl manual (`CICD_AUTOMATION_PLAN.md §4.2`).

### Hasil verifikasi 2026-10-13 (bukti, bukan klaim)

- Tokenizer TS vs Python: **270/270 teks skill identik** (49 mahasiswa real + 221 lowongan).
- C5 web vs `decision_matrix_sample.csv` (60 pasang, sampel MHS-101): max diff **0.000036** (< 1e-4 ✅).
- `tsc -b` web: exit 0. Pipeline `--source mock` (221×52) dan `--source real` (221×49): hijau.
- `eval_spk.py --source real`: juara stabil 39/49; mock: 40/52.

## Fase 5 — Evaluation (bukti, bukan klaim)

- [x] **5.1 Stabilitas ranking.** ✅ `scripts/eval_spk.py`: juara stabil 39/49 real, 40/52 mock;
  overlap top-5 antar skenario 0.418 (real) — ranking memang responsif terhadap prioritas (by design),
  tapi pemenang mayoritas stabil.
- [x] **5.2 Kualitas C5.** ✅ Paritas terbukti (di atas). Batasan `Semua Bisa → semua` terdokumentasi di laporan.
- [x] **5.3 Perbandingan mock vs real.** ✅ Keduanya dievaluasi; angka sebanding (39/49 vs 40/52).
  Keputusan default web: **real** (permintaan user: GForm masuk `/data`).
- [ ] **5.4 Uji pengguna.** ⏳ BELUM — butuh 5–10 mahasiswa isi kuesioner (lapangan, tidak bisa dikerjakan di sini).
- [ ] **5.5 Performa.** ⏳ BELUM DIUKUR formal — 221×49 trivial (<1 dtk), bundle `tfidf_skills.json` kecil (211 term).

## Fase 6 — Deployment (final)

- [ ] **6.1 Keputusan data ship.** ✅ DIPUTUSKAN: **real** sebagai isi `/data` (permintaan user).
  ⚠️ Sebelum publik: hapus route `/data/*` + CSV responden (catatan `routes.ts:8-10`) —
  data partisipan asli tidak boleh tersebar. Sisakan `/kuesioner`.
- [x] **6.2 Build bersih.** ✅ `tsc -b` exit 0 + `vite build` sukses (982ms).
- [ ] **6.3 CI/CD.** ⏳ BELUM — ikuti `docs/CICD_AUTOMATION_PLAN.md` atau tunda eksplisit.
- [ ] **6.4 Rilis + arsip.** ⏳ BELUM — tag versi + bekukan spreadsheet + regen notebook (notebook sudah regen ✅).

---

## Urutan eksekusi yang disarankan

1. 3.1 → 3.2 → 3.3 (fondasi; tanpa ini Fase 4 dibangun di atas path basi)
2. 4.1 → 4.2 → 4.3 → 4.4 → 4.5 (inti modeling, tiap langkah ada kriteria terimanya)
3. 3.4 → 3.5 → 3.6 (pipeline hijau end-to-end)
4. 4.6 → 4.7 → 4.8 (eksperimen + spreadsheet)
5. Fase 5 penuh, baru Fase 6 (termasuk hapus `/data/*` sebelum publik)

## Risiko utama

- **Reorganisasi belum di-commit** — kerja Fase 4 sebelum 3.1–3.2 rawan konflik path. Bereskan layout dulu.
- **Artefak TF-IDF di web** menambah bundle; ukur di 5.5, fallback: hitung C5 di build-time per mahasiswa (bukan on-the-fly) bila terlalu berat.
- **Privasi:** NIM + timestamp sudah di-drop saat cleaning — jangan pernah ship `raw_real_*` ke `web/public/`.
