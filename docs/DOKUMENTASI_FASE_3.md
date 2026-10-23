# Laporan Teknis CRISP-DM Fase 3 — Data Preparation

**Proyek:** Sistem Pendukung Keputusan Rekomendasi Pekerjaan _Part-Time_ untuk Mahasiswa Menggunakan Metode _Simple Multi-Attribute Rating Technique Exploiting Ranks_ (SMARTER)  
**Studi Kasus:** Mahasiswa Program Studi Informatika, Universitas Kristen Krida Wacana (UKRIDA)  
**Metodologi:** CRISP-DM (_Cross-Industry Standard Process for Data Mining_) — Fase 3 dari 6  
**Tahun:** 2026

---

## Tim Penyusun Proyek

- **412024022** — Brandon Jeremiah Sutedja
- **412024043** — Andrew Linardi
- **412025014** — Raffael Benediktus Lolaroh
- **412025021** — Michael Aaron Sipahutar

**Program Studi Informatika, Fakultas Teknologi Cerdas**  
**Universitas Kristen Krida Wacana (UKRIDA), Jakarta**

---

## 1. Ringkasan Eksekutif & Batasan Lingkup Fase 3

Dokumen ini menyajikan dokumentasi teknis pelaksanaan **Fase 3: Data Preparation** dalam siklus hidup CRISP-DM. Tujuan utama dari fase ini adalah mengolah data mentah yang bising (_noisy_), tidak terstruktur, dan memiliki inkonsistensi dari portal kerja daring serta kuesioner mahasiswa menjadi kumpulan data terstruktur, bersih, terstandardisasi, dan siap diumpankan ke algoritma pemodelan Sistem Pendukung Keputusan (SPK) pada Fase 4.

> [!IMPORTANT]
> **Lingkup Dokumen Ini:**  
> Dokumen ini khusus membahas **Fase 3 (Data Preparation)**. Fase lanjutan sudah diimplementasikan pada proyek ini: **Fase 4 (Modeling) — SMARTER + ROC** di `web/src/lib/spk.ts` dan `web/src/lib/roc.ts`, serta **Fase 5 (Evaluation)** di `scripts/eval_spk.py`. Deliverable utama fase ini adalah:
>
> 1. Dataset lowongan _part-time_ bersih (`clean_jobs_dataset.csv`).
> 2. Dataset preferensi mahasiswa UKRIDA bersih (`clean_students_dataset.csv`).
> 3. Matriks Keputusan $M \times N$ (`decision_matrix_sample.csv`) yang memuat nilai numerik dari lima kriteria keputusan ($C_1$ hingga $C_5$).

---

## 2. Arsitektur Decoupled Data Pipeline

Sistem memisahkan secara tegas antara modul pengumpulan/penyucian data (_Offline Data Preparation_) dan modul pemodelan personalisasi rekomendasi (_Online Decision Modeling_):

