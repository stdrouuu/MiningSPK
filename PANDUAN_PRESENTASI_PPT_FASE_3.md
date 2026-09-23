# Panduan Rancangan Slide Presentasi PPT — CRISP-DM Fase 3: Data Preparation

**Proyek:** Sistem Pendukung Keputusan Rekomendasi Pekerjaan _Part-Time_ untuk Mahasiswa Menggunakan Metode SMARTER  
**Studi Kasus:** Mahasiswa Informatika, Fakultas Teknologi Cerdas, Universitas Kristen Krida Wacana (UKRIDA)  
**Tujuan Dokumen:** Memberikan panduan terstruktur per slide untuk presentasi progres evaluasi akademik (Fase 3: Data Preparation).

---

## Ringkasan Struktur Presentasi

- **Total Durasi Presentasi:** 10 – 15 Menit
- **Total Slide:** 11 Slide Utama + 1 Slide Penutup / Q&A
- **Fokus Utama:** Mendemonstrasikan bahwa data mentah hasil _scraping_ telah disucikan, disaring dari data anomali/bodong melalui **6 Lapisan Filtering**, ditangani nilai hilangnya, diolah teks keahliannya melalui **TF-IDF & Cosine Similarity**, hingga terbentuk **Matriks Keputusan $M \times N$** yang siap masuk ke Fase 4 (Modeling).

---

## Rincian Panduan Slide per Slide

```text
[Slide 1] Judul & Identitas Tim
[Slide 2] Posisi Fase 3 dalam Siklus CRISP-DM
[Slide 3] Arsitektur Decoupled Data Preparation
[Slide 4] Pengumpulan Data Mentah (540 Lowongan & 55 Mahasiswa)
[Slide 5] 6 Lapisan Filtering: Corong Eliminasi Data (Data Funnel)
[Slide 6] Penanganan Missing Values (Imputasi Median & Listwise Deletion)
[Slide 7] Penanganan Outlier & Standardisasi Format Lokasi
[Slide 8] Categorical Encoding (Sistem Kerja)
[Slide 9] Text Mining Keahlian: NLP, TF-IDF & Cosine Similarity (C5)
[Slide 10] Produk Akhir: Matriks Keputusan M x N (Kriteria C1 - C5)
[Slide 11] Kesimpulan Progres Fase 3 & Kesiapan Menuju Fase 4
[Slide 12] Sesi Tanya Jawab (Q&A) & Penutup
```

---

### Slide 1: Judul Proyek & Identitas Tim

- **Judul Slide:** Rekomendasi Pekerjaan Part-Time Mahasiswa UKRIDA Berbasis Multi-Criteria Decision Making (SMARTER)
- **Sub-judul:** Laporan Kemajuan CRISP-DM: Fase 3 — Data Preparation
- **Visual:** Logo UKRIDA, Logo Fakultas Teknologi Cerdas, Foto / Nama Tim.
- **Konten Teks:**
  - Brandon Jeremiah Sutedja (412024022)
  - Andrew Linardi (412024043)
  - Raffael Benediktus Lolaroh (412025014)
  - Michael Aaron Sipahutar (412025021)
  - Program Studi Informatika, Universitas Kristen Krida Wacana (2026)
- 🎙️ **Speaker Notes (1 Menit):**
  > _"Selamat pagi/siang Bapak/Ibu dosen penguji serta rekan-rekan sekalian. Hari ini kelompok kami akan mempresentasikan kemajuan proyek Sistem Pendukung Keputusan Rekomendasi Pekerjaan Part-Time untuk Mahasiswa UKRIDA, khusus pada **Fase 3: Data Preparation**. Pada tahap ini, kami fokus menyaring dan mempersiapkan data mentah menjadi dataset bersih dan matriks keputusan yang siap diolah pada pemodelan Fase 4."_

---

### Slide 2: Posisi Fase 3 dalam Metodologi CRISP-DM

