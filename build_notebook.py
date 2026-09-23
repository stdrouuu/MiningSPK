"""
Script pembuat phase_3_data_preparation.ipynb dalam format JSON Notebook standar.
Notebook ini didesain 100% kompatibel untuk Google Colab maupun VS Code / Jupyter Lab lokal.
"""

import json

cells = []

def add_md(source):
    cells.append({
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in source.strip().split("\n")]
    })

def add_code(source):
    cells.append({
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" for line in source.strip().split("\n")]
    })

# ==========================================
# 1. HEADER & INTRO
# ==========================================
add_md("""# 🎓 CRISP-DM Fase 3 — Data Preparation
### Proyek: Sistem Pendukung Keputusan Rekomendasi Pekerjaan Part-Time Mahasiswa UKRIDA Menggunakan Metode SMARTER
**Studi Kasus:** Mahasiswa Informatika, Fakultas Teknologi Cerdas, Universitas Kristen Krida Wacana (UKRIDA)  
**Anggota Tim:**
* **412024022** — Brandon Jeremiah Sutedja
* **412024043** — Andrew Linardi
* **412025014** — Raffael Benediktus Lolaroh
* **412025021** — Michael Aaron Sipahutar

---
### 📌 Tujuan Eksekusi Fase 3 (Data Preparation):
Fase ini berfokus pada **pembersihan, penyaringan, transformasi, dan persiapan fitur data**.
Output akhir dari notebook ini adalah:
1. **`clean_jobs_dataset.csv`**: Dataset lowongan kerja *part-time* terkini di Jabodetabek yang bebas dari data bodong/anomali/duplikat.
2. **`clean_students_dataset.csv`**: Dataset preferensi mahasiswa UKRIDA yang telah dibersihkan dari *missing values* dan distandardisasi.
3. **`decision_matrix_sample.csv`**: Matriks keputusan $M \times N$ berisi 5 kriteria utama ($C_1 - C_5$) yang siap diolah pada **Fase 4 (Modeling)**.

> **Catatan Akademik:** Sesuai batasan metodologi CRISP-DM, notebook ini **berhenti tepat pada output kesiapan data Fase 3** dan tidak menjalankan perangkingan akhir SPK (yang merupakan ranah Fase 4).""")

# ==========================================
# 2. SETUP & ENVIRONMENT
# ==========================================
add_md("""---
## 🛠️ 1. Setup Environment & Import Library
Sel ini menyiapkan dependensi yang dibutuhkan. Jika dijalankan di **Google Colab**, kode ini mendukung *mount* Google Drive (opsional) dan menginstal pustaka yang diperlukan.""")

add_code("""# Setup pustaka dan dependensi
import os
import re
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Konfigurasi visualisasi
sns.set_theme(style="whitegrid")
plt.rcParams['figure.figsize'] = (10, 5)

print("✅ Seluruh library berhasil diimpor dengan sukses!")""")

# ==========================================
# 3. DATA INGESTION
# ==========================================
add_md("""---
## 📥 2. Ingestion Dataset Mentah (Raw Data)
Membaca dataset mentah hasil scraping job portal (`raw_job_postings.csv`) dan respon kuesioner mahasiswa UKRIDA (`raw_student_preferences.csv`).""")

add_code("""# Membaca data mentah
df_raw_jobs = pd.read_csv('raw_job_postings.csv')
df_raw_students = pd.read_csv('raw_student_preferences.csv')

print(f"📊 Dimensi Awal Data Lowongan Mentah : {df_raw_jobs.shape[0]} baris, {df_raw_jobs.shape[1]} kolom")
print(f"📊 Dimensi Awal Data Kuesioner Mahasiswa: {df_raw_students.shape[0]} baris, {df_raw_students.shape[1]} kolom")

# Menampilkan 3 baris sampel lowongan mentah
df_raw_jobs.head(3)""")