```text
[ SUMBER DATA MENTAH ]
  ├── 535 Data Lowongan Kerja Hasil Scraping Resmi ('raw_job_postings.csv')
  └── 55 Data Kuesioner Preferensi Mahasiswa UKRIDA ('raw_student_preferences.csv')
        │
        ▼
[ TAHAP 1: SELEKSI & FILTERING DATA 6 LAPISAN ]
  ├── L1: Deduplikasi Data (ID, URL, & Cross-Platform)             -> Tereduksi 130 baris
  ├── L2: Negative Keyword Filtering (Pure Part-Time: Buang Freelance/Fulltime/Magang) -> Tereduksi 13 baris
  ├── L3: Student Feasibility Filtering (Jam Kerja > 30 jam)       -> Tereduksi 1 baris
  ├── L4: Salary Anomaly & Anti-Scam (< Rp10rb / > Rp200rb/jam)    -> Tereduksi 2 baris
  ├── L5: Geographic Filtering (Non-Jabodetabek Onsite)            -> Tereduksi 166 baris
  └── L6: Completeness & Live Link Sanity Check (Bebas 404)        -> Tereduksi 2 baris
        │
        ▼ Sisa: 221 Lowongan Kerja Valid (100% HTTP 200 Aktif, Jabodetabek / Remote)
[ TAHAP 2: PENANGANAN MISSING VALUES ]
  ├── Job Postings: Imputasi Median per Kategori untuk 'work_salaryperhour' & 'work_hours'
  ├── Job Postings: Imputasi Modus ('Onsite') untuk 'work_system'
  ├── Job Postings: Imputasi Teks Default ('Komunikasi, Time Management') untuk 'skills'
  └── Kuesioner Mahasiswa: Listwise Deletion (55 -> 52 responden lengkap)
        │
        ▼
[ TAHAP 3: OUTLIER HANDLING & FORMAT STANDARDIZATION ]
  ├── Capping Batas Logis Gaji: [Rp10.000, Rp150.000] / jam
  ├── Capping Jam Kerja Mahasiswa: <= 30 jam/minggu
  ├── Standardisasi Lokasi: Penyeragaman ke format resmi Jabodetabek ("Jakarta Barat", dll.)
  └── Privasi Mahasiswa: Penghapusan student_nim dan timestamp
        │
        ▼
[ TAHAP 4: CATEGORICAL ENCODING ]
  └── Transformasi Fitur 'work_system': Remote = 1, Hybrid = 2, Onsite = 3
        │
        ▼
[ TAHAP 5: TEXT MINING KEAHLIAN (NLP & COSINE SIMILARITY) ]
  ├── NLP Preprocessing: Case Folding, Punctuation Cleaning, Tokenizing, Stopword Removal (ID+EN)
  ├── Vektorisasi TF-IDF pada korpus keahlian mahasiswa dan lowongan
  └── Kalkulasi Cosine Similarity -> Menghasilkan skor kontinu [0.0 - 1.0] untuk Kriteria C5
        │
        ▼
[ TAHAP 6: KONSTRUKSI MATRIKS KEPUTUSAN M x N (FITUR SPK) ]
  └── Menghasilkan Matriks Fitur C1 - C5 untuk setiap alternatif lowongan pekerjaan
        │
        ▼
[ ARTEFAK AKHIR FASE 3 ]
  ├── 'clean_jobs_dataset.csv' (221 lowongan part-time terverifikasi)
  ├── 'clean_students_dataset.csv' (52 profil preferensi mahasiswa)
  └── 'decision_matrix_sample.csv' (221 alternatif x 13 atribut fitur)
        │
        └──> DIUMPANKAN KE FASE 4 (MODELING SMARTER — web/src/lib/spk.ts)
```

---

## 3. Kamus Data (Data Dictionary)

### 3.1 Dataset Mentah Lowongan Kerja (`raw_job_postings.csv`)

| Nama Atribut           | Tipe Data   | Deskripsi                                    | Contoh Nilai                                    |
| ---------------------- | ----------- | -------------------------------------------- | ----------------------------------------------- |
| `job_id`               | String      | Pengenal unik lowongan dari scraper          | `JOB-1001`                                      |
| `job_title`            | String      | Nama posisi pekerjaan mentah                 | `Barista Cafe Part-Time`, `Guru Privat Matematika` |
| `company_name`         | String      | Nama instansi / perusahaan penyedia lowongan | `PT Mitra Kuliner Nusantara`                    |
| `job_category`         | Categorical | 10 Kategori bidang pekerjaan portal kerja    | `Education & Tutoring`, `Food & Beverage (F&B)` |
| `work_salaryperhour`   | Float       | Penawaran honor per jam (Rupiah) mentah      | `35000.0` (dapat memuat NaN)                    |
| `work_job_location`    | String      | Teks lokasi mentah sebelum standarisasi      | `Jakbar`, `Tanjung Duren`, `Surabaya`           |
| `work_hours`           | Float       | Beban jam kerja per minggu                   | `18.0` (dapat memuat NaN)                       |
| `work_system`          | Categorical | Sistem kehadiran kerja                       | `Remote`, `Hybrid`, `Onsite` (dapat memuat NaN) |
| `work_required_skills` | Text        | Deskripsi syarat keahlian dari portal        | `espresso, manual brew, ramah, kebersihan bar`  |
| `source_portal`        | String      | Sumber portal kerja resmi                    | `Glints`, `Loker.id`, `KitaLulus`, `Kalibrr`    |
| `url`                  | String      | Tautan valid menuju postingan asli (HTTP 200)| `https://glints.com/id/opportunities/jobs/...`  |
| `date_posted`          | Date        | Tanggal publikasi lowongan                   | `2026-03-20`                                    |

### 3.2 Dataset Bersih Hasil Seleksi & Imputasi (`clean_jobs_dataset.csv`)