- **Judul Slide:** Posisi dan Batasan Lingkup Proyek dalam CRISP-DM
- **Visual:** Diagram lingkaran/tahapan CRISP-DM (Business Understanding $\rightarrow$ Data Understanding $\rightarrow$ **Data Preparation** $\rightarrow$ Modeling $\rightarrow$ Evaluation $\rightarrow$ Deployment) dengan **Fase 3 di-highlight warna emas/biru tebal**.
- **Poin Kunci di Slide:**
  - **Fase 1 (Selesai):** Pemahaman kebutuhan mahasiswa UKRIDA mencari kerja part-time tanpa mengganggu kuliah.
  - **Fase 2 (Selesai):** Pengumpulan data awal dan perumusan 5 kriteria keputusan ($C_1 - C_5$).
  - **Fase 3 (Fokus Hari Ini):** Penyucian data mentah, penanganan _noise/outlier_, ekstraksi fitur NLP, dan pembentukan matriks keputusan.
  - **Fase 4 (Langkah Selanjutnya):** Pembobotan ROC dan pemodelan utilitas linear SMARTER.
- 🎙️ **Speaker Notes (1 Menit):**
  > _"Sebagai penegasan batasan lingkup, hari ini kami melaporkan progres **Fase Data Preparation**. Kami belum menjalankan perangkingan rekomendasi akhir karena sesuai kaidah CRISP-DM, kualitas pemodelan SPK di Fase 4 sangat bergantung pada seberapa bersih dan valid data yang kita siapkan di Fase 3 ini — prinsip 'Garbage In, Garbage Out'."_

---

### Slide 3: Arsitektur Pipeline Terpisah (_Decoupled Architecture_)

- **Judul Slide:** Arsitektur Pipeline: Pemisahan Data Mining & Decision Engine
- **Visual:** Diagram blok yang memisahkan **Offline Data Preparation** vs **Online Decision Engine**.
- **Poin Kunci di Slide:**
  - **Mengapa Scraping & SPK Dipisah?**
    1. _System Resilience_: Scraping rentan error jaringan/captcha, tidak boleh menghentikan proses rekomendasi.
    2. _Karakteristik Data Berbeda_: Lowongan kerja bersifat statis berkala (diperbarui mingguan), profil mahasiswa bersifat dinamis per individu.
    3. _Efisiensi Komputasi_: Pembersihan data hanya dijalankan 1 kali, bukan setiap kali mahasiswa mencari pekerjaan.
- 🎙️ **Speaker Notes (1.5 Menit):**
  > *"Kami merancang sistem dengan arsitektur decoupled. Proses pengumpulan dan penyucian data lowongan dilakukan secara *batch offline*. Dengan cara ini, ketika mahasiswa mengakses sistem di web, mereka tidak perlu menunggu scraping yang memakan waktu berjam-jam, melainkan langsung dicocokkan dengan dataset bersih yang telah disiapkan."*

---

### Slide 4: Pengumpulan Data Mentah (_Data Ingestion_)

- **Judul Slide:** Pengumpulan Data Mentah (Raw Ingestion)
- **Visual:** Tabel perbandingan sumber data dan jumlah rekaman.
- **Poin Kunci di Slide:**
  - **Dataset 1: Lowongan Pekerjaan (`raw_job_postings.csv`)**
    - Total: **~500 baris data mentah**.
    - Sumber: 4 Portal Kerja Resmi Indonesia (Kalibrr, KitaLulus, Glints, Loker.id).
    - Memuat 12 atribut mentah, termasuk gaji, jam kerja, sistem kerja, lokasi, URL live aktif, dan teks kualifikasi skill.
  - **Dataset 2: Kuesioner Preferensi Mahasiswa (`raw_student_preferences.csv`)**
    - Total: **55 responden mahasiswa UKRIDA**.
    - Memuat ekspektasi upah, ketersediaan jam kerja, domisili, dan daftar keahlian mahasiswa.
- 🎙️ **Speaker Notes (1 Menit):**
  > _"Dari hasil scraping dan penyebaran survei, kami berhasil mengumpulkan sekitar 500 data mentah lowongan kerja dari 4 portal kerja resmi terkemuka di Indonesia (Kalibrr, KitaLulus, Glints, dan Loker.id) dengan tautan yang 100% aktif dan dapat diakses, serta 55 sampel respon kuesioner mahasiswa UKRIDA. Seluruh data disaring ketat melalui 6 lapisan agar hanya menyisakan pekerjaan paruh waktu murni yang layak bagi mahasiswa."_

---

### Slide 5: 6 Lapisan Filtering (Corong Eliminasi Data) — _SLIDE KUNCI!_

- **Judul Slide:** Langkah 1 — 6 Lapisan Rule-Based Filtering (Data Funnel)
- **Visual:** **Grafik Corong (Funnel Chart)** atau diagram batang horizontal: $540 \rightarrow 470 \rightarrow 400 \rightarrow 356 \rightarrow 355 \rightarrow 294 \rightarrow 293$.
- **Poin Kunci di Slide (Tabel Reduksi):**
  - **L1: Deduplikasi (-70 data):** Membuang duplikat ID, URL, dan duplikasi lintas portal.
  - **L2: Negative Keywords (-70 data):** Membuang lowongan _full-time_, _magang_, _internship_, _management trainee_.
  - **L3: Kelayakan Jam Mahasiswa (-44 data):** Membuang lowongan dengan jam kerja $> 30$ jam/minggu.
  - **L4: Anomali Gaji & Anti-Scam (-1 data):** Membuang komisi murni tanpa gaji pokok, MLM, atau gaji $< \text{Rp}10.000$ / $> \text{Rp}200.000$/jam.
  - **L5: Geografis Jabodetabek (-61 data):** Membuang lowongan _onsite_ di luar daerah (Surabaya, Bandung, Medan).
  - **L6: Kelengkapan Esensial (-1 data):** Membuang lowongan tanpa judul atau tautan mati.
  - **HASIL BERSIH:** **293 Lowongan Kerja Valid (Retensi 54,3%)**.
- 🎙️ **Speaker Notes (2.5 Menit):**
  > _"Inilah inti dari penyaringan data kami. Dari 540 data mentah, kami menyaringnya melalui 6 lapisan aturan ketat. Perhatikan bahwa 70 lowongan dibuang karena merupakan lowongan full-time atau magang 6 bulan yang tidak cocok untuk mahasiswa aktif. Sebanyak 44 lowongan dibuang karena menuntut jam kerja di atas 30 jam per minggu. Sebanyak 61 lowongan onsite di luar Jabodetabek juga kami eliminasi. Pada akhirnya, tersaring **293 lowongan kerja part-time yang benar-benar bersih, aman, dan relevan** bagi mahasiswa UKRIDA."_

---

### Slide 6: Penanganan Missing Values (Nilai Hilang)

- **Judul Slide:** Langkah 2 — Penanganan Nilai Hilang (Missing Values)
- **Visual:** Tabel _Before vs After_ jumlah missing values per atribut.
- **Poin Kunci di Slide:**
  - **Data Lowongan (Job Portal):**
    - `work_salaryperhour` (49 kosong) $\rightarrow$ Diimputasi menggunakan **Median per Kategori**. _(Alasan: Median tahan terhadap outlier dibanding rata-rata)._
    - `work_hours` (28 kosong) $\rightarrow$ Diimputasi menggunakan **Median per Kategori**.
    - `work_system` (7 kosong) $\rightarrow$ Diimputasi dengan **Modus** (`"Onsite"`).
    - `work_required_skills` (3 kosong) $\rightarrow$ Diimputasi nilai bawaan (_"Komunikasi, Time Management"_).
  - **Data Mahasiswa (Kuesioner):**
    - Diterapkan **Listwise Deletion** pada 3 data responden yang tidak lengkap $\rightarrow$ menghasilkan **52 data mahasiswa valid 100%**.
- 🎙️ **Speaker Notes (1.5 Menit):**
  > _"Di dunia nyata, tidak semua poster lowongan mencantumkan gaji dan jam kerja. Kami menggunakan imputasi Median per kategori pekerjaan agar nilai yang diisi tidak terdistorsi oleh angka ekstrem. Sementara untuk data mahasiswa, kami menerapkan Listwise Deletion karena data preferensi pengguna wajib lengkap agar perhitungan SPK tidak bias."_

---

### Slide 7: Penanganan Outlier & Standardisasi Format

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

### Slide 8: Categorical Encoding (Sistem Kerja)

- **Judul Slide:** Langkah 4 — Categorical Encoding Sistem Kehadiran Kerja
- **Visual:** Diagram batang frekuensi `Remote` (171), `Onsite` (78), `Hybrid` (44).
- **Poin Kunci di Slide:**
  - Fitur `work_system` ditransformasikan menjadi diskret numerik:
    $$\text{Remote} \rightarrow 1 \quad\mid\quad \text{Hybrid} \rightarrow 2 \quad\mid\quad \text{Onsite} \rightarrow 3$$
  - Mayoritas lowongan part-time yang lolos seleksi berformat **Remote (58,4%)**, yang sangat menguntungkan mahasiswa karena fleksibilitas waktu dan tempat.
- 🎙️ **Speaker Notes (1 Menit):**
  > _"Untuk kebutuhan komputasi sistem pendukung keputusan, sistem kehadiran kerja kami ubah ke format numerik: 1 untuk Remote, 2 untuk Hybrid, dan 3 untuk Onsite. Hasilnya menunjukkan bahwa lebih dari 58% lowongan bersih bertipe Remote, sangat ideal untuk mahasiswa yang memiliki jadwal perkuliahan padat."_

---

### Slide 9: Text Mining Keahlian (NLP TF-IDF & Cosine Similarity)

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

### Slide 10: Hasil Akhir Fase 3 — Matriks Keputusan $M \times N$

- **Judul Slide:** Langkah 6 — Konstruksi Matriks Keputusan $M \times N$ (Fitur SPK)
- **Visual:** Cuplikan tabel dataset `decision_matrix_sample.csv` yang menampilkan kolom $C_1$ hingga $C_5$.
- **Poin Kunci di Slide:**
  - Matriks Keputusan berdimensi **$293 \text{ baris (alternatif)} \times 5 \text{ kriteria keputusan}$**.
  - **$C_1$ (Kategori):** $1{,}0$ jika sesuai minat mahasiswa, $0{,}3$ jika berbeda.
  - **$C_2$ (Rasio Gaji):** $\frac{\text{Gaji Tawaran}}{\text{Ekspektasi Gaji Mahasiswa}}$.
  - **$C_3$ (Aksesibilitas Lokasi):** $1{,}0$ (Remote/Se-wilayah), $0{,}8$ (Sesama Jakarta), $0{,}4$ (Wilayah Lain).
  - **$C_4$ (Kesesuaian Jam Kerja):** $1{,}0 - \frac{|\text{Jam Lowongan} - \text{Jam Harapan}|}{20}$.
  - **$C_5$ (Keahlian):** Skor Cosine Similarity TF-IDF $[0{,}0 - 1{,}0]$.
- 🎙️ **Speaker Notes (1.5 Menit):**
  > _"Inilah produk pamungkas dari Fase 3 kami: Matriks Keputusan $M \times N$. Matriks ini terdiri dari 293 alternatif lowongan dan telah terisi lengkap dengan nilai terukur untuk kelima kriteria keputusan $C_1$ hingga $C_5$. Seluruh data telah terbebas dari missing values, bebas anomali, dan siap 100% untuk diproses pada Fase 4 (Modeling)."_

---

### Slide 11: Kesimpulan Progres Fase 3 & Jembatan Menuju Fase 4

- **Judul Slide:** Kesimpulan Progres Fase 3 & Roadmap Fase 4 (Modeling)
- **Visual:** Diagram _checklist_ capaian Fase 3 dan cuplikan rumus SMARTER untuk Fase 4.
- **Poin Kunci di Slide:**
  - **Capaian Fase 3 (Data Preparation):**
    - [x] Mengikis 540 data mentah menjadi 293 lowongan kerja bersih (Funnel 6 Lapisan).
    - [x] Memvalidasi 52 preferensi mahasiswa UKRIDA.
    - [x] Menangani 100% _missing values_ & _outlier_.
    - [x] Berhasil mengonversi teks keahlian menjadi fitur numerik via Cosine Similarity ($C_5$).
    - [x] Matriks Keputusan $M \times N$ telah tersimpan di `decision_matrix_sample.csv`.
  - **Rencana Selanjutnya (Fase 4 — Modeling):**
    - Penerapan pembobotan dinamis ROC (_Rank Order Centroid_) berbasis preferensi urutan mahasiswa.
    - Kalkulasi fungsi utilitas linear SMARTER: $u_j(X_{ij}) = \frac{X_{ij} - X^{\min}}{X^{\max} - X^{\min}}$.
    - Akumulasi utilitas total $U(A_i) = \sum w_j \cdot u_j$ untuk perankingan Top-N lowongan terbaik.
- 🎙️ **Speaker Notes (1 Menit):**
  > _"Sebagai penutup, kami telah berhasil menuntaskan seluruh kewajiban pada Fase 3 Data Preparation. Fondasi data kami sudah kokoh dan valid secara ilmiah. Pada Fase 4 mendatang, matriks keputusan ini akan langsung dihitung utilitasnya menggunakan metode SMARTER dengan pembobotan ROC. Terima kasih."_

---

### Slide 12: Sesi Tanya Jawab (Q&A)

- **Judul Slide:** Terima Kasih — Sesi Tanya Jawab
- **Visual:** Kontak tim / GitHub repository link.
- **Konten:** _"Kami siap menerima masukan, saran, dan pertanyaan dari Bapak/Ibu dosen penguji."_

---

## 🎯 Antisipasi Pertanyaan Dosen Penguji & Rekomendasi Jawaban

| Pertanyaan Dosen Penguji                                                                                   | Rekomendasi Jawaban Mahasiswa                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. "Kenapa dari 540 data bisa menyusut drastis jadi 293 data? Apa tidak terlalu banyak yang terbuang?"** | *"Penyusutan ini justru disengaja dan membuktikan filter kami bekerja efektif. Job portal sering mencampur lowongan *full-time* dan magang ke kata kunci *part-time* (70 data terbuang). Selain itu, kami harus melindungi mahasiswa dari lowongan dengan jam kerja $> 30$ jam/minggu (44 data) dan lowongan luar daerah (61 data) yang mustahil dikerjakan mahasiswa UKRIDA. 293 data yang tersisa adalah data yang benar-benar berkualitas tinggi dan dapat dilamar."* |
| **2. "Kenapa menggunakan Median untuk imputasi gaji, bukan Rata-Rata (Mean)?"**                            | *"Karena penawaran gaji pada lowongan pekerjaan sering kali memiliki sebaran yang menceng (*skewed*) dengan adanya penawaran yang sangat tinggi. Nilai Mean sangat rentan terdistorsi oleh angka ekstrem (*outlier*), sedangkan Median jauh lebih stabil (*robust*) dalam merefleksikan nilai tengah standar pasar."*                                                                                                                                                    |
| **3. "Bagaimana jika mahasiswa memasukkan keahlian yang sama sekali tidak ada di lowongan?"**              | _"Cosine Similarity akan secara otomatis menghasilkan nilai $0{,}0000$. Pada tahap pembentukan kriteria $C_5$, lowongan tersebut akan bernilai 0 untuk aspek keahlian, namun tetap dapat dievaluasi pada 4 kriteria lainnya ($C_1 - C_4$) secara adil."_                                                                                                                                                                                                                 |
| **4. "Kenapa kalian belum menampilkan perangkingan juara/rekomendasi terbaik hari ini?"**                  | _"Sesuai dengan standar metodologi CRISP-DM, Fase 3 difokuskan pada Data Preparation (penyucian data, rekayasa fitur, dan pembentukan matriks keputusan). Perangkingan utilitas dan pembobotan ROC secara metodologis merupakan ranah Fase 4 (Modeling) yang akan dieksekusi setelah dataset terbukti bersih dan valid."_                                                                                                                                                |
