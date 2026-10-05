# Kuesioner Preferensi Kerja Part-Time Mahasiswa UKRIDA
**Proyek:** Sistem Pendukung Keputusan (SPK) Rekomendasi Lowongan Part-Time — Metode SMARTER  
**Mata Kuliah:** Kolaborasi Data Mining & Sistem Pendukung Keputusan (Decision Support System / DSS)  
**Program Studi:** Informatika, Fakultas Teknologi Cerdas (FTC), Universitas Kristen Krida Wacana (UKRIDA), Jakarta  
**Tujuan:** Mengumpulkan data preferensi mahasiswa secara empiris menggantikan data sintetis `raw_student_preferences.csv`.

---

## Tim Peneliti (Kelompok)

| NIM | Nama Mahasiswa | Program Studi | Peran |
|---|---|---|---|
| 412024022 | Brandon Jeremiah Sutedja | Informatika, UKRIDA | Anggota Tim Peneliti |
| 412024043 | Andrew Linardi | Informatika, UKRIDA | Anggota Tim Peneliti |
| 412025014 | Raffael Benediktus Lolaroh | Informatika, UKRIDA | Anggota Tim Peneliti |
| 412025021 | Michael Aaron Sipahutar | Informatika, UKRIDA | Anggota Tim Peneliti |

---

## Pemetaan Pertanyaan ke Kolom Dataset

| No. | Pertanyaan | Halaman Form | Kolom Dataset | Tipe Konversi |
|---|---|---|---|---|
| — | Lembar Persetujuan (Informed Consent) | Hal 1: Pengantar | *(Filter responden)* | Hanya yang bersedia lanjut ke Hal 2 |
| Q1 | NIM | Hal 2: Identitas | `student_nim` | Langsung |
| Q2 | Nama Lengkap | Hal 2: Identitas | `student_name` | Langsung |
| Q3 | Area Domisili | Hal 3: Preferensi | `student_location` | Langsung (dari dropdown wilayah) |
| Q4 | Minat Bidang Kerja | Hal 3: Preferensi | `student_job_category` / `preferred_category` | Langsung (10 kategori resmi) |
| Q5 | Sistem Kerja | Hal 3: Preferensi | `preferred_work_system` | Langsung (Remote / Hybrid / Onsite) |
| Q6a | Hari kerja per minggu | Hal 4: Waktu & Upah | *(variabel bantu)* | Dihitung ke `student_expected_work_hour` |
| Q6b | Jam kerja per hari | Hal 4: Waktu & Upah | *(variabel bantu)* | Dihitung ke `student_expected_work_hour` |
| Q7 | Target gaji per bulan | Hal 4: Waktu & Upah | *(variabel bantu)* | Dihitung ke `min_expected_salary` (per jam) |
| Q8 | Keahlian / Skills (teks bebas) | Hal 5: Keahlian | `student_skills` | Normalisasi teks ke `clean_student_skills` |

> **Catatan Pembobotan SMARTER:**  
> Sistem menggunakan bobot ROC default hasil analisis empiris survei kriteria Fase 2:  
> **C2 (Gaji) = 0.4567 | C4 (Jam) = 0.2567 | C3 (Lokasi) = 0.1567 | C1 (Kategori) = 0.0900 | C5 (Skill) = 0.0400** (Total = 1.0000).

---

## Struktur Halaman Google Form (Multi-Halaman & Elegan)

### Halaman Depan: Pengantar & Informed Consent
* **Judul Form:** Survei Preferensi Kerja Part-Time Mahasiswa UKRIDA
* **Deskripsi:** Menjelaskan identitas kelompok, prodi Informatika UKRIDA, mata kuliah Data Mining & DSS (SPK), tujuan penelitian, dan jaminan kerahasiaan data (hanya untuk akademik).
* **Pertanyaan Persetujuan:**
  - `Ya, saya bersedia mengisi kuesioner ini secara sukarela` *(Lanjut ke Halaman 1: Identitas)*
  - `Tidak, saya belum bersedia` *(Otomatis selesai / Kirim Formulir)*

---

### Halaman 1: Identitas Mahasiswa
* **Q1. Nomor Induk Mahasiswa (NIM)** *(Jawaban singkat, required)*
* **Q2. Nama Lengkap** *(Jawaban singkat, required)*