| Nama Atribut            | Tipe Data   | Deskripsi                               | Perubahan / Transformasi                        |
| ----------------------- | ----------- | --------------------------------------- | ----------------------------------------------- |
| `job_id`                | String      | Pengenal unik yang lolos deduplikasi    | Bersih dari duplikat                            |
| `job_title`             | String      | Judul posisi part-time terverifikasi    | Bebas dari `full-time`, `freelance`, `magang`   |
| `company_name`          | String      | Nama instansi penyedia kerja            | Standarisasi format string                      |
| `job_category`          | Categorical | Kategori bidang terstandarisasi         | 10 kategori industri resmi                      |
| `work_salaryperhour`    | Float       | Upah per jam terimputasi & ter-bounding | Imputasi median kategori, dibatasi [10k, 150k]  |
| `work_job_location`     | String      | Lokasi kerja terstandarisasi            | Diseragamkan ke area Jabodetabek / Remote       |
| `work_hours`            | Float       | Jam kerja per minggu terimputasi        | Imputasi median kategori, dibatasi $\le 30$ jam |
| `work_system`           | String      | Sistem kehadiran kerja terimputasi      | Imputasi modus ("Onsite" jika kosong)           |
| `work_system_encoded`   | Integer     | Transformasi numerik sistem kerja       | Remote = 1, Hybrid = 2, Onsite = 3              |
| `work_required_skills`  | Text        | Teks keahlian asli terimputasi          | Imputasi default jika kosong                    |
| `clean_required_skills` | Text        | Teks keahlian hasil NLP preprocessing   | Huruf kecil, tanpa simbol & stopword            |
| `source_portal`         | String      | Portal asal pekerjaan                   | Glints, Loker.id, KitaLulus, Kalibrr            |
| `url`                   | String      | Tautan live terverifikasi (HTTP 200)    | 100% URL aktif & bebas bot/authwall/404         |
| `date_posted`           | Date        | Tanggal posting lowongan                | Format YYYY-MM-DD                               |

### 3.3 Matriks Keputusan Sampel (`decision_matrix_sample.csv`)

Matriks berdimensi $221 \times 13$ ini memuat 5 kriteria utama yang dihitung terhadap profil mahasiswa evaluator:

| Kolom Fitur          | Sifat   |   Rentang Nilai   | Formula Matematika                                                                           |
| -------------------- | ------- | :---------------: | -------------------------------------------------------------------------------------------- |
| `C1_kategori`        | Benefit | $[0{,}3 ; 1{,}0]$ | $1{,}0$ jika kategori sama dengan minat mahasiswa, $0{,}3$ jika berbeda                      |
| `C2_rasio_gaji`      | Benefit |    $\ge 0{,}0$    | $\frac{\text{work\_salaryperhour}}{\text{min\_expected\_salary}}$                            |
| `C3_lokasi`          | Benefit | $[0{,}4 ; 1{,}0]$ | $1{,}0$ (Remote / Se-wilayah), $0{,}8$ (Sesama Jakarta), $0{,}4$ (Wilayah Lain)              |
| `C4_jam_kerja`       | Benefit | $[0{,}0 ; 1{,}0]$ | $\max\left(0{,}0, 1{,}0 - \frac{|\text{work\_hours} - \text{student\_expected\_hours}|}{20}\right)$ |
| `C5_kemiripan_skill` | Benefit | $[0{,}0 ; 1{,}0]$ | $\text{Cosine Similarity}(\vec{V}_{\text{mahasiswa}}, \vec{V}_{\text{lowongan}})$ via TF-IDF |

---

## 4. Evaluasi Corong Penyaringan Data (6-Layer Filtering Funnel)

Berdasarkan eksekusi pada 535 data mentah awal dari 4 portal resmi, berikut statistik eliminasi data baris per baris:

```text
========================================================================================
Tahapan Filtering                                  | Sisa Baris | Tereduksi | Persentase
----------------------------------------------------------------------------------------
1. Total Data Mentah Awal                          | 535        | 0         | 100.0%
2. Pasca Deduplikasi (Exact & Cross-Platform)      | 405        | 130       | 75.7%
3. Pasca Filter Kata Kunci Negatif (Pure Part-Time)| 392        | 13        | 73.3%
4. Pasca Filter Kelayakan Beban Mahasiswa (<= 30)  | 391        | 1         | 73.1%
5. Pasca Filter Anomali Gaji & Anti-Scam           | 389        | 2         | 72.7%
6. Pasca Filter Geografis (Jabodetabek / Remote)   | 223        | 166       | 41.7%
7. Pasca Filter Kelengkapan Data & Validasi Link   | 221        | 2         | 41.3%
========================================================================================
Total Data Bersih Akhir: 221 Lowongan (Tingkat Retensi: 41,3% | Tereliminasi: 58,7%)
```

### Rincian Alasan Eliminasi:

1. **Deduplikasi (130 data):** Menghindari bias pembobotan ganda dari duplikasi ID, URL, maupun perusahaan yang memposting lowongan identik di lintas portal sekaligus.
2. **Kata Kunci Negatif (13 data):** Mengeliminasi peran non-part-time: lowongan _Full-Time Staff_, _Freelance_ (proyek lepas), _Supervisor_, _Manager_, atau program _Internship / Magang_ yang mewajibkan komitmen penuh.
3. **Kelayakan Jam Kerja (1 data):** Lowongan yang menuntut $\gt 30$ jam/minggu (bahkan hingga 40–48 jam/minggu) dieliminasi karena mustahil dijalankan mahasiswa UKRIDA yang memiliki beban SKS perkuliahan reguler.
4. **Anomali Gaji & Anti-Scam (2 data):** Menghilangkan lowongan berskema komisi murni tanpa gaji dasar (MLM) atau penipuan berbayar berbasis klik iklan.
5. **Geografis Jabodetabek (166 data):** Menghilangkan lowongan _onsite_ di luar daerah (seperti Surabaya, Bandung, Bali, Medan) yang tidak dapat dihadiri secara fisik oleh mahasiswa UKRIDA di Tanjung Duren, Jakarta Barat.
6. **Kelengkapan Esensial & Validasi Link (2 data):** Memastikan seluruh data memiliki judul pekerjaan dan tautan lamaran aktif HTTP 200 (mengeliminasi postingan kedaluwarsa yang diarahkan ke 404).

---

## 5. Penanganan Missing Values & Outlier

### 5.1 Penanganan Missing Values pada Data Lowongan

| Atribut                |  Missing Awal  | Metode Penanganan                                  | Rationale / Alasan Ilmiah                                                                                    |
| ---------------------- | :------------: | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `work_salaryperhour`   | 49 baris (~9%) | Imputasi **Median** per `job_category`             | Median bersifat _robust_ (kebal) terhadap pencilan gaji ekstrem dibandingkan rata-rata (_mean_).             |
| `work_hours`           | 28 baris (~5%) | Imputasi **Median** per `job_category`             | Menjaga distribusi durasi kerja tetap representatif sesuai karakteristik bidang kerjanya.                    |
| `work_system`          | 7 baris (~1%)  | Imputasi **Modus** (`"Onsite"`)                    | Sebagian besar lowongan yang tidak mencantumkan sistem kerja mengasumsikan kehadiran fisik di lokasi kantor. |
| `work_required_skills` | 3 baris (<1%)  | Imputasi Default (`"Komunikasi, Time Management"`) | Soft skills universal yang selalu disyaratkan pada pekerjaan tingkat mahasiswa.                              |

### 5.2 Penanganan Missing Values pada Data Mahasiswa

Dari 55 respons kuesioner mahasiswa UKRIDA, ditemukan **3 respons tidak lengkap** (tidak mengisi ekspektasi gaji atau deskripsi keahlian). Sesuai metodologi CRISP-DM, diterapkan **Listwise Deletion** sehingga menghasilkan **52 data mahasiswa valid dan lengkap**.

### 5.3 Standardisasi Format & Batas Outlier

- **Standardisasi Teks Lokasi:** Penulisan slang/singkatan diseragamkan dengan _lookup dictionary_:
  - `"Jakbar"`, `"Jkt Barat"`, `"Tanjung Duren"`, `"Grogol"` $\rightarrow$ **`"Jakarta Barat"`**
  - `"Jaksel"`, `"Jkt Selatan"` $\rightarrow$ **`"Jakarta Selatan"`**
  - `"Tangsel"` $\rightarrow$ **`"Tangerang Selatan"`**
- **Batas Gaji Wajar:** Nilai gaji dibatasi (_clipping_) pada rentang $\text{Rp}10.000 - \text{Rp}150.000$ per jam.
- **Batas Jam Kerja:** Dibatasi maksimal 30 jam per minggu.
- **Perlindungan Privasi:** Kolom `student_nim` dan `timestamp` dihapus sebelum proses pembentukan matriks keputusan.

---

## 6. Categorical Encoding

Fitur kategorikal `work_system` ditransformasikan menjadi representasi diskret ordinal/numerik untuk kebutuhan pemodelan:

$$
\text{work\_system\_encoded} = \begin{cases}
1, & \text{jika } \text{Remote} \\
2, & \text{jika } \text{Hybrid} \\
3, & \text{jika } \text{Onsite}
\end{cases}
$$

**Distribusi Data Bersih Pasca Encoding:**

- Onsite (3): 138 lowongan (62,4%)
- Hybrid (2): 55 lowongan (24,9%)
- Remote (1): 28 lowongan (12,7%)

---

## 7. Text Mining Keahlian: NLP & Cosine Similarity ($C_5$)

### 7.1 Pipeline NLP Preprocessing

Untuk mengukur kecocokan keahlian mahasiswa dengan kualifikasi lowongan kerja secara objektif, teks keahlian diproses melalui 4 tahapan NLP:

1. **Case Folding:** Mengubah seluruh teks menjadi huruf kecil (_lowercase_).
2. **Punctuation & Noise Removal:** Menghapus tanda baca, koma, titik dua, simbol peluru (_bullet points_), dan angka menggunakan _regex_ `[^a-zA-Z\s]`.
3. **Tokenization:** Memecah kalimat menjadi token kata individual.
4. **Bilingual Stopword Removal:** Mengeliminasi 50+ kata sambung umum dalam Bahasa Indonesia dan Bahasa Inggris yang tidak memiliki nilai diskriminatif keahlian.

### 7.2 Vektorisasi TF-IDF (Term Frequency - Inverse Document Frequency)

Setiap teks keahlian direpresentasikan ke dalam ruang vektor berdimensi $p$:

$$w_{t, d} = \text{TF}(t, d) \times \log\left(\frac{N}{\text{DF}(t)}\right)$$

Di mana $N$ adalah total dokumen dalam korpus (keahlian mahasiswa + seluruh alternatif lowongan).

### 7.3 Kalkulasi Cosine Similarity

Derajat kemiripan antara vektor profil mahasiswa ($\vec{V}_S$) dan vektor lowongan pekerjaan ($\vec{V}_A$) dihitung menggunakan _Cosine Similarity_:

$$\text{Cosine Similarity}(\vec{V}_S, \vec{V}_A) = \frac{\vec{V}_S \cdot \vec{V}_A}{\|\vec{V}_S\| \|\vec{V}_A\|} = \frac{\sum_{k=1}^p V_{S,k} V_{A,k}}{\sqrt{\sum_{k=1}^p V_{S,k}^2} \sqrt{\sum_{k=1}^p V_{A,k}^2}}$$

**Interpretasi Nilai Output $C_5 \in [0{,}0 ; 1{,}0]$:**

- **$0{,}0000$ (Nol):** Tidak ada kata kunci keahlian yang cocok sama sekali.
- **$1{,}0000$ (Sempurna):** Seluruh kata kunci keahlian mahasiswa sesuai persis dengan kebutuhan lowongan.
- **$0{,}0500 - 0{,}9000$ (Kecocokan Parsial):** Mengukur derajat kesesuaian gradual yang realistis.

---

## 8. Konstruksi Matriks Keputusan $M \times N$

Produk pamungkas dari Fase 3 adalah **Matriks Keputusan $M \times N$** ($221 \text{ baris} \times 13 \text{ kolom}$), di mana setiap baris merepresentasikan alternatif lowongan ($A_i$) dan kolom memuat nilai numerik dari 5 kriteria evaluasi ($C_1 - C_5$):

$$
\mathbf{X} = \begin{bmatrix}
X_{1,1} & X_{1,2} & X_{1,3} & X_{1,4} & X_{1,5} \\
X_{2,1} & X_{2,2} & X_{2,3} & X_{2,4} & X_{2,5} \\
\vdots & \vdots & \vdots & \vdots & \vdots \\
X_{m,1} & X_{m,2} & X_{m,3} & X_{m,4} & X_{m,5}
\end{bmatrix}
$$

### Contoh Cuplikan Matriks Keputusan Hasil Eksekusi:

| Job ID     | Judul Lowongan                     | $C_1$ (Kategori) | $C_2$ (Rasio Gaji) | $C_3$ (Lokasi) | $C_4$ (Jam Kerja) | $C_5$ (Skill Cosine) |
| ---------- | ---------------------------------- | :--------------: | :----------------: | :------------: | :---------------: | :------------------: |
| `JOB-1118` | Part Time English Teacher          |      1.0000      |       1.1429       |     1.0000     |      0.9000       |        0.0611        |
| `JOB-1155` | Barista Cafe Specialty Coffee      |      0.3000      |       1.0000       |     1.0000     |      0.9000       |        0.1484        |
| `JOB-1246` | Data Entry & Admin Office Support  |      0.3000      |       0.8571       |     1.0000     |      0.8000       |        0.0000        |
| `JOB-1085` | Tutor Matematika & IPA Privat      |      1.0000      |       1.2857       |     0.8000     |      1.0000       |        0.0516        |
| `JOB-1007` | Graphic Designer Part-Time         |      0.3000      |       1.0000       |     1.0000     |      0.9000       |        0.0000        |

---

## 9. Kesimpulan & Kelanjutan ke Fase 4 (Modeling)

Fase 3 (Data Preparation) telah berhasil diselesaikan dengan capaian sebagai berikut:

1. Menghasilkan **221 lowongan kerja part-time murni dan bersih** (bebas dari freelance, full-time, magang, dan peran manajerial) dari 535 data mentah awal melalui penyaringan 6 lapisan ilmiah di 10 kategori industri beragam.
2. Memvalidasi **52 data preferensi mahasiswa UKRIDA** yang bebas dari _missing values_ dan telah dianonimisasi untuk privasi.
3. Mengonversi teks keahlian menjadi nilai numerik kontinu melalui **NLP TF-IDF & Cosine Similarity** ($C_5$).
4. Membentuk **Matriks Keputusan $M \times N$** ($221 \times 13$) yang tersimpan pada `decision_matrix_sample.csv`.

Dengan terbentuknya matriks keputusan ini, **tahap Data Preparation selesai** dan matriks tersebut **telah diolah pada Fase 4 (Modeling)**: pembobotan ROC (_Rank Order Centroid_) dan kalkulasi fungsi utilitas linear SMARTER diimplementasikan di `web/src/lib/roc.ts` dan `web/src/lib/spk.ts`. Evaluasi Fase 5 (`scripts/eval_spk.py`) mencatat juara stabil pada **39/49 responden riil** dan **40/52 responden mock**.

---

## Adendum 2026-10-13 — Data Real GForm + Perbaikan Fase 4

1. **Data real masuk.** 50 respons GForm (`data/raw/raw-real-students/Survei_GformResponses_1.csv`)
   dikonversi via `scripts/process_gform.py` menjadi `raw_real_student_preferences.csv`,
   dibersihkan menjadi `clean_real_student.csv` (**49 responden**; MHS-R022 ter-drop karena skill kosong).
   Dataset mock (55→52) tetap dipertahankan sebagai pembanding; pipeline memilih via
   `python -m src.pipeline --source mock|real`. Layout `data/` dirapikan
   (`raw-jobs/`, `raw-mock-students/`, `raw-real-students/`, `cleaned-jobs/`,
   `cleaned-mock-students/`, `cleaned-real-students/`, `matrix/`).
2. **IDF distabilkan.** `TfidfVectorizer` kini di-fit pada korpus lowongan saja
   (sebelumnya sampel+lowongan sehingga IDF bergeser per mahasiswa);
   `vocabulary_` + `idf_` diekspor ke `matrix/tfidf_skills.json` untuk dipakai web.
3. **C2 di-cap 2.0** (`src/config.py C2_RATIO_CAP`) sebelum normalisasi agar outlier gaji
   tidak mendominasi.
4. **Hasil evaluasi** (`scripts/eval_spk.py`, bobot default survei Fase 2 C2>C4>C3>C1>C5):
   juara stabil (sama di ≥3/5 skenario leader) pada **39/49 responden real** dan 40/52 mock;
   bigram (1,2) vs unigram overlap top-10 = **1.000** (tetap unigram, berbasis bukti);
   variasi nilai non-match C1 {0.2, 0.5} overlap top-5 = **1.000**
   (normalisasi min-max menghapus nilai absolut C1 — hanya urutan yang berpengaruh).
