# Fase 3 — Data Preparation

**Proyek:** Sistem Pendukung Keputusan Rekomendasi Pekerjaan *Part-Time* untuk Mahasiswa Menggunakan Metode *Simple Multi-Attribute Rating Technique Exploiting Ranks* (SMARTER)  
**Studi Kasus:** Mahasiswa Universitas Kristen Krida Wacana (UKRIDA)  
**Metodologi:** CRISP-DM — Fase 3 dari 6  
**Tahun:** 2026  

---

## Data Penyusun Proyek

* **412024022** — Brandon Jeremiah Sutedja  
* **412024043** — Andrew Linardi  
* **412025014** — Raffael Benediktus Lolaroh  
* **412025021** — Michael Aaron Sipahutar  

**Program Studi Informatika, Fakultas Teknologi Cerdas**  
**Universitas Kristen Krida Wacana, Jakarta**  

---

## 1. Tujuan Fase

Fase ini bertujuan menghasilkan dataset final yang terstruktur, bersih, dan siap dimasukkan ke dalam algoritma pencocokan (*matching algorithm*) serta modul pemodelan Sistem Pendukung Keputusan (SPK) berbasis metode SMARTER (*Simple Multi-Attribute Rating Technique Exploiting Ranks*).

Keluaran utama dari fase ini meliputi:
1. Dataset lowongan pekerjaan *part-time* terkini di wilayah Jabodetabek hasil pembersihan.
2. Dataset preferensi mahasiswa UKRIDA hasil imputasi dan standardisasi.
3. Matriks keputusan $M \times N$ beserta pembobotan kriteria yang siap diproses pada Fase 4.

### 1.1 Arsitektur Pipeline Integrasi: Data Mining + SPK (*Decoupled Architecture*)

Sistem ini memisahkan proses menjadi **dua fase operasional yang independen (*Decoupled Pipeline*)**: modul pengumpulan & kurasi data (*Offline / Batch Data Mining*) dan modul personalisasi rekomendasi (*Online / Dynamic Decision Engine*). 

```text
[ SUMBER DATA ]
  ├── Job Portals (LinkedIn, Glints, JobStreet, Kalibrr, KitaLulus)
  └── Profil Mahasiswa (Kuesioner / Form Preferensi UKRIDA)
        │
        ▼
[ TAHAP 1: Web Scraping Engine ] (Batch Offline)
  └── Mengambil data mentah lowongan -> Disimpan ke 'raw_job_postings.csv'
        │
        ▼
[ TAHAP 2: Rule-Based Data Filtering & Cleaning ] (Data Preparation)
  ├── 1. Deduplikasi data ganda (Exact & Cross-platform)
  ├── 2. Negative keyword filtering (buang full-time, magang, internship)
  ├── 3. Student feasibility filtering (jam kerja <= 30 jam/minggu, non-office hour)
  ├── 4. Salary anomaly & anti-scam (Rp10rb - Rp200rb/jam, buang komisi murni)
  ├── 5. Geographic validation (Jabodetabek / Remote)
  └── 6. Completeness sanity check -> Disimpan ke 'clean_jobs_dataset.csv'
        │
        ▼
[ TAHAP 3: Text Mining Engine (Cosine Similarity TF-IDF) ] (Online / Per-Mahasiswa)
  ├── Text Preprocessing: Case folding, cleaning, tokenizing, stopword removal
  ├── Vektorisasi: TF-IDF Vectorizer pada teks keahlian
  └── Matching: Cosine Similarity antara Skill Mahasiswa vs Skill Lowongan
      -> Menghasilkan skor numerik kontinu [0.0 - 1.0] untuk Kriteria C5
        │
        ▼
[ TAHAP 4: Multi-Criteria Decision Engine (SMARTER) ]
  ├── Konstruksi Matriks Keputusan C1 - C5
  ├── Pembobotan Dinamis ROC berbasis urutan ranking prioritas mahasiswa
  ├── Perhitungan Nilai Utilitas Linear: u_j(X_ij)
  └── Akumulasi Utilitas Total: U(Ai) = Sum(w_j * u_j)
        │
        ▼
[ OUTPUT REKOMENDASI ]
  └── Perangkingan Top-N Lowongan Kerja Part-Time Terbaik untuk Mahasiswa
```