# ==========================================
# 4. RULE-BASED FILTERING 6 LAPISAN
# ==========================================
add_md("""---
## 🧹 3. Langkah 1 — Seleksi Data: Rule-Based Filtering (6 Lapisan)
Menerapkan 6 lapisan penyaringan berurutan untuk menyaring data mentah:
1. **Deduplikasi**: Menghapus duplikasi ID, URL, dan duplikasi lintas portal (*cross-platform*).
2. **Negative Keyword Filtering**: Mengeliminasi lowongan non-part-time (`full-time`, `magang`, `internship`, `volunteer`, `management trainee`).
3. **Student Feasibility**: Membatasi jam kerja maksimal $\le 30$ jam/minggu agar tidak bentrok dengan jadwal kuliah.
4. **Salary Anomaly & Anti-Scam**: Menyingkirkan gaji abnormal ($< \text{Rp}10.000$ atau $> \text{Rp}200.000$/jam) serta modus komisi murni / penipuan klik iklan.
5. **Geographic Filtering**: Memastikan lokasi berada di wilayah Jabodetabek atau berformat *Remote*.
6. **Completeness Check**: Menghapus baris yang kehilangan judul atau URL.""")

add_code("""# Eksekusi 6 Lapisan Filtering
funnel_records = []
curr_df = df_raw_jobs.copy()
funnel_records.append(('1. Raw Data Awal', len(curr_df), 0))

# Lapisan 1: Deduplikasi Data
b1 = len(curr_df)
curr_df = curr_df.drop_duplicates(subset=['job_id'])
curr_df = curr_df.drop_duplicates(subset=['url'])
# Cross-platform duplicate
t_title = curr_df['job_title'].astype(str).str.lower().str.strip()
t_comp = curr_df['company_name'].astype(str).str.lower().str.strip()
t_loc = curr_df['work_job_location'].astype(str).str.lower().str.strip()
curr_df = curr_df.loc[~pd.Series(list(zip(t_title, t_comp, t_loc)), index=curr_df.index).duplicated()]
funnel_records.append(('2. Deduplikasi', len(curr_df), b1 - len(curr_df)))

# Lapisan 2: Negative Keyword Filtering
b2 = len(curr_df)
neg_pattern = r'full[-\s]?time|magang|internship|volunteer|management trainee|kontrak tahunan|supervisor|manajer|manager|head of|lead|direktur'
curr_df = curr_df[~curr_df['job_title'].astype(str).str.contains(neg_pattern, case=False, na=False)]
funnel_records.append(('3. Filter Non-Part Time', len(curr_df), b2 - len(curr_df)))

# Lapisan 3: Student Feasibility (Jam Kerja <= 30 jam)
b3 = len(curr_df)
curr_df = curr_df[curr_df['work_hours'].isna() | (curr_df['work_hours'] <= 30)]
funnel_records.append(('4. Kelayakan Jam Mahasiswa', len(curr_df), b3 - len(curr_df)))

# Lapisan 4: Salary Anomaly & Anti-Scam
b4 = len(curr_df)
curr_df = curr_df[curr_df['work_salaryperhour'].isna() | 
                  ((curr_df['work_salaryperhour'] >= 10000) & (curr_df['work_salaryperhour'] <= 200000))]
scam_pattern = r'komisi murni|tanpa gaji pokok|bagi hasil murni|like video|klik iklan|cuan ratusan ribu|investasi klik'
curr_df = curr_df[~curr_df['work_required_skills'].astype(str).str.contains(scam_pattern, case=False, na=False)]
curr_df = curr_df[~curr_df['job_title'].astype(str).str.contains(scam_pattern, case=False, na=False)]
funnel_records.append(('5. Filter Anomali Gaji & Scam', len(curr_df), b4 - len(curr_df)))

# Lapisan 5: Geographic Filtering (Jabodetabek / Remote)
b5 = len(curr_df)
jabo_keys = ['jakarta', 'jakbar', 'jaksel', 'jakpus', 'jaktim', 'jakut', 'tanjung duren',
             'grogol', 'kebon jeruk', 'tangerang', 'tangsel', 'depok', 'bekasi', 'bogor']
is_remote = curr_df['work_system'].astype(str).str.lower().str.strip() == 'remote'
is_jabo = curr_df['work_job_location'].astype(str).str.lower().apply(lambda x: any(k in x for k in jabo_keys))
curr_df = curr_df[is_remote | is_jabo]
funnel_records.append(('6. Geografis Jabodetabek/Remote', len(curr_df), b5 - len(curr_df)))

# Lapisan 6: Completeness Check
b6 = len(curr_df)
curr_df = curr_df[curr_df['job_title'].notna() & (curr_df['job_title'].astype(str).str.strip() != '')]
curr_df = curr_df[curr_df['url'].notna() & (curr_df['url'].astype(str).str.strip() != '')]
funnel_records.append(('7. Kelengkapan Atribut Esensial', len(curr_df), b6 - len(curr_df)))

df_funnel = pd.DataFrame(funnel_records, columns=['Tahapan Filtering', 'Jumlah Sisa', 'Data Tereduksi'])
df_funnel""")

add_code("""# Visualisasi Corong Eliminasi Data (Data Filtering Funnel)
plt.figure(figsize=(10, 5))
colors = ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728']
bars = plt.barh(df_funnel['Tahapan Filtering'][::-1], df_funnel['Jumlah Sisa'][::-1], color=colors[::-1])

plt.title('Corong Penyaringan Data Mentah (Data Filtering Funnel)', fontsize=14, fontweight='bold', pad=15)
plt.xlabel('Jumlah Baris Lowongan Kerja', fontsize=12)
plt.xlim(0, max(df_funnel['Jumlah Sisa']) + 50)

# Label angka pada setiap bar
for bar in bars:
    w = bar.get_width()
    plt.text(w + 5, bar.get_y() + bar.get_height()/2, f"{int(w)} loker", va='center', fontweight='bold')

plt.tight_layout()
plt.show()""")

# ==========================================
# 5. MISSING VALUES HANDLING
# ==========================================
add_md("""---
## 🩹 4. Langkah 2 — Penanganan Nilai Hilang (Missing Values)
Strategi penanganan nilai hilang sesuai spesifikasi Section 3.1:
* **`work_salaryperhour`**: Imputasi nilai **Median** per kategori pekerjaan (`job_category`).
* **`work_hours`**: Imputasi nilai **Median** per kategori pekerjaan (`job_category`).
* **`work_system`**: Imputasi **Modus** (ditetapkan ke *\"Onsite\"*).
* **`work_required_skills`**: Imputasi nilai standar bawaan (*\"Komunikasi, Time Management\"*).
* **Dataset Kuesioner Mahasiswa**: Diterapkan **Listwise Deletion** (menghapus baris mahasiswa yang tidak mengisi form secara lengkap).""")

add_code("""print("🔍 Kondisi Missing Values pada Data Lowongan SEBELUM Imputasi:")
print(curr_df[['work_salaryperhour', 'work_hours', 'work_system', 'work_required_skills']].isna().sum())

# 1. Imputasi Median per Kategori untuk Gaji & Jam Kerja
curr_df['work_salaryperhour'] = curr_df.groupby('job_category')['work_salaryperhour'].transform(lambda x: x.fillna(x.median()))
curr_df['work_salaryperhour'] = curr_df['work_salaryperhour'].fillna(curr_df['work_salaryperhour'].median())

curr_df['work_hours'] = curr_df.groupby('job_category')['work_hours'].transform(lambda x: x.fillna(x.median()))
curr_df['work_hours'] = curr_df['work_hours'].fillna(curr_df['work_hours'].median())

# 2. Imputasi Modus untuk work_system
curr_df['work_system'] = curr_df['work_system'].fillna("Onsite")

# 3. Imputasi Default Text untuk work_required_skills
curr_df['work_required_skills'] = curr_df['work_required_skills'].fillna("Komunikasi, Time Management")

print("\\n✅ Kondisi Missing Values pada Data Lowongan SETELAH Imputasi:")
print(curr_df[['work_salaryperhour', 'work_hours', 'work_system', 'work_required_skills']].isna().sum())""")

add_code("""# Penanganan Missing Value pada Data Kuesioner Mahasiswa (Listwise Deletion)
print(f"Jumlah responden mahasiswa sebelum pembersihan: {len(df_raw_students)}")
df_students_clean = df_raw_students.dropna(subset=['student_skills', 'min_expected_salary', 'student_expected_work_hour']).copy()
dropped_students = len(df_raw_students) - len(df_students_clean)
print(f"Jumlah responden mahasiswa setelah Listwise Deletion: {len(df_students_clean)} (Dihapus: {dropped_students} respons tidak lengkap)")""")

# ==========================================
# 6. OUTLIERS & FORMAT STANDARDIZATION
# ==========================================
add_md("""---
## 📐 5. Langkah 3 — Penanganan Outlier & Standardisasi Format
1. **Pembatasan Batas Logis Gaji**: Memastikan gaji per jam berada di interval wajar $\\text{Rp}10.000 - \\text{Rp}150.000$/jam.
2. **Pembatasan Jam Kerja**: Menetapkan *upper bound* jam kerja mahasiswa maksimal 30 jam/minggu.
3. **Standardisasi Teks Lokasi**: Menyeragamkan penulisan informal (contoh: *\"Jakbar\"*, *\"Tanjung Duren\"*, *\"Grogol\"* $\\rightarrow$ *\"Jakarta Barat\"*).
4. **Privasi Mahasiswa**: Menghapus atribut `student_nim` dan `timestamp` dari dataset komputasi.""")

add_code("""def standardize_location(loc_str):
    if pd.isna(loc_str):
        return "Unknown"
    loc_clean = str(loc_str).strip().lower()
    if any(k in loc_clean for k in ["jakbar", "jkt barat", "tanjung duren", "grogol", "kebon jeruk", "jakarta barat"]):
        return "Jakarta Barat"
    elif any(k in loc_clean for k in ["jaksel", "jkt selatan", "jakarta selatan"]):
        return "Jakarta Selatan"
    elif any(k in loc_clean for k in ["jakpus", "jkt pusat", "jakarta pusat"]):
        return "Jakarta Pusat"
    elif any(k in loc_clean for k in ["jaktim", "jkt timur", "jakarta timur"]):
        return "Jakarta Timur"
    elif any(k in loc_clean for k in ["jakut", "jkt utara", "jakarta utara"]):
        return "Jakarta Utara"
    elif any(k in loc_clean for k in ["tangsel", "tangerang selatan"]):
        return "Tangerang Selatan"
    elif "tangerang" in loc_clean:
        return "Tangerang"
    elif "depok" in loc_clean:
        return "Depok"
    elif "bekasi" in loc_clean:
        return "Bekasi"
    elif "bogor" in loc_clean:
        return "Bogor"
    elif "remote" in loc_clean:
        return "Remote"
    return str(loc_str).title()

# Terapkan standardisasi lokasi
curr_df['work_job_location_clean'] = curr_df['work_job_location'].apply(standardize_location)
df_students_clean['student_location_clean'] = df_students_clean['student_location'].apply(standardize_location)

# Capping outlier numerik
curr_df['work_salaryperhour'] = curr_df['work_salaryperhour'].clip(lower=10000.0, upper=150000.0)
curr_df['work_hours'] = curr_df['work_hours'].clip(upper=30.0)

# Hapus kolom privasi pada data mahasiswa
df_students_final = df_students_clean.drop(columns=['student_nim', 'timestamp'], errors='ignore')

print("✅ Standardisasi teks lokasi dan capping outlier berhasil diterapkan.")
print(f"Distribusi Lokasi Kerja Terstandarisasi:\\n{curr_df['work_job_location_clean'].value_counts().head(6)}")""")

# ==========================================
# 7. CATEGORICAL ENCODING
# ==========================================
add_md("""---
## 🔢 6. Langkah 4 — Categorical Encoding Sistem Kerja
Mengonversi atribut kategorikal sistem kerja (`work_system`) ke format numerik:
* $\\text{Remote} \\rightarrow 1$
* $\\text{Hybrid} \\rightarrow 2$
* $\\text{Onsite} \\rightarrow 3$""")

add_code("""# Mapping sistem kerja
system_map = {"Remote": 1, "Hybrid": 2, "Onsite": 3}
curr_df['work_system_encoded'] = curr_df['work_system'].map(system_map).fillna(3).astype(int)

plt.figure(figsize=(7, 3))
sns.countplot(x=curr_df['work_system'], palette='Blues_r', order=['Remote', 'Hybrid', 'Onsite'])
plt.title('Distribusi Sistem Kerja Lowongan Part-Time', fontweight='bold')
plt.xlabel('Sistem Kerja')
plt.ylabel('Frekuensi')
plt.tight_layout()
plt.show()""")

# ==========================================
# 8. TEXT MINING & COSINE SIMILARITY
# ==========================================
add_md("""---
## 🧠 7. Langkah 5 — Text Mining Keahlian (NLP & Cosine Similarity)
Tahapan NLP untuk mengubah teks deskripsi keahlian menjadi representasi vektor numerik kontinu $[0{,}0 - 1{,}0]$ untuk **Kriteria $C_5$ (Kemiripan Keahlian)**:
1. **Case Folding**: Mengubah seluruh teks menjadi huruf kecil (*lowercase*).
2. **Punctuation Removal**: Menghilangkan tanda baca dan karakter non-alfanumerik.
3. **Tokenization & Stopword Removal**: Membuang kata hubung non-esensial (*Bahasa Indonesia & Inggris*).
4. **Vektorisasi TF-IDF**: Membentuk representasi bobot kata $\\vec{V}_{\\text{mahasiswa}}$ dan $\\vec{V}_{\\text{lowongan}}$.
5. **Kalkulasi Cosine Similarity**: Mengukur derajat kecocokan sudut kosinus antar vektor.""")

add_code("""# Stopwords ID & EN
STOPWORDS_ID_EN = {
    'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'adalah', 'sebagai', 'yang',
    'atau', 'ini', 'itu', 'dalam', 'bisa', 'akan', 'dapat', 'kami', 'anda', 'saya',
    'secara', 'karena', 'oleh', 'tentang', 'setiap', 'serta', 'juga', 'bagi', 'agar',
    'and', 'in', 'to', 'for', 'with', 'is', 'as', 'the', 'or', 'this', 'that', 'at'
}

def clean_text_nlp(text):
    if pd.isna(text) or not str(text).strip():
        return ""
    text = str(text).lower()
    text = re.sub(r'[^a-zA-Z\s]', ' ', text)
    tokens = text.split()
    clean_tokens = [t for t in tokens if t not in STOPWORDS_ID_EN and len(t) > 1]
    return " ".join(clean_tokens)

# Preprocessing teks keahlian
curr_df['clean_required_skills'] = curr_df['work_required_skills'].apply(clean_text_nlp)
df_students_final['clean_student_skills'] = df_students_final['student_skills'].apply(clean_text_nlp)

# Mengambil 1 profil mahasiswa UKRIDA sebagai sampel evaluasi
sample_student = df_students_final.iloc[0]
print(f"👤 Mahasiswa Evaluator : {sample_student['student_name']} ({sample_student['student_id']})")
print(f"🎯 Kategori Pilihan    : {sample_student['student_job_category']}")
print(f"💡 Keahlian Asli       : {sample_student['student_skills']}")
print(f"✨ Keahlian Bersih NLP : {sample_student['clean_student_skills']}")

# Vektorisasi TF-IDF & Cosine Similarity
corpus = [sample_student['clean_student_skills']] + curr_df['clean_required_skills'].tolist()
tfidf_vectorizer = TfidfVectorizer()
tfidf_matrix = tfidf_vectorizer.fit_transform(corpus)

# Menghitung kemiripan antara Mahasiswa (indeks 0) dengan setiap lowongan (indeks 1 dst)
sim_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
curr_df['C5_skill_similarity'] = np.round(sim_scores, 4)

print(f"\\n📊 Statistik Skor Cosine Similarity (Kriteria C5):")
print(f"Skor Terendah : {curr_df['C5_skill_similarity'].min():.4f}")
print(f"Skor Rata-rata: {curr_df['C5_skill_similarity'].mean():.4f}")
print(f"Skor Tertinggi: {curr_df['C5_skill_similarity'].max():.4f}")""")

# ==========================================
# 9. DECISION MATRIX CONSTRUCTION
# ==========================================
add_md("""---
## 🏗️ 8. Langkah 6 — Konstruksi Matriks Keputusan $M \\times N$ (Fitur SPK)
Membentuk 5 fitur kriteria keputusan ($C_1 - C_5$) sesuai formula formal:
* **$C_1$ (Kesesuaian Kategori)**: $1{,}0$ jika `job_category` sesuai preferensi mahasiswa, $0{,}3$ jika berbeda.
* **$C_2$ (Rasio Penawaran Gaji)**: $\\frac{\\text{work\\_salaryperhour}}{\\text{min\\_expected\\_salary}}$
* **$C_3$ (Aksesibilitas Lokasi)**: $1{,}0$ (Remote / Se-wilayah), $0{,}8$ (Sesama Jakarta), $0{,}4$ (Wilayah Lain).
* **$C_4$ (Kesesuaian Jam Kerja)**: $1{,}0 - \\frac{|\\text{work\\_hours} - \\text{student\\_expected\\_work\\_hour}|}{20}$
* **$C_5$ (Kemiripan Keahlian)**: Skor Cosine Similarity TF-IDF $[0{,}0 - 1{,}0]$.""")

add_code("""# 1. Kriteria C1: Kesesuaian Kategori
c1_vals = np.where(curr_df['job_category'] == sample_student['student_job_category'], 1.0, 0.3)

# 2. Kriteria C2: Rasio Penawaran Gaji
c2_vals = np.round(curr_df['work_salaryperhour'] / sample_student['min_expected_salary'], 4)

# 3. Kriteria C3: Aksesibilitas Lokasi
def calc_c3(row):
    sys = str(row['work_system']).strip().lower()
    jloc = str(row['work_job_location_clean']).strip().lower()
    sloc = str(sample_student['student_location_clean']).strip().lower()
    if sys == 'remote' or jloc == 'remote' or jloc == sloc:
        return 1.0
    elif 'jakarta' in jloc and 'jakarta' in sloc:
        return 0.8
    return 0.4

c3_vals = curr_df.apply(calc_c3, axis=1)

# 4. Kriteria C4: Kesesuaian Jam Kerja
diff = np.abs(curr_df['work_hours'] - sample_student['student_expected_work_hour'])
c4_vals = np.round(np.clip(1.0 - (diff / 20.0), 0.0, 1.0), 4)

# 5. Kriteria C5: Kemiripan Keahlian (Cosine Similarity)
c5_vals = curr_df['C5_skill_similarity']

# Konstruksi Matriks Keputusan M x N
decision_matrix = pd.DataFrame({
    'job_id': curr_df['job_id'],
    'job_title': curr_df['job_title'],
    'company_name': curr_df['company_name'],
    'job_category': curr_df['job_category'],
    'work_job_location': curr_df['work_job_location_clean'],
    'work_system': curr_df['work_system'],
    'work_salaryperhour': curr_df['work_salaryperhour'],
    'work_hours': curr_df['work_hours'],
    'C1_kategori': c1_vals,
    'C2_rasio_gaji': c2_vals,
    'C3_lokasi': c3_vals,
    'C4_jam_kerja': c4_vals,
    'C5_kemiripan_skill': c5_vals
})

print(f"✅ Matriks Keputusan M x N berhasil dibentuk dengan dimensi: {decision_matrix.shape[0]} alternatif x {decision_matrix.shape[1]} atribut.")
decision_matrix.head(5)""")

# ==========================================
# 10. EXPORT & KESIMPULAN
# ==========================================
add_md("""---
## 💾 9. Penyimpanan Hasil & Validasi Kesiapan Fase 4
Menyimpan dataset hasil akhir dari Fase 3 ke dalam file CSV terstruktur:
1. `clean_jobs_dataset.csv`
2. `clean_students_dataset.csv`
3. `decision_matrix_sample.csv`""")

add_code("""# Menyimpan dataset final Fase 3
clean_jobs_export = curr_df[[
    'job_id', 'job_title', 'company_name', 'job_category', 'work_salaryperhour',
    'work_job_location_clean', 'work_hours', 'work_system', 'work_system_encoded',
    'work_required_skills', 'clean_required_skills', 'source_portal', 'url', 'date_posted'
]].rename(columns={'work_job_location_clean': 'work_job_location'})

clean_jobs_export.to_csv('clean_jobs_dataset.csv', index=False)
df_students_final.to_csv('clean_students_dataset.csv', index=False)
decision_matrix.to_csv('decision_matrix_sample.csv', index=False)

print("🎉 Seluruh artefak dataset Fase 3 berhasil diekspor:")
print(f"1. clean_jobs_dataset.csv     : {len(clean_jobs_export)} baris data lowongan siap pakai")
print(f"2. clean_students_dataset.csv : {len(df_students_final)} baris data preferensi mahasiswa")
print(f"3. decision_matrix_sample.csv : {len(decision_matrix)} baris matriks keputusan (C1 - C5)")
print("\\n🏁 DATA PREPARATION SELESAI — Data siap dimasukkan ke Fase 4 (Modeling / SPK SMARTER)!")""")

# Build final notebook dictionary
nb = {
    "cells": cells,
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3"
        },
        "language_info": {
            "codemirror_mode": {
                "name": "ipython",
                "version": 3
            },
            "file_extension": ".py",
            "mimetype": "text/x-python",
            "name": "python",
            "nbconvert_exporter": "python",
            "pygments_lexer": "ipython3",
            "version": "3.12.5"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 4
}

with open("phase_3_data_preparation.ipynb", "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=2, ensure_ascii=False)

print("[OK] File phase_3_data_preparation.ipynb berhasil dibuat!")
