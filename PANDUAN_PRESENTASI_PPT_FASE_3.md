# Panduan Rancangan Slide Presentasi PPT — CRISP-DM Fase 3: Data Preparation

**Proyek:** Sistem Pendukung Keputusan Rekomendasi Pekerjaan _Part-Time_ untuk Mahasiswa Menggunakan Metode SMARTER  
**Studi Kasus:** Mahasiswa Informatika, Fakultas Teknologi Cerdas, Universitas Kristen Krida Wacana (UKRIDA)  
**Tujuan Dokumen:** Memberikan panduan terstruktur per slide untuk presentasi progres evaluasi akademik (Fase 3: Data Preparation).

---

## Ringkasan Struktur Presentasi

- **Total Durasi Presentasi:** 10 – 15 Menit
- **Total Slide:** 9 Slide
- **Fokus Utama:** Mendemonstrasikan bahwa data mentah hasil _scraping_ telah disucikan, disaring dari data anomali/bodong melalui **6 Lapisan Filtering**, ditangani nilai hilangnya, diolah teks keahliannya melalui **TF-IDF & Cosine Similarity**, hingga terbentuk **Matriks Keputusan $M \times N$** yang siap masuk ke Fase 4 (Modeling).

---

## Rincian Panduan Slide per Slide

```text
[Slide 1] Ringkasan Arsitektur Decoupled Data Pipeline
[Slide 2] Pengumpulan Data Mentah (535 Lowongan & 55 Mahasiswa)
[Slide 3] 6 Lapisan Filtering: Corong Eliminasi Data (Data Funnel)
[Slide 4] Penanganan Missing Values (Imputasi Median & Listwise Deletion)
[Slide 5] Penanganan Outlier & Standardisasi Format Lokasi
[Slide 6] Categorical Encoding (Sistem Kerja)
[Slide 7] Text Mining Keahlian: NLP, TF-IDF & Cosine Similarity (C5)
[Slide 8] Produk Akhir: Matriks Keputusan M x N (Kriteria C1 - C5)
[Slide 9] Kesimpulan Progres Fase 3 & Kesiapan Menuju Fase 4
```

---

### Slide 1: Ringkasan Arsitektur Decoupled Data Pipeline

- **Judul Slide:** Arsitektur Decoupled Data Pipeline — Offline Preparation vs Online Modeling
- **Visual:** Diagram alir vertikal 6 tahap: Input Mentah $\rightarrow$ Filtering $\rightarrow$ Missing Values $\rightarrow$ Outlier & Standardisasi $\rightarrow$ Encoding & Text Mining $\rightarrow$ Matriks Keputusan.
- **Poin Kunci di Slide (ringkas):**
  - **Input:** 535 lowongan (`raw_job_postings.csv`) + 55 kuesioner mahasiswa (`raw_student_preferences.csv`).
  - **Tahap 1 — Filtering 6 Lapisan:** Deduplikasi, Negative Keyword, Feasibility Jam >30, Anomali Gaji/Anti-Scam, Geografis Jabodetabek, Completeness & Link Check $\rightarrow$ sisa **221 lowongan valid**.
  - **Tahap 2 — Missing Values:** Median per kategori (gaji & jam), Modus Onsite (sistem kerja), default teks skills; Listwise Deletion kuesioner $\rightarrow$ **52 responden**.
  - **Tahap 3 — Outlier & Standardisasi:** Capping gaji [Rp10rb–Rp150rb], jam $\le$ 30, penyeragaman lokasi Jabodetabek, hapus NIM/timestamp.
  - **Tahap 4 — Encoding:** `work_system`: Remote = 1, Hybrid = 2, Onsite = 3.
  - **Tahap 5 — Text Mining:** NLP + TF-IDF + Cosine Similarity $\rightarrow$ skor C5 [0.0–1.0].
  - **Tahap 6 — Output:** Matriks Keputusan C1–C5 $\rightarrow$ `clean_jobs_dataset.csv`, `clean_students_dataset.csv`, `decision_matrix_sample.csv` — siap ke Fase 4.