---

### Halaman 2: Preferensi Bidang Pekerjaan & Lokasi
* **Q3. Di area mana Anda tinggal / kos saat ini?** *(Pilihan ganda radio button, required)*
  - Jakarta Barat
  - Jakarta Pusat
  - Jakarta Selatan
  - Jakarta Timur
  - Jakarta Utara
  - Tangerang / Tangerang Selatan / BSD / Serpong
  - Depok / Bogor
  - Bekasi
* **Q4. Bidang pekerjaan part-time apa yang paling Anda minati?** *(Pilihan ganda, 10 kategori, required)*
  - Education & Tutoring
  - Food & Beverage / F&B
  - Retail & Store Operations
  - Marketing & Sales
  - Content & Media
  - Design & Creative
  - Admin & Office Support
  - Customer Service & Support
  - Logistics & Delivery
  - IT & Software
* **Q5. Sistem kerja seperti apa yang Anda harapkan?** *(Pilihan ganda, required)*
  - Remote (100% online)
  - Hybrid (Kombinasi online & hadir lokasi)
  - Onsite (Hadir fisik di tempat kerja)

---

### Halaman 3: Ketersediaan Waktu & Ekspektasi Finansial
* **Q6a. Dalam seminggu, berapa hari Anda bersedia meluangkan waktu untuk kerja part-time?** *(Pilihan ganda, required)*
  - 1 hari / minggu *(nilai = 1)*
  - 2 hari / minggu *(nilai = 2)*
  - 3 hari / minggu *(nilai = 3)*
  - 4 hari / minggu *(nilai = 4)*
  - 5 hari / minggu atau lebih *(nilai = 5)*
* **Q6b. Ketika bekerja pada hari tersebut, berapa jam Anda bersedia bertugas?** *(Pilihan ganda, required)*
  - 2 – 3 jam / hari *(nilai tengah = 2.5)*
  - 4 – 5 jam / hari *(nilai tengah = 4.5)*
  - 6 – 7 jam / hari *(nilai tengah = 6.5)*
* **Q7. Berapa minimal total upah / uang saku yang Anda harapkan per bulan?** *(Pilihan ganda, required)*
  - Rp 500.000 – Rp 1.000.000 / bulan *(nilai tengah = 750.000)*
  - Rp 1.000.000 – Rp 1.500.000 / bulan *(nilai tengah = 1.250.000)*
  - Rp 1.500.000 – Rp 2.000.000 / bulan *(nilai tengah = 1.750.000)*
  - Rp 2.000.000 – Rp 2.500.000 / bulan *(nilai tengah = 2.250.000)*
  - Di atas Rp 2.500.000 / bulan *(nilai = 2.750.000)*

---

### Halaman 4: Keahlian & Keterampilan Diri
* **Q8. Tuliskan keahlian (skills) apa saja yang Anda miliki saat ini:** *(Paragraf isian bebas, dipisahkan tanda koma)*  
  Dilengkapi panduan contoh beragam (Canva, Excel, Barista, Python, dsb.) agar mahasiswa tidak bingung.

---

## Logika Pemrosesan Data di Script Python

```python
# 1. Hitung jam kerja per minggu (student_expected_work_hour)
df['student_expected_work_hour'] = df['hari_per_minggu'] * df['jam_per_hari']

# 2. Hitung upah per jam minimum (min_expected_salary)
df['min_expected_salary'] = df['gaji_bulanan'] / (df['student_expected_work_hour'] * 4)

# 3. Data Quality & Salary Capping (CRISP-DM Layer)
SALARY_CEILING = 75_000   # Rp 75.000/jam (batas atas wajar)
SALARY_FLOOR   = 15_000   # Rp 15.000/jam (batas bawah minimum)

df.loc[df['min_expected_salary'] > SALARY_CEILING, 'min_expected_salary'] = SALARY_CEILING
df.loc[df['min_expected_salary'] < SALARY_FLOOR,   'min_expected_salary'] = SALARY_FLOOR

# 4. Normalisasi teks skills (clean_student_skills)
import re
def clean_skills(text):
    if pd.isna(text): return ""
    text = str(text).lower()
    text = re.sub(r'[^a-z0-9\s,]', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()

df['clean_student_skills'] = df['student_skills'].apply(clean_skills)
```