#### Mengapa Scraping, Filtering, Text Mining, dan SPK HARUS DIPISAH?
1. **Ketahanan Sistem (*System Resilience & Fault Tolerance*):**  
   Scraping web rentan terhadap kegagalan jaringan, pembatasan kuota (*rate limiting*), dan perubahan DOM HTML. Jika proses scraping digabung langsung dengan text mining atau kalkulasi SPK, error pada saat proses pemodelan dapat membatalkan proses scraping data yang sudah berjalan berjam-jam.
2. **Karakteristik Data yang Berbeda (Statis vs. Dinamis):**  
   * Data lowongan kerja hasil scraping bersifat **koleksi repositori statis** yang diperbarui secara berkala (misal: mingguan).  
   * Data mahasiswa bersifat **dinamis perorangan**; setiap mahasiswa memiliki keahlian, ekspektasi gaji, domisili, dan urutan prioritas yang berbeda saat mengakses sistem.
3. **Efisiensi Komputasi & Modularitas (*Separation of Concerns*):**  
   Dengan memisahkan pipeline, pembersihan data mentah hanya perlu dijalankan **satu kali** setelah scraping selesai. Saat mahasiswa mencari rekomendasi, sistem hanya perlu mengeksekusi Text Mining Cosine Similarity dan kalkulasi SMARTER secara cepat tanpa perlu menyentuh proses scraping kembali.

---

## 2. Langkah 1 — Seleksi Data

### 2.1 Kriteria Inklusi dan Eksklusi

* **Kriteria inklusi:**
  * Lowongan dengan tipe pekerjaan *part-time*, *freelance*, atau paruh waktu fleksibel.
  * Lokasi pekerjaan mencakup wilayah Jabodetabek (Jakarta Barat, Jakarta Selatan, Jakarta Pusat, Jakarta Utara, Jakarta Timur, Tangerang, Tangerang Selatan, Depok, Bogor, dan Bekasi) atau sistem kerja *Remote*.
  * Sumber data berasal dari *job portal* terpercaya (LinkedIn, Glints, JobStreet, KitaLulus, dan Kalibrr) serta kuesioner mahasiswa UKRIDA.
* **Kriteria eksklusi:**
  * Lowongan dengan label *full-time*, *internship*, magang, atau *Management Trainee*.
  * Lowongan di luar Jabodetabek yang mewajibkan hadir secara fisik (*onsite*).
  * Data lowongan yang tidak mencantumkan nama posisi atau deskripsi pekerjaan dasar.

### 2.2 Seleksi Atribut Dataset

#### A. Dataset Lowongan Kerja (Job Portal)
* **Atribut yang dipertahankan:** `job_id`, `job_title`, `job_category`, `work_salaryperhour`, `work_job_location`, `work_hours`, `work_system`, `work_required_skills`, `source_portal`, `url`, dan `date_posted`.
* **Atribut yang dibuang:** *Link referral* internal, id perusahaan non-esensial, dan deskripsi HTML mentah.

#### B. Dataset Preferensi Mahasiswa (Kuesioner)
* **Atribut yang dipertahankan:** `student_job_category`, `min_expected_salary`, `student_location`, `student_work_schedule`, `student_expected_work_hour`, dan `student_skills`.
* **Atribut yang dibuang:** `student_nim` (dihapus dari kalkulasi untuk menjaga privasi) dan `timestamp` pengisian.

### 2.3 Tahapan Penyaringan Data Mentah Hasil Scraping (*Post-Scraping Data Filtering*)

Data mentah (*raw data*) hasil scraping dari berbagai *job portal* memiliki tingkat *noise* dan inkonsistensi yang tinggi. Oleh karena itu, diterapkan 6 lapisan penyaringan (*filtering pipeline*) berurutan sebelum data masuk ke tahap pembersihan dan pemodelan:

| No | Lapisan Filtering | Logika & Aturan Penyaringan | Alasan & Dampak |
|---|---|---|---|
| 1 | **Deduplikasi Data (*De-duplication*)** | - Menghapus data dengan `job_id` atau `url` identik.<br>- Menghapus duplikasi lintas portal (*cross-platform*) jika kombinasi `job_title` + `company_name` + `work_job_location` sama. | Mencegah pembobotan ganda pada lowongan yang sama yang diiklankan di lebih dari satu portal. |
| 2 | **Penyaringan Kata Kunci Negatif (*Negative Keyword Filtering*)** | Mengeliminasi lowongan yang judul atau deskripsinya memuat kata: `full-time`, `full time`, `magang`, `internship`, `volunteer`, `management trainee`, atau `kontrak tahunan`. | Seringkali portal mencampuradukkan lowongan *full-time* atau magang ke dalam hasil pencarian kata kunci *part-time*. |
| 3 | **Penyaringan Kelayakan Mahasiswa & Jam Kerja (*Student Feasibility Filtering*)** | - Menghapus lowongan yang menuntut jam kerja $\gt 30$ jam/minggu.<br>- Menghapus lowongan yang mewajibkan hadir *onsite* penuh di jam perkuliahan reguler (Senin–Jumat, 08.00–17.00). | Memastikan pekerjaan realistis dijalankan oleh mahasiswa aktif UKRIDA tanpa mengganggu jadwal akademik. |
| 4 | **Penyaringan Anomali Gaji & Anti-Penipuan (*Salary Validity & Anti-Scam Filtering*)** | - Menghapus lowongan berskema komisi murni tanpa upah dasar (*pure commission*), MLM, atau modus penipuan berbayar/tugas sosial media.<br>- Menghapus data dengan upah di luar batas wajar ($< \text{Rp}10.000$/jam atau $> \text{Rp}200.000$/jam untuk level *entry-level* mahasiswa). | Menjaga keamanan mahasiswa dari lowongan bodong dan menjaga kualitas data kalkulasi SMARTER. |
| 5 | **Penyaringan Wilayah Geografis (*Geographic & Locality Filtering*)** | - Memfilter lowongan *onsite* agar hanya mencakup area Jabodetabek (prioritas Jakarta Barat dekat UKRIDA).<br>- Menghapus lowongan luar wilayah Jabodetabek yang mewajibkan hadir fisik, serta data lokasi ambigu (hanya bertuliskan "Indonesia"). | Memastikan lowongan dapat diakses secara fisik atau dapat dikerjakan secara *Remote*. |
| 6 | **Penyaringan Kelengkapan Data Esensial (*Data Completeness Filtering*)** | Menghapus record yang kehilangan informasi krusial dan tidak dapat diimputasi (misalnya: judul pekerjaan kosong, deskripsi tanggung jawab kosong, atau tautan lowongan sudah kedaluwarsa/404). | Mencegah kegagalan kalkulasi saat ekstraksi *skill* dan pembentukan matriks keputusan. |

---

## 3. Langkah 2 — Pembersihan Data dan Penanganan *Missing Values*

### 3.1 Penanganan *Missing Values*

| Dataset | Atribut | Persentase Hilang | Metode Penanganan | Alasan Ketepatan |
|---|---|---|---|---|
| Job Portal | `work_salaryperhour` | ~15% | Imputasi median per `job_category` | Median tahan terhadap penawaran gaji ekstrem (*outlier*) |
| Job Portal | `work_hours` | ~10% | Imputasi median per `job_category` | Disesuaikan dengan rata-rata durasi kategori sejenis |
| Job Portal | `work_system` | < 5% | Imputasi modus (diisi “Onsite”) | Mengasumsikan sistem standar jika tidak dicantumkan |
| Job Portal | `work_required_skills` | < 5% | Nilai bawaan (“Komunikasi, Time Management”) | Keahlian umum dasar untuk pekerjaan *part-time* |
| Kuesioner | Seluruh atribut | 0% | *Row Deletion* (penghapusan baris) | Kuesioner di-set wajib isi; respons tidak lengkap dibuang |

### 3.2 Penanganan *Outlier* dan Konsistensi Format

1. **Konversi Gaji (`work_salaryperhour`):**
   * Seluruh penawaran gaji diseragamkan ke dalam satuan Rupiah per jam (Rp/jam).
   * Batas logis ditetapkan antara Rp10.000/jam hingga Rp150.000/jam.
2. **Pembatasan Jam Kerja (`work_hours`):**
   * Beban jam kerja dibatasi maksimal 30 jam per minggu agar tidak mengganggu jadwal akademik mahasiswa.
3. **Standardisasi Lokasi:**
   * Teks lokasi diseragamkan (contoh: “Jakbar”, “Jkt Barat”, dan “Tanjung Duren” diubah menjadi “Jakarta Barat”).

---

## 4. Langkah 3 — Encoding dan Text Mining Keahlian

1. **Transformasi Kategorikal Sistem Kerja (`work_system`):**
   * `Remote` $\rightarrow$ 1
   * `Hybrid` $\rightarrow$ 2
   * `Onsite` $\rightarrow$ 3

