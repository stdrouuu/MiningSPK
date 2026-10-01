# Sistem Pendukung Keputusan Rekomendasi Pekerjaan Part-Time untuk Mahasiswa — Metode SMARTER

**Studi kasus:** Mahasiswa Program Studi Informatika, Universitas Kristen Krida Wacana (UKRIDA), Jakarta
**Metodologi pembangunan data:** CRISP-DM Fase 3 (Data Preparation)
**Tahun:** 2026

File ini adalah README pendamping spreadsheet perhitungan SPK/MCDM.

## 1. Identitas Kelompok

| NIM | Nama Mahasiswa |
|---|---|
| 412024022 | Brandon Jeremiah Sutedja |
| 412024043 | Andrew Linardi |
| 412025014 | Raffael Benediktus Lolaroh |
| 412025021 | Michael Aaron Sipahutar |

Program Studi Informatika, Fakultas Teknologi Cerdas, Universitas Kristen Krida Wacana (UKRIDA), Jakarta.

## 2. Metode yang Dipilih

**SMARTER — Simple Multi-Attribute Rating Technique Exploiting Ranks**, dengan pembobotan **ROC (Rank Order Centroid)**.

Sumber data yang dihitung: `decision_matrix_sample.csv` (221 alternatif lowongan × 5 kriteria), dihitung untuk **1 mahasiswa evaluator sampel: MHS-101 / David Santoso** (minat Education & Tutoring, domisili Jakarta Barat, gaji minimum Rp 35.000/jam, jam ideal 18 jam/minggu).

File spreadsheet: **`SPK_SMARTER_PartTime_UKRIDA_Spreadsheet_v4.xlsx`**

> Catatan: file `..._v3.xlsx` adalah versi terbaru (meniru file referensi
> `412024022_Brandon_TugasGsheet.xlsx` + blok profil mahasiswa). Jika Excel masih mengunci
> file lama, tutup Excel lalu hapus file `..._v2.xlsx` / tanpa `_v3` agar tidak ganda.

Isi workbook (2 sheet, gaya sel & pewarnaan meniru file referensi):

| Sheet | Isi |
|---|---|
| `SMARTER` | Pengerjaan utama gaya referensi: 10 alternatif teratas (judul, data mentah, baris MAX/MIN, blok Utility, Nilai SMARTER, Ranking, kotak VLOOKUP, baris KESIMPULAN kuning, dokumentasi rumus, **blok profil mahasiswa evaluator**). |
| `Data_Lengkap_221` | Arsip lengkap 221 alternatif dengan pola perhitungan yang sama (bobot ROC → MAX/MIN → utility → nilai → rank). |

### Legenda format sel (sama seperti file referensi)

| Elemen | Format |
|---|---|
| Judul sheet (baris 1) | Bold |
| Header kriteria + label `Utility` / `Nilai SMARTER` / `Ranking` | Teks merah (`C00000`), rata tengah, border tipis |
| Baris `Benefit`, `Bobot`, `MAX` | Isi abu-abu (`D9D9D9`); bobot berformat `%` (`0.00%`) berisi formula ROC |
| Baris `MIN` | Isi pink (`FFC6C6`) berisi formula `=MIN(...)` |
| Data mentah & utility & nilai | Border tipis; utility/nilai berformat `0.00` |
| Baris `KESIMPULAN` | Bold, isi kuning (`FFFF00`), teks rata tengah (merged) |
| Kotak VLOOKUP (kolom L–M, baris 3–6) | Input rank di sel kuning `M4`; hasil otomatis via `VLOOKUP` |

### Cara memakai rumus (semua sudah berupa FORMULA, tinggal drag/ubah)

1. **Bobot ROC** (baris 5, abu-abu): contoh rank-1 `=(1/1+1/2+1/3+1/4+1/5)/5`. Ubah susunan rank maka bobot ikut berubah.
2. **MAX/MIN** (baris 16–17): `=MAX(B6:B15)` / `=MIN(B6:B15)` (sheet `SMARTER`; di arsip 221 menyesuaikan rentangnya).
3. **Utility Benefit** (blok baris 19–28): `=(B6-$B$17)/($B$16-$B$17)` — tanda `$` mengunci baris MIN/MAX agar tidak geser saat di-drag ke bawah/menyamping.
4. **Nilai SMARTER** (kolom G): `=(B19*$B$5)+(C19*$C$5)+(D19*$D$5)+(E19*$E$5)+(F19*$F$5)` — `$` mengunci baris bobot.
5. **Ranking** (kolom H): `=RANK(G19,$G$19:$G$28)` — `$` mengunci rentang pembanding.
6. **VLOOKUP pemenang** (kotak L–M): ketik rank yang dicari di `M4` (kuning), maka
   - `M5 =VLOOKUP($M$4,$H$19:$J$28,2,FALSE)` menampilkan judul lowongan,
   - `M6 =VLOOKUP($M$4,$H$19:$J$28,3,FALSE)` menampilkan nilainya.
   - Tabel acuannya adalah blok `H19:J28` (kolom H = Rank sebagai kunci pertama, I = Alternatif, J = Nilai). `FALSE` = cocok persis.

> Semua angka turunan adalah FORMULA Excel, bukan ketikan manual. Mengubah bobot di Sheet 02 otomatis mengubah skor dan ranking.

## 3. Alasan Pemilihan Metode

1. **Mahasiswa mudah menentukan prioritas.** SMARTER hanya meminta urutan ranking kriteria (1 = paling penting), bukan angka bobot yang abstrak. Cocok untuk pengguna non-teknis.
2. **Bobot objektif via ROC.** Urutan rank dikonversi ke bobot dengan formula centroid yang adil dan jumlahnya = 1, tanpa survei pembobotan yang panjang (berbeda dengan AHP yang butuh matriks perbandingan berpasangan dan uji konsistensi).
3. **Transparan dan linear.** Fungsi utilitas linear + agregasi penjumlahan membuat setiap langkah dapat ditelusuri di spreadsheet (X → u → U → rank).
4. **Sesuai karakter data Fase 3.** Seluruh kriteria bertipe Benefit dengan satuan berbeda (rasio gaji, skor lokasi, cosine skill); normalisasi linear SMARTER menyamakan skala ke [0,1] secara adil.
5. **Personalisasi per mahasiswa.** C1–C5 dihitung relatif terhadap profil tiap mahasiswa (minat, gaji, lokasi, jam, skill), dan rank prioritas dapat diganti per mahasiswa tanpa mengubah struktur model.

## 4. Rumus Utama

### 4.1 Bobot ROC

```
w_j = (1/K) × Σ(k=r_j..K) 1/k ,  K = 5
```

Prioritas default (survei Fase 2) dan bobotnya:

| Rank | Kriteria | Perhitungan | Bobot |
|---|---|---|---|
| 1 | C2 (Gaji) | (1/5)×(1+1/2+1/3+1/4+1/5) | 0,4567 |
| 2 | C4 (Jam kerja) | (1/5)×(1/2+1/3+1/4+1/5) | 0,2567 |
| 3 | C3 (Lokasi) | (1/5)×(1/3+1/4+1/5) | 0,1567 |
| 4 | C1 (Kategori) | (1/5)×(1/4+1/5) | 0,0900 |
| 5 | C5 (Skill) | (1/5)×(1/5) | 0,0400 |
| Total | | | 1,0000 |

### 4.2 Nilai mentah kriteria (Xij)

- C1 = 1,0 jika `job_category` = minat mahasiswa; 0,3 jika beda.
- C2 = `work_salaryperhour / min_expected_salary`.
- C3 = 1,0 jika Remote/se-wilayah; 0,8 sesama Jakarta; 0,4 wilayah lain.
- C4 = max(0, 1 − |work_hours − expected_hours|/20).
- C5 = Cosine(V_mahasiswa, V_lowongan) via TF-IDF, rentang [0,1].

### 4.3 Utilitas linear (normalisasi, semua Benefit)

```
u_j(Xij) = (Xij − Xj_min) / (Xj_max − Xj_min)
```

Jika Xj_max = Xj_min maka u_j = 1. Batas aktual pada sampel ini: C1 [0,3;1,0], C2 [0,7143;1,4286], C3 [0,4;1,0], C4 [0,7;1,0], C5 [0;1].

### 4.4 Skor akhir dan ranking

```
U(Ai) = Σ(j=1..5) w_j × u_j(Xij)
```

Ranking = urutan menurun U(Ai) (`RANK(U, $U$range, 0)`). Tertinggi = Rank 1 = rekomendasi terbaik.

## 5. Tahapan Algoritma (sesuai spreadsheet v2)

1. **Input profil mahasiswa** (baris 2 sheet `SMARTER`): kategori minat, gaji minimum, lokasi, jam ideal, skill.
2. **Bentuk matriks keputusan X** (baris 6–15: 10 alternatif teratas × C1–C5 sesuai rumus §4.2; arsip 221 baris ada di `Data_Lengkap_221`).
3. **Tentukan rank prioritas → bobot ROC** (baris 5 abu-abu, rumus §4.1).
4. **Hitung Xmin/Xmax tiap kriteria** (baris 16–17: `MAX`/`MIN`).
5. **Normalisasi ke utilitas u_j** (blok baris 19–28 kolom B–F, rumus §4.3).
6. **Agregasi skor U(Ai)** (kolom G: `Σ w*u`).
7. **Ranking** (kolom H: `RANK`), **lookup pemenang** (kotak L–M: `VLOOKUP`), tetapkan pemenang di baris KESIMPULAN kuning.

## 6. Arti Setiap Kriteria

| Kode | Nama | Arti | Sifat |
|---|---|---|---|
| C1 | Kesesuaian Kategori | Apakah bidang lowongan sesuai minat mahasiswa (1,0 cocok / 0,3 tidak). | Benefit |
| C2 | Rasio Penawaran Gaji | Gaji per jam relatif terhadap gaji minimum yang diminta (mis. 1,4286 = 42,86% di atas ekspektasi). Bobot terbesar. | Benefit |
| C3 | Aksesibilitas Lokasi | Kemudahan mencapai lokasi (Remote/se-wilayah terbaik). | Benefit |
| C4 | Kesesuaian Jam Kerja | Kedekatan beban jam dengan jam ideal mahasiswa (selisih dibagi 20). | Benefit |
| C5 | Kemiripan Keahlian | Kecocokan skill via TF-IDF cosine similarity (0 = tidak cocok, 1 = cocok penuh). | Benefit |

## 7. Interpretasi Hasil SPK (sampel MHS-101)

Hasil kalkulasi spreadsheet (bobot default C2 > C4 > C3 > C1 > C5):

| Rank | Alternatif | U(Ai) | Mengapa menang |
|---|---|---|---|
| 1 (tie) | JOB-1174 — Scholastic Assessment Test | 0,8700 | C2 max (1,4286), C3 = 1,0 (Remote), C4 = 1,0 |
| 1 (tie) | JOB-1260 — Operator Produksi | 0,8700 | Profil nilai identik dengan JOB-1174 (C2 max, C3 = 1,0, C4 = 1,0) |
| 3 | JOB-1038 — SAT Tutor (Remote) | 0,7889 | C2 max, C3 = 1,0, C4 = 0,8 |
| 4 | JOB-1233 — Mandarin Translator (Part Time) | 0,7831 | C2 tinggi (1,2857), Remote, C4 = 0,9 |
| 5 | JOB-1181 — Guru Ekskul Board Game Tangsel | 0,7333 | C1 = 1,0 (sesuai minat Edukasi), C2 = 1,2857 |

**Alternatif terbaik:** **JOB-1174 dan JOB-1260 (tie, U = 0,8700)**. Fungsi `RANK` Excel memberi keduanya Rank 1 (rank 2 kosong — perilaku standar Excel untuk nilai kembar). Jika dibutuhkan satu pemenang tunggal, dipilih yang C5-nya lebih relevan atau yang kategorinya sesuai minat; dari sisi murni SMARTER keduanya setara.

**Makna praktis:**

- Karena bobot C2 (gaji, 45,67%) dominan, lowongan bergaji tertinggi (1,4286× ekspektasi) dengan lokasi Remote dan jam pas (C4 = 1,0) mengunci posisi teratas meskipun C1-nya hanya 0,3 (kategori tidak sesuai minat) dan C5 = 0.
- C1 = 1,0 saja tidak cukup tanpa gaji dan lokasi yang baik — contoh JOB-1118 (C1 = 1,0, C4 = 1,0) hanya di papan tengah karena C2 = 1,0 (pas ekspektasi) dan C3 = 0,4.
- C5 (bobot 4%) berfungsi sebagai pemecah tie-breaker halus, bukan penentu utama — sesuai desain bahwa skill parsial tidak boleh mengalahkan gaji dan kecocokan jam bagi mahasiswa.
- Mengganti urutan rank di baris 5 (mis. mahasiswa memprioritaskan lokasi) akan mengubah pemenang secara otomatis — inilah keunggulan personalisasi SMARTER.
- Kotak VLOOKUP (sel kuning `M4`): ketik rank 1–10 untuk menampilkan judul dan nilai pemenangnya tanpa mencari manual di tabel.

**Batas interpretasi:** hasil ini berlaku untuk profil MHS-101 saja. Mahasiswa lain (minat, gaji, lokasi, jam, skill berbeda) menghasilkan matriks X dan ranking berbeda.

## 8. Struktur Folder & Cara Jalan

```
phase-3/
├── src/                 # Pipeline Fase 3 (satu file = satu tugas CRISP-DM)
│   ├── config.py            # Konstanta & path terpusat
│   ├── filtering.py         # 6 lapisan filtering (§2.3 laporan)
│   ├── imputation.py        # Missing values (§3.1)
│   ├── standardization.py   # Outlier & standardisasi (§3.2)
│   ├── encoding.py          # Encoding sistem kerja (§4.1)
│   ├── nlp.py + skill_similarity.py  # TF-IDF & cosine C5 (§4.2)
│   ├── locations.py         # Standardisasi lokasi
│   ├── decision_matrix.py   # Matriks C1–C5 (§5)
│   └── pipeline.py          # Orkestrasi run_phase_3_pipeline()
├── scripts/             # Utilitas sekali-jalan
│   ├── generate_raw_data.py   # Scraping → data/raw/
│   ├── build_notebook.py      # Generate notebooks/*.ipynb
│   ├── enrich_company_logos.py# Tambah kolom company_logo
│   └── sync_web_data.py       # Salin data/processed/ → web/public/data/
├── data/
│   ├── raw/             # raw_job_postings.csv, raw_student_preferences.csv
│   └── processed/       # clean_*.csv, decision_matrix_sample.csv (output resmi)
├── notebooks/           # phase_3_data_preparation.ipynb (Colab-ready)
├── docs/                # Laporan, panduan PPT, spreadsheet SMARTER
├── web/                 # Frontend portal (React + Vite)
└── requirements.txt
```

```bash
pip install -r requirements.txt
python -m src.pipeline            # jalankan Fase 3 → data/processed/ (+ auto-sinkron web)
python scripts/build_notebook.py  # regenerate notebook bila src/ berubah
```