- 🎙️ **Speaker Notes (1 Menit):**
  > _"Sistem kami memakai arsitektur decoupled: modul offline menyiapkan data, modul online melakukan rekomendasi. Dari 535 lowongan dan 55 kuesioner, data disaring 6 lapis menjadi 221 lowongan valid, dilengkapi imputasi missing values, capping outlier, encoding, dan text mining TF-IDF untuk C5, hingga terbentuk matriks keputusan C1–C5 yang siap diumpankan ke modeling SMARTER di Fase 4."_

---

### Slide 2: Pengumpulan Data Mentah (_Data Ingestion_)

- **Judul Slide:** Pengumpulan Data Mentah (Raw Ingestion)
- **Visual:** Tabel perbandingan sumber data dan jumlah rekaman.
- **Poin Kunci di Slide:**
  - **Dataset 1: Lowongan Pekerjaan (`raw_job_postings.csv`)**
    - Total: **535 baris data mentah**.
    - Sumber: 4 Portal Lowongan Resmi Terpercaya di Indonesia (Glints, Loker.id, KitaLulus, Kalibrr).
    - Memanfaatkan fitur filter bawaan masing-masing portal (*native filter* `jobTypes=PART_TIME` di Glints dan `/tipe-pekerjaan/paruh-waktu` di Loker.id).
    - Memuat 10 kategori industri yang beragam (F&B, Tutoring, Retail, Media, IT, Desain, Sales, Admin, CS, Logistik).
  - **Dataset 2: Kuesioner Preferensi Mahasiswa (`raw_student_preferences.csv`)**
    - Total: **55 responden mahasiswa UKRIDA**.
    - Memuat ekspektasi upah, ketersediaan jam kerja, domisili, dan daftar keahlian mahasiswa.
- 🎙️ **Speaker Notes (1 Menit):**
  > _"Dari hasil scraping langsung dari portal kerja resmi menggunakan filter bawaan portal serta penyebaran kuesioner mahasiswa, kami mengumpulkan 535 data mentah lowongan kerja dari Glints, Loker.id, KitaLulus, dan Kalibrr, serta 55 sampel kuesioner mahasiswa UKRIDA. Seluruh data mencakup 10 kategori pekerjaan yang beragam. Namun, data mentah tetap memiliki anomali seperti duplikasi, peran freelance atau full-time terselip, penipuan iklan, serta lowongan di luar area Jabodetabek."_

---

### Slide 3: 6 Lapisan Filtering (Corong Eliminasi Data) — _SLIDE KUNCI!_

- **Judul Slide:** Langkah 1 — 6 Lapisan Rule-Based Filtering (Data Funnel)
- **Visual:** **Grafik Corong (Funnel Chart)** atau diagram batang horizontal: $535 \rightarrow 405 \rightarrow 392 \rightarrow 391 \rightarrow 389 \rightarrow 223 \rightarrow 221$.
- **Poin Kunci di Slide (Tabel Reduksi):**
  - **L1: Deduplikasi (-130 data):** Membuang duplikat ID, URL, dan duplikasi lintas portal (*cross-platform*).
  - **L2: Negative Keywords (-13 data):** Membuang lowongan non-part-time (*freelance/proyek lepas*, *full-time*, *permanent*, *magang*, *internship*, *manager*, *supervisor*).
  - **L3: Kelayakan Jam Mahasiswa (-1 data):** Membuang lowongan dengan beban jam kerja $> 30$ jam/minggu.
  - **L4: Anomali Gaji & Anti-Scam (-2 data):** Membuang komisi murni tanpa gaji pokok, MLM, klik iklan, atau gaji di luar $[\text{Rp}10.000, \text{Rp}200.000]$/jam.
  - **L5: Geografis Jabodetabek (-166 data):** Membuang lowongan _onsite_ di luar daerah (Surabaya, Bandung, Bali, Yogyakarta, Medan).
  - **L6: Kelengkapan Esensial & Validasi Link (-2 data):** Membuang lowongan tanpa judul atau tautan kedaluwarsa (redirect 404).
  - **HASIL BERSIH:** **221 Lowongan Kerja Part-Time Murni (Retensi 41,3% | 100% HTTP 200 Aktif | 100% Jabodetabek / Remote | 10 Kategori Industri)**.
- 🎙️ **Speaker Notes (2.5 Menit):**
  > _"Inilah inti dari penyaringan data kami. Dari 535 data mentah, kami menyaringnya melalui 6 lapisan aturan ketat. Sebanyak 130 data tereliminasi pada deduplikasi. Sebanyak 13 lowongan dibuang karena merupakan peran freelance lepas, full-time, atau magang korporat. Sebanyak 166 lowongan dieliminasi karena berlokasi di luar Jabodetabek. Terakhir, seluruh link divalidasi hingga 100% aktif tanpa 404. Pada akhirnya, tersaring **221 lowongan kerja part-time murni yang 100% bersih, aman, up to date, berlokasi di Jabodetabek / Remote, dan terverifikasi** bagi mahasiswa UKRIDA."_

---

### Slide 4: Penanganan Missing Values (Nilai Hilang)

- **Judul Slide:** Langkah 2 — Penanganan Nilai Hilang (Missing Values)
- **Visual:** Tabel _Before vs After_ jumlah missing values per atribut.
- **Poin Kunci di Slide:**
  - **Data Lowongan (Job Portal):**
    - `work_salaryperhour` (39 kosong) $\rightarrow$ Diimputasi menggunakan **Median per Kategori**. _(Alasan: Median tahan terhadap outlier dibanding rata-rata)._
    - `work_hours` (29 kosong) $\rightarrow$ Diimputasi menggunakan **Median per Kategori**.
    - `work_system` (12 kosong) $\rightarrow$ Diimputasi dengan **Modus** (`"Onsite"`).
    - `work_required_skills` (7 kosong) $\rightarrow$ Diimputasi nilai bawaan (_"Komunikasi, Time Management"_).
  - **Data Mahasiswa (Kuesioner):**
    - Diterapkan **Listwise Deletion** pada 3 data responden yang tidak lengkap $\rightarrow$ menghasilkan **52 data mahasiswa valid 100%**.
- 🎙️ **Speaker Notes (1.5 Menit):**
  > _"Di dunia nyata, tidak semua poster lowongan mencantumkan gaji dan jam kerja. Kami menggunakan imputasi Median per kategori pekerjaan agar nilai yang diisi tidak terdistorsi oleh angka ekstrem. Sementara untuk data mahasiswa, kami menerapkan Listwise Deletion karena data preferensi pengguna wajib lengkap agar perhitungan SPK tidak bias."_

---

### Slide 5: Penanganan Outlier & Standardisasi Format

- **Judul Slide:** Langkah 3 — Penanganan Outlier & Standardisasi Format
- **Visual:** Contoh tabel transformasi penulisan teks lokasi dan batas numerik (_clipping_).
- **Poin Kunci di Slide:**
  - **Batas Logis Numerik (Outlier Capping):**
    - Gaji dibatasi pada rentang wajar: $[\text{Rp}10.000 - \text{Rp}150.000]$ / jam.
    - Jam kerja mahasiswa dibatasi maksimal 30 jam / minggu.
  - **Standardisasi Teks Lokasi:**
    - Mengatasi inkonsistensi penulisan: _"Jakbar"_, _"Jkt Barat"_, _"Tanjung Duren"_, _"Grogol"_ diseragamkan menjadi **`"Jakarta Barat"`**.
  - **Perlindungan Privasi Mahasiswa:**
    - Kolom `student_nim` dan `timestamp` dihapus sebelum pemodelan untuk menjaga kerahasiaan identitas responden.
- 🎙️ **Speaker Notes (1 Menit):**
  > _"Kami juga melakukan standardisasi string lokasi. Mahasiswa UKRIDA berlokasi di Tanjung Duren, Jakarta Barat, sehingga variasi ejaan seperti 'Jakbar' dan 'Jkt Barat' diseragamkan ke 'Jakarta Barat'. Selain itu, NIM mahasiswa kami hilangkan dari dataset fitur untuk menjamin privasi sesuai etika penelitian."_

---

### Slide 6: Categorical Encoding & Distribusi 10 Kategori

- **Judul Slide:** Langkah 4 — Categorical Encoding & Diversifikasi 10 Kategori
- **Visual:** Diagram batang distribusi 10 kategori pekerjaan & diagram batang sistem kerja `Onsite` (138), `Hybrid` (55), `Remote` (28).
- **Poin Kunci di Slide:**
  - **Diversifikasi 10 Kategori Industri:**
    - Education & Tutoring (74), Admin & Office Support (55), Food & Beverage (31), Content & Media (16), IT & Software (11), Logistics & Delivery (9), Marketing & Sales (8), Design & Creative (8), Customer Service (7), Retail (2).
  - **Transformasi Numerik work_system:**
    $$\text{Remote} \rightarrow 1 \quad\mid\quad \text{Hybrid} \rightarrow 2 \quad\mid\quad \text{Onsite} \rightarrow 3$$
- 🎙️ **Speaker Notes (1 Menit):**
  > _"Dataset kami tidak terbatas pada bidang tertentu, melainkan mencakup 10 kategori industri populer dari F&B, Tutoring, Desain, hingga IT. Untuk sistem kehadiran kerja, kami lakukan encoding numerik 1 untuk Remote, 2 untuk Hybrid, dan 3 untuk Onsite agar siap dikomputasi pada kriteria lokasi."_

---

### Slide 7: Text Mining Keahlian (NLP TF-IDF & Cosine Similarity)

- **Judul Slide:** Langkah 5 — Text Mining Keahlian untuk Kriteria C5
- **Visual:** Diagram alir pemrosesan NLP:  
  `Teks Mentah` $\rightarrow$ `Case Folding` $\rightarrow$ `Punctuation Removal` $\rightarrow$ `Stopword Removal (ID+EN)` $\rightarrow$ `TF-IDF Matrix` $\rightarrow$ `Cosine Similarity Formula`.
- **Poin Kunci di Slide:**
  - Mengonversi teks keahlian tidak terstruktur menjadi skor numerik kontinu $[0{,}0 - 1{,}0]$.
  - **Formula Cosine Similarity:**
    $$\text{Cosine Similarity}(\vec{A}, \vec{B}) = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|}$$
  - Menghasilkan skor kecocokan bertingkat: lowongan yang meminta keahlian serupa dengan profil mahasiswa akan mendapatkan skor mendekati $1{,}0$.
- 🎙️ **Speaker Notes (2 Menit):**
  > _"Salah satu kontribusi penting dalam Fase 3 ini adalah modul Text Mining. Lowongan kerja dan profil mahasiswa mencantumkan keahlian dalam bentuk teks deskripsi bebas. Melalui pembersihan NLP dan pembobotan kata TF-IDF, kami menghitung sudut Cosine Similarity antara keahlian mahasiswa dan syarat lowongan. Skor ini menghasilkan nilai numerik kontinu antara 0 hingga 1 yang kami jadikan nilai untuk Kriteria C5 (Kemiripan Keahlian)."_

---

### Slide 8: Hasil Akhir Fase 3 — Matriks Keputusan $M \times N$

- **Judul Slide:** Langkah 6 — Konstruksi Matriks Keputusan $M \times N$ (Fitur SPK)
- **Visual:** Cuplikan tabel dataset `decision_matrix_sample.csv` yang menampilkan kolom $C_1$ hingga $C_5$.
- **Poin Kunci di Slide:**
  - Matriks Keputusan berdimensi **$221 \text{ baris (alternatif)} \times 5 \text{ kriteria keputusan}$**.
  - **$C_1$ (Kategori):** $1{,}0$ jika sesuai minat mahasiswa, $0{,}3$ jika berbeda.
  - **$C_2$ (Rasio Gaji):** $\frac{\text{Gaji Tawaran}}{\text{Ekspektasi Gaji Mahasiswa}}$.
  - **$C_3$ (Aksesibilitas Lokasi):** $1{,}0$ (Remote/Se-wilayah), $0{,}8$ (Sesama Jakarta), $0{,}4$ (Wilayah Lain).
  - **$C_4$ (Kesesuaian Jam Kerja):** $1{,}0 - \frac{|\text{Jam Lowongan} - \text{Jam Harapan}|}{20}$.
  - **$C_5$ (Keahlian):** Skor Cosine Similarity TF-IDF $[0{,}0 - 1{,}0]$.
- 🎙️ **Speaker Notes (1.5 Menit):**
  > _"Inilah produk pamungkas dari Fase 3 kami: Matriks Keputusan $M \times N$. Matriks ini terdiri dari 221 alternatif lowongan dan telah terisi lengkap dengan nilai terukur untuk kelima kriteria keputusan $C_1$ hingga $C_5$. Seluruh data telah terbebas dari missing values, bebas anomali, dan siap 100% untuk diproses pada Fase 4 (Modeling)."_

---

### Slide 9: Kesimpulan Progres Fase 3 & Jembatan Menuju Fase 4

- **Judul Slide:** Kesimpulan Progres Fase 3 & Roadmap Fase 4 (Modeling)
- **Visual:** Diagram _checklist_ capaian Fase 3 dan cuplikan rumus SMARTER untuk Fase 4.
- **Poin Kunci di Slide:**
  - **Capaian Fase 3 (Data Preparation):**
    - [x] Mengikis 535 data mentah menjadi 221 lowongan kerja part-time bersih (Funnel 6 Lapisan).
    - [x] Memvalidasi 52 preferensi mahasiswa UKRIDA.
    - [x] Menangani 100% _missing values_ & _outlier_.
    - [x] Berhasil mengonversi teks keahlian menx jadi fitur numerik via Cosine Similarity ($C_5$).
    - [x] Matriks Keputusan $M \times N$ ($221 \times 13$) telah tersimpan di `decision_matrix_sample.csv`.
  - **Rencana Selanjutnya (Fase 4 — Modeling):**
    - Penerapan pembobotan dinamis ROC (_Rank Order Centroid_) berbasis preferensi urutan mahasiswa.
    - Kalkulasi fungsi utilitas linear SMARTER: $u_j(X_{ij}) = \frac{X_{ij} - X^{\min}}{X^{\max} - X^{\min}}$.
    - Akumulasi utilitas total $U(A_i) = \sum w_j \cdot u_j$ untuk perankingan Top-N lowongan terbaik.
- 🎙️ **Speaker Notes (1 Menit):**
  > _"Sebagai penutup, kami telah berhasil menuntaskan seluruh kewajiban pada Fase 3 Data Preparation. Fondasi data kami sudah kokoh dan valid secara ilmiah. Pada Fase 4 mendatang, matriks keputusan ini akan langsung dihitung utilitasnya menggunakan metode SMARTER dengan pembobotan ROC. Terima kasih."_

---

## 🎯 Antisipasi Pertanyaan Dosen Penguji & Rekomendasi Jawaban

| Pertanyaan Dosen Penguji                                                                                   | Rekomendasi Jawaban Mahasiswa                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. "Kenapa dari 535 data menyusut menjadi 221 data? Apa tidak terlalu banyak yang terbuang?"**            | *"Penyusutan ini justru disengaja dan membuktikan filter 6 lapisan kami bekerja efektif. Job portal sering kali mencampur peran full-time, freelance, dan magang (13 data tersaring). Selain itu, 166 data tereliminasi karena berada di luar Jabodetabek yang tidak realistis untuk mahasiswa UKRIDA kuliah tatap muka. 221 data yang tersisa adalah lowongan part-time murni yang 100% valid, link-nya aktif (HTTP 200), dan realistis untuk dilamar."* |
| **2. "Kenapa menggunakan Median untuk imputasi gaji, bukan Rata-Rata (Mean)?"**                            | *"Karena penawaran gaji pada lowongan pekerjaan sering kali memiliki sebaran yang menceng (*skewed*) dengan adanya penawaran yang sangat tinggi. Nilai Mean sangat rentan terdistorsi oleh angka ekstrem (*outlier*), sedangkan Median jauh lebih stabil (*robust*) dalam merefleksikan nilai tengah standar pasar per kategori."*                                                                                                                                      |
| **3. "Bagaimana jika mahasiswa memasukkan keahlian yang sama sekali tidak ada di lowongan?"**              | _"Cosine Similarity akan secara otomatis menghasilkan nilai $0{,}0000$. Pada tahap pembentukan kriteria $C_5$, lowongan tersebut akan bernilai 0 untuk aspek keahlian, namun tetap dapat dievaluasi pada 4 kriteria lainnya ($C_1 - C_4$) secara adil."_                                                                                                                                                                                                                 |
| **4. "Kenapa kalian belum menampilkan perangkingan juara/rekomendasi terbaik hari ini?"**                  | _"Sesuai dengan standar metodologi CRISP-DM, Fase 3 difokuskan pada Data Preparation (penyucian data, rekayasa fitur, dan pembentukan matriks keputusan). Perangkingan utilitas dan pembobotan ROC secara metodologis merupakan ranah Fase 4 (Modeling) yang akan dieksekusi setelah dataset terbukti bersih dan valid."_                                                                                                                                                |