2. **Pipeline Text Mining Keahlian (*Skills Matching*):**
   Untuk mengonversi data teks deskripsi keahlian (`work_required_skills` pada lowongan dan `student_skills` pada mahasiswa) menjadi skor numerik kontinu $[0{,}0 - 1{,}0]$, diterapkan tahapan *Natural Language Processing* (NLP) & *Text Mining*:
   * **Tahap 1 — Text Preprocessing:**
     * *Case Folding*: Mengubah seluruh teks menjadi huruf kecil (*lowercase*).
     * *Punctuation Removal*: Menghilangkan karakter tanda baca, bullet points, dan simbol non-alfanumerik.
     * *Tokenization*: Memecah string teks menjadi kumpulan token kata/istilah keahlian.
     * *Stopword Removal*: Menyingkirkan kata hubung non-esensial (Bahasa Indonesia & Inggris).
   * **Tahap 2 — Vektorisasi Ruang Term (*Vector Space Model* via TF-IDF):**
     * Membentuk matriks representasi bobot kata menggunakan *Term Frequency - Inverse Document Frequency* (TF-IDF):
       $$\vec{V}_{\text{mahasiswa}} \quad \text{dan} \quad \vec{V}_{\text{lowongan}}$$
   * **Tahap 3 — Kalkulasi Kemiripan (*Cosine Similarity*):**
     * Mengukur derajat kecocokan sudut kosinus antara vektor profil mahasiswa dan vektor lowongan kerja:
       $$\text{Cosine Similarity}(\vec{A}, \vec{B}) = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|} = \frac{\sum_{k=1}^{p} A_k B_k}{\sqrt{\sum_{k=1}^p A_k^2} \sqrt{\sum_{k=1}^p B_k^2}}$$
     * **Interpretasi Nilai Output:**
       * **$0{,}0$ (*False / Nol*):** Tidak ada kata kunci keahlian yang cocok sama sekali.
       * **$1{,}0$ (*True / Sempurna*):** Seluruh keahlian yang diminta sesuai persis dengan profil mahasiswa.
       * **$0{,}1 - 0{,}9$ (*Kecocokan Parsial*):** Mengukur derajat kesesuaian gradual (contoh: mahasiswa menguasai 2 dari 3 keahlian yang disyaratkan).

---

## 5. Langkah 4 — Konstruksi Fitur Kriteria SPK (SMARTER)

Untuk mengukur tingkat kecocokan antara profil mahasiswa ($S$) dan lowongan pekerjaan ($A_i$), dibentuk lima kriteria keputusan ($C_1$ hingga $C_5$):

| Kode | Nama Kriteria | Sifat | Formula / Logika Perhitungan | Rentang Nilai |
|---|---|---|---|---|
| $C_1$ | Kesesuaian Kategori | Benefit | $1,0$ jika `job_category` sesuai preferensi, $0,3$ jika berbeda | $0,3 - 1,0$ |
| $C_2$ | Rasio Penawaran Gaji | Benefit | $\frac{\text{work\_salaryperhour}}{\text{min\_expected\_salary}}$ | $\ge 0,0$ |
| $C_3$ | Aksesibilitas Lokasi | Benefit | $1,0$ jika Remote / Se-wilayah, $0,8$ jika sesama Jakarta, $0,4$ jika wilayah lain | $0,4 - 1,0$ |
| $C_4$ | Kesesuaian Jam Kerja | Benefit | $1,0 - \frac{\vert \text{work\_hours} - \text{student\_expected\_work\_hour} \vert}{20}$ | $0,0 - 1,0$ |
| $C_5$ | Kemiripan Keahlian | Benefit | $\text{Cosine Similarity}(\vec{V}_{\text{mahasiswa}}, \vec{V}_{\text{lowongan}})$ via TF-IDF | $0,0 - 1,0$ |

---

## 6. Langkah 5 — Pembobotan ROC dan Evaluasi Nilai Utilitas SMARTER

Metode **SMARTER** (*Simple Multi-Attribute Rating Technique Exploiting Ranks*) mengevaluasi setiap alternatif lowongan pekerjaan berdasarkan pengalian nilai fungsi utilitas linear ($u_j$) dengan bobot prioritas peringkat (*Rank Order Centroid* / ROC) yang dipilih oleh mahasiswa.

### 6.1 Pembobotan Kriteria Berbasis Ranking Mahasiswa (Metode ROC)

Ciri khas utama metode SMARTER adalah mengeksploitasi urutan peringkat kepentingan kriteria yang ditentukan langsung oleh mahasiswa ($r_j \in \{1, 2, \dots, K\}$). Peringkat kriteria ini dikonversi menjadi bobot numerik ($w_j$) menggunakan formulasi *Rank Order Centroid* (ROC):

