# Plan CRISP-DM: dari Fase 3 ke Fase 6 (Final) + Bereskan Penyederhanaan SPK

**Tanggal:** 2026-10-13 · **Status awal:** Fase 3 hampir selesai (data real sudah clean), Fase 4 (modeling) jalan di web tapi masih versi sederhana, Fase 5–6 belum dikerjakan.

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

- [ ] **3.1 Kunci layout `data/` dan commit reorganisasi.** Putuskan struktur final (usulan: `raw-mock-students/`, `raw-real-students/`, `cleaned-mock-students/`, `cleaned-real-students/` + `cleaned-jobs/`, `matrix/`), hapus file yatim (`data/Survei_GformResponses_1.csv`, `data/*.csv` di root, `data/raw_job_postings.csv`), lalu commit.
- [ ] **3.2 Satukan path di `src/config.py`.** Tambah konstanta eksplisit mock vs real (contoh `RAW_REAL_STUDENTS_PATH`, `CLEAN_REAL_STUDENTS_PATH`, dst.), pipeline pilih via argumen/flag, bukan edit manual.
- [ ] **3.3 Konsolidasi konverter → 1 skrip.** Gabungkan `convert_gform_to_raw.py` + `process_google_form_responses.py` menjadi `scripts/process_gform.py`: deteksi kolom Q1–Q8, filter consent + dedup NIM (dari skrip lama), rumus jam `min(30,max(8,round(hari×jam/hari)))` + gaji/jam clip 15–60rb + lokasi lengkap dipertahankan (dari skrip baru). Skrip lama dihapus. Kriteria terima: re-run menghasilkan `raw_real_student_preferences.csv` identik dengan yang sekarang.
- [ ] **3.4 Perbaiki `sync_web_data.py`** mengikuti layout baru + putuskan file mana yang di-ship ke `web/public/data/` (mock, real, atau keduanya dengan nama beda).
- [ ] **3.5 Regenerasi + verifikasi.** `python -m src.pipeline` (mock dan real), `python scripts/build_notebook.py`, cek 49 baris real lolos, `student_location_clean` terisi semua (tidak ada `Non-Jabodetabek` nyasar).
- [ ] **3.6 Update `DOKUMENTASI_FASE_3.md`** (angka 55→52 mock + 50→49 real, layout baru, keputusan konsolidasi).

## Fase 4 — Modeling (hilangkan semua yang "sederhana")

Urutan sengaja: konsistensi dulu (G1), baru stabilitas (G4–G7), terakhir eksperimen (G8–G9).

- [ ] **4.1 Samakan C5 web = C5 pipeline (wajib, G1).** Opsi yang disarankan: pipeline mengekspor artefak TF-IDF (`vocabulary_` + `idf_` → JSON di `web/public/data/`), web menghitung cosine TF-IDF dengan **tokenizer dan stopwords yang identik** (`nlp.py` di-port 1:1 ke TS, termasuk buang token ≤1 huruf). Alternatif yang ditolak: biarkan dua implementasi — itu kondisi bug hari ini. Kriteria terima: untuk 1 mahasiswa sampel, skor C5 web vs `decision_matrix_sample.csv` selisih < 1e-4.
- [ ] **4.2 Cap C2 (G4).** Cap rasio gaji (usulan maks 2.0, final dari uji sensitivitas) sebelum normalisasi, di Python dan TS sekaligus.
- [ ] **4.3 Normalisasi terhadap full dataset (G5).** Min-max dihitung dari 221 lowongan penuh, filter tampilan hanya memotong hasil akhir tanpa re-rank.
- [ ] **4.4 Pakai `weightsWithTies` di jalur SPK (G6)** + uji rank kembar dari kuesioner prioritas.
- [ ] **4.5 Tie-breaker deterministik (G7).** Usulan: `finalScore` → `C2` → `C5` → `job_id`. Tidak ada lagi urutan acak saat skor seri.
- [ ] **4.6 Eksperimen n-gram (G8, opsional, terukur).** Coba `ngram_range=(1,2)` di pipeline, bandingkan top-10 overlap vs unigram untuk 49 mahasiswa real. Ship hanya jika terbukti lebih baik; jika tidak, tetap unigram dan catat sebagai keterbatasan.
- [ ] **4.7 Sensitivitas C1/C3 (G9).** Variasikan 0.3→{0.2,0.5} dan level C3, laporkan seberapa banyak top-5 berubah (pakai `sensitivity.ts` yang sudah ada, tambah skenario).
- [ ] **4.8 Sinkron spreadsheet.** `decision_matrix` + bobot ROC final masuk ke sheet `Data_Lengkap_221` tanpa merusak formula (lihat `CICD_AUTOMATION_PLAN.md §4.2`).

## Fase 5 — Evaluation (bukti, bukan klaim)

- [ ] **5.1 Stabilitas ranking.** Untuk tiap 49 mahasiswa real: overlap top-5/top-10 antar skenario leader (`computeLeaderScenarios` sudah ada), korelasi rank saat bobot digeser ±10%. Target yang disarankan: pemenang stabil di ≥3/5 skenario untuk mayoritas profil (angka final diputuskan setelah run pertama).
- [ ] **5.2 Kualitas C5.** Audit manual 20 pasang mahasiswa–lowongan (cocok/tidak menurut manusia vs skor C5), pastikan stopwords tidak memakan skill bermakna (kasus `Semua Bisa` → `semua` harus terdokumentasi sebagai batasan).
- [ ] **5.3 Perbandingan mock vs real.** Distribusi gaji/jam/lokasi/kategori: apakah mock masih mewakili real? Putuskan dataset mana yang jadi default web.
- [ ] **5.4 Uji pengguna.** 5–10 mahasiswa isi kuesioner → nilai relevansi top-3 (skala 1–5) + catat keluhan. `KuesionerPage` + `SensitivityPanel` sudah ada untuk ini.
- [ ] **5.5 Performa.** Waktu hitung SPK 221×49 di browser (target <1 dtk, secara teori trivial) + ukuran bundle JSON TF-IDF.

## Fase 6 — Deployment (final)

- [ ] **6.1 Keputusan data ship.** Mock atau real sebagai `clean_students_dataset.csv` di `web/public/data/`? Perhatikan komentar di `web/src/lib/routes.ts:8-10`: **blok `/data/*` demo sementara — hapus setelah demo** agar data partisipan tidak tersebar publik. Untuk deploy final: hapus route `/data/*` + CSV responden, sisakan jalur `/kuesioner` (profil diisi user sendiri, tanpa data pribadi tersimpan).
- [ ] **6.2 Build bersih.** `tsc -b && vite build` + `preview`, tidak ada error type; CSV ter-bundle dari `dist/`.
- [ ] **6.3 CI/CD.** Ikuti `docs/CICD_AUTOMATION_PLAN.md` (weekly sync + auto-redeploy) atau putuskan ditunda — jangan setengah jalan.
- [ ] **6.4 Rilis + arsip.** Tag versi, spreadsheet final beku (tanpa `_v1/_v2`), notebook Colab-ready teregenerasi, laporan PDF.

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