$$w_j = \frac{1}{K} \sum_{k=r_j}^{K} \frac{1}{k}$$

Di mana:
* $K = 5$ (total jumlah kriteria keputusan).
* $r_j$ adalah posisi peringkat kepentingan kriteria ke-$j$ (peringkat 1 = prioritas paling penting).

Tabel konversi bobot ROC untuk 5 kriteria keputusan:

| Peringkat Prioritas ($r_j$) | Perhitungan ROC | Bobot ($w_j$) | Persentase |
|:---:|:---|:---:|:---:|
| **Peringkat 1** (Prioritas Utama) | $\frac{1}{5} \left(1 + \frac{1}{2} + \frac{1}{3} + \frac{1}{4} + \frac{1}{5}\right) = \frac{2{,}2833}{5}$ | **$0{,}4567$** | 45,67% |
| **Peringkat 2** | $\frac{1}{5} \left(\frac{1}{2} + \frac{1}{3} + \frac{1}{4} + \frac{1}{5}\right) = \frac{1{,}2833}{5}$ | **$0{,}2567$** | 25,67% |
| **Peringkat 3** | $\frac{1}{5} \left(\frac{1}{3} + \frac{1}{4} + \frac{1}{5}\right) = \frac{0{,}7833}{5}$ | **$0{,}1567$** | 15,67% |
| **Peringkat 4** | $\frac{1}{5} \left(\frac{1}{4} + \frac{1}{5}\right) = \frac{0{,}4500}{5}$ | **$0{,}0900$** | 9,00% |
| **Peringkat 5** (Prioritas Terakhir) | $\frac{1}{5} \left(\frac{1}{5}\right) = \frac{0{,}2000}{5}$ | **$0{,}0400$** | 4,00% |
| **Total ($\sum w_j$)** | | **$1{,}0000$** | **100%** |

> **Pengaturan Default (Baseline):**  
> Apabila mahasiswa tidak mengisi peringkat prioritas personal di kuesioner/aplikasi, sistem menerapkan urutan prioritas standar berbasis urgensi rata-rata mahasiswa UKRIDA hasil survei Fase 2:  
> 1. Peringkat 1: $C_2$ (Gaji per Jam) $\rightarrow w_2 = 0{,}4567$  
> 2. Peringkat 2: $C_4$ (Kesesuaian Jam Kerja) $\rightarrow w_4 = 0{,}2567$  
> 3. Peringkat 3: $C_3$ (Lokasi Pekerjaan) $\rightarrow w_3 = 0{,}1567$  
> 4. Peringkat 4: $C_1$ (Kategori Pekerjaan) $\rightarrow w_1 = 0{,}0900$  
> 5. Peringkat 5: $C_5$ (Kesesuaian Skill) $\rightarrow w_5 = 0{,}0400$  

### 6.2 Penentuan Nilai Utilitas Linear ($u_j(X_{ij})$)

Seluruh kriteria $C_1$ hingga $C_5$ bertipe **Benefit** (semakin besar nilainya semakin baik). Nilai mentah kriteria $X_{ij}$ dikonversi ke dalam skala utilitas $[0, 1]$ menggunakan fungsi utilitas linear:

$$u_j(X_{ij}) = \frac{X_{ij} - X_j^{\min}}{X_j^{\max} - X_j^{\min}}$$

Di mana:
* $X_{ij}$ adalah nilai kriteria ke-$j$ pada alternatif lowongan ke-$i$.
* $X_j^{\min}$ adalah nilai minimum kriteria $j$ dari seluruh alternatif lowongan.
* $X_j^{\max}$ adalah nilai maksimum kriteria $j$ dari seluruh alternatif lowongan.  
*(Jika $X_j^{\max} = X_j^{\min}$, maka nilai utilitas $u_j(X_{ij}) = 1,0$)*.

### 6.3 Perhitungan Nilai Utilitas Total ($U(A_i)$)

Total nilai utilitas preferensi untuk setiap alternatif lowongan pekerjaan ($A_i$) dihitung dengan mengakumulasikan perkalian bobot ROC dengan fungsi utilitas kriteria:

$$U(A_i) = \sum_{j=1}^{5} w_j \cdot u_j(X_{ij})$$

Lowongan pekerjaan dengan skor utilitas total $U(A_i)$ tertinggi akan menempati peringkat teratas (*ranking 1*) sebagai rekomendasi pekerjaan *part-time* terbaik dan paling relevan bagi mahasiswa.