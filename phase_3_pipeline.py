"""
CRISP-DM Fase 3: Data Preparation Pipeline
Proyek: SPK Rekomendasi Pekerjaan Part-Time Mahasiswa UKRIDA
Fokus: Persiapan data, pembersihan 6 lapisan, imputasi, standardisasi, NLP TF-IDF Cosine Similarity,
       dan konstruksi matriks keputusan M x N (Kriteria C1 - C5).
Catatan: Pipeline ini murni data preparation untuk Fase 3, berhenti sebelum pemodelan SPK Fase 4.
"""

import re
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ==========================================
# STOPWORDS BILINGUAL (INDONESIA & INGGRIS)
# ==========================================
STOPWORDS_ID_EN = {
    # Indonesian stopwords
    "dan", "di", "ke", "dari", "untuk", "pada", "dengan", "adalah", "sebagai", "yang",
    "atau", "ini", "itu", "dalam", "bisa", "akan", "dapat", "kami", "anda", "saya",
    "secara", "karena", "oleh", "tentang", "setiap", "serta", "juga", "bagi", "agar",
    "supaya", "kalian", "mereka", "kita", "yaitu", "yakni", "baik", "antara", "saat",
    "bila", "jika", "kalau", "namun", "tetapi", "melalui", "terhadap", "tanpa", "dasar",
    
    # English stopwords
    "and", "in", "to", "for", "with", "is", "as", "the", "or", "this", "that", "at",
    "from", "by", "an", "be", "on", "are", "of", "all", "any", "our", "you", "your",
    "we", "will", "can", "their", "into", "through", "about", "such"
}

def clean_text_nlp(text):
    """
    NLP Preprocessing:
    1. Case Folding (lowercase)
    2. Punctuation & Symbol Removal
    3. Tokenization & Whitespace Normalization
    4. Stopword Removal (ID & EN)
    """
    if pd.isna(text) or not str(text).strip():
        return ""
    
    # 1. Lowercase
    text = str(text).lower()
    
    # 2. Hapus simbol, tanda baca, bullet point, dan angka
    text = re.sub(r'[^a-zA-Z\s]', ' ', text)
    
    # 3. Tokenisasi sederhana & buang stopword
    tokens = text.split()
    filtered_tokens = [tok for tok in tokens if tok not in STOPWORDS_ID_EN and len(tok) > 1]
    
    return " ".join(filtered_tokens)


def standardize_location(loc_str):
    """
    Standardisasi Format Teks Lokasi Jabodetabek
    """
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
    else:
        return str(loc_str).title()


def run_phase_3_pipeline():
    print("=" * 75)
    print("      CRISP-DM FASE 3: DATA PREPARATION PIPELINE EXECUTION")
    print("      Proyek SPK Lowongan Part-Time Mahasiswa UKRIDA")
    print("=" * 75)
    
    # -------------------------------------------------------------
    # 1. DATA INGESTION
    # -------------------------------------------------------------
    print("\n[LANGKAH 1] Membaca Dataset Mentah (Data Ingestion)...")
    df_raw = pd.read_csv("raw_job_postings.csv")
    df_stud = pd.read_csv("raw_student_preferences.csv")
    
    initial_jobs_count = len(df_raw)
    initial_students_count = len(df_stud)
    print(f"-> Total data mentah lowongan: {initial_jobs_count} baris")
    print(f"-> Total data mentah kuesioner mahasiswa: {initial_students_count} responden")
    
    # -------------------------------------------------------------
    # 2. FILTERING 6 LAPISAN (RULE-BASED FILTERING PIPELINE)
    # -------------------------------------------------------------
    print("\n[LANGKAH 2] Menjalankan 6 Lapisan Filtering Data Mentah...")
    funnel_log = []
    
    curr_df = df_raw.copy()
    funnel_log.append(("1. Total Data Mentah Awal", len(curr_df), 0))
    
    # Lapisan 1: Deduplikasi Data
    before_dedup = len(curr_df)
    # Hapus job_id atau url identik
    curr_df = curr_df.drop_duplicates(subset=["job_id"])
    curr_df = curr_df.drop_duplicates(subset=["url"])
    # Hapus duplikasi lintas portal (judul + perusahaan + lokasi sama)
    curr_df["temp_title_norm"] = curr_df["job_title"].astype(str).str.lower().str.strip()
    curr_df["temp_comp_norm"] = curr_df["company_name"].astype(str).str.lower().str.strip()
    curr_df["temp_loc_norm"] = curr_df["work_job_location"].astype(str).str.lower().str.strip()
    curr_df = curr_df.drop_duplicates(subset=["temp_title_norm", "temp_comp_norm", "temp_loc_norm"])
    curr_df = curr_df.drop(columns=["temp_title_norm", "temp_comp_norm", "temp_loc_norm"])
    dropped_dedup = before_dedup - len(curr_df)
    funnel_log.append(("2. Pasca Deduplikasi (Exact & Cross-Platform)", len(curr_df), dropped_dedup))
    
    # Lapisan 2: Negative Keyword Filtering
    before_neg = len(curr_df)
    neg_regex = r'full[-\s]?time|magang|internship|volunteer|management trainee|kontrak tahunan'
    curr_df = curr_df[~curr_df["job_title"].astype(str).str.contains(neg_regex, case=False, na=False)]
    dropped_neg = before_neg - len(curr_df)
    funnel_log.append(("3. Pasca Filter Kata Kunci Negatif (Non-Part-Time)", len(curr_df), dropped_neg))
    
    # Lapisan 3: Student Feasibility Filtering (Jam Kerja <= 30 jam)
    before_feas = len(curr_df)
    # Buang yang secara eksplisit > 30 jam
    curr_df = curr_df[curr_df["work_hours"].isna() | (curr_df["work_hours"] <= 30)]
    dropped_feas = before_feas - len(curr_df)
    funnel_log.append(("4. Pasca Filter Kelayakan Beban Mahasiswa (Jam <= 30)", len(curr_df), dropped_feas))
    
    # Lapisan 4: Salary Anomaly & Anti-Scam Filtering
    before_salary = len(curr_df)
    # Buang gaji < 10000 atau > 200000 (jika ada nilai)
    curr_df = curr_df[curr_df["work_salaryperhour"].isna() | 
                      ((curr_df["work_salaryperhour"] >= 10000) & (curr_df["work_salaryperhour"] <= 200000))]
    # Buang indikasi penipuan / komisi murni tanpa gaji pokok
    scam_regex = r'komisi murni|tanpa gaji pokok|bagi hasil murni|like video|klik iklan|cuan ratusan ribu|investasi klik'
    curr_df = curr_df[~curr_df["work_required_skills"].astype(str).str.contains(scam_regex, case=False, na=False)]
    curr_df = curr_df[~curr_df["job_title"].astype(str).str.contains(scam_regex, case=False, na=False)]
    dropped_salary = before_salary - len(curr_df)
    funnel_log.append(("5. Pasca Filter Anomali Gaji & Anti-Scam", len(curr_df), dropped_salary))
    
    # Lapisan 5: Geographic & Locality Filtering
    before_geo = len(curr_df)
    valid_jabo_keywords = [
        "jakarta", "jakbar", "jaksel", "jakpus", "jaktim", "jakut", "tanjung duren",
        "grogol", "kebon jeruk", "tangerang", "tangsel", "depok", "bekasi", "bogor"
    ]
    is_remote = curr_df["work_system"].astype(str).str.lower().str.strip() == "remote"
    loc_lower = curr_df["work_job_location"].astype(str).str.lower()
    is_jabo = loc_lower.apply(lambda x: any(k in x for k in valid_jabo_keywords))
    curr_df = curr_df[is_remote | is_jabo]
    dropped_geo = before_geo - len(curr_df)
    funnel_log.append(("6. Pasca Filter Geografis (Jabodetabek / Remote)", len(curr_df), dropped_geo))
    
    # Lapisan 6: Completeness Sanity Check
    before_comp = len(curr_df)
    curr_df = curr_df[curr_df["job_title"].notna() & (curr_df["job_title"].astype(str).str.strip() != "")]
    curr_df = curr_df[curr_df["url"].notna() & (curr_df["url"].astype(str).str.strip() != "")]
    dropped_comp = before_comp - len(curr_df)
    funnel_log.append(("7. Pasca Filter Kelengkapan Data Esensial", len(curr_df), dropped_comp))
    
    # Cetak Tabel Corong (Funnel)
    print("\n--- RINGKASAN CORONG FILTERING (DATA FUNNEL SUMMARY) ---")
    print(f"{'Tahapan Filter':<50} | {'Sisa Baris':<10} | {'Tereduksi':<10}")
    print("-" * 75)
    for stage, rem, drop in funnel_log:
        print(f"{stage:<50} | {rem:<10} | {drop:<10}")
    print("-" * 75)
    
    # -------------------------------------------------------------
    # 3. PENANGANAN MISSING VALUES (SECTION 3.1)
    # -------------------------------------------------------------
    print("\n[LANGKAH 3] Penanganan Missing Values...")
    print("Jumlah Missing Values SEBELUM Imputasi:")
    print(curr_df[["work_salaryperhour", "work_hours", "work_system", "work_required_skills"]].isna().sum())
    
    # 3.1 Imputasi Median per Kategori untuk Gaji
    salary_medians = curr_df.groupby("job_category")["work_salaryperhour"].transform("median")
    curr_df["work_salaryperhour"] = curr_df["work_salaryperhour"].fillna(salary_medians)
    global_salary_median = curr_df["work_salaryperhour"].median()
    curr_df["work_salaryperhour"] = curr_df["work_salaryperhour"].fillna(global_salary_median)
    
    # 3.2 Imputasi Median per Kategori untuk Jam Kerja
    hours_medians = curr_df.groupby("job_category")["work_hours"].transform("median")
    curr_df["work_hours"] = curr_df["work_hours"].fillna(hours_medians)
    global_hours_median = curr_df["work_hours"].median()
    curr_df["work_hours"] = curr_df["work_hours"].fillna(global_hours_median)
    
    # 3.3 Imputasi Modus untuk work_system ("Onsite")
    curr_df["work_system"] = curr_df["work_system"].fillna("Onsite")
    
    # 3.4 Imputasi Default Value untuk work_required_skills
    curr_df["work_required_skills"] = curr_df["work_required_skills"].fillna("Komunikasi, Time Management")
    
    print("\nJumlah Missing Values SETELAH Imputasi:")
    print(curr_df[["work_salaryperhour", "work_hours", "work_system", "work_required_skills"]].isna().sum())
    
    # 3.5 Penanganan Missing Value pada Data Mahasiswa (Listwise Deletion)
    print(f"\nData Mahasiswa Awal: {len(df_stud)} responden")
    df_stud_clean = df_stud.dropna(subset=["student_skills", "min_expected_salary", "student_expected_work_hour"]).copy()
    dropped_stud = len(df_stud) - len(df_stud_clean)
    print(f"Data Mahasiswa Bersih (setelah Deletion baris tidak lengkap): {len(df_stud_clean)} responden (Dihapus: {dropped_stud})")
    
    # -------------------------------------------------------------
    # 4. PENANGANAN OUTLIER & STANDARDISASI FORMAT (SECTION 3.2)
    # -------------------------------------------------------------
    print("\n[LANGKAH 4] Standardisasi Format & Batas Logis Outlier...")
    
    # Standardisasi Lokasi
    curr_df["work_job_location_clean"] = curr_df["work_job_location"].apply(standardize_location)
    df_stud_clean["student_location_clean"] = df_stud_clean["student_location"].apply(standardize_location)
    
    # Capping Jam Kerja (maks 30 jam)
    curr_df["work_hours"] = curr_df["work_hours"].clip(upper=30.0)
    
    # Capping Gaji (batas logis Rp10.000 - Rp150.000/jam sesuai 3.2.1)
    curr_df["work_salaryperhour"] = curr_df["work_salaryperhour"].clip(lower=10000.0, upper=150000.0)
    
    # Hapus atribut non-esensial mahasiswa untuk privasi (student_nim, timestamp)
    df_stud_final = df_stud_clean.drop(columns=["student_nim", "timestamp"], errors="ignore")
    
    # -------------------------------------------------------------
    # 5. CATEGORICAL ENCODING (SECTION 4.1)
    # -------------------------------------------------------------
    print("\n[LANGKAH 5] Melakukan Categorical Encoding Sistem Kerja (work_system)...")
    system_mapping = {"Remote": 1, "Hybrid": 2, "Onsite": 3}
    curr_df["work_system_encoded"] = curr_df["work_system"].map(system_mapping).fillna(3).astype(int)
    print(f"Distribusi Encoding Sistem Kerja: \n{curr_df['work_system_encoded'].value_counts().to_dict()}")
    
    # -------------------------------------------------------------
    # 6. TEXT MINING KEAHLIAN: NLP & COSINE SIMILARITY (SECTION 4.2)
    # -------------------------------------------------------------
    print("\n[LANGKAH 6] Text Mining Keahlian (NLP TF-IDF & Cosine Similarity)...")
    
    # Preprocessing teks keahlian lowongan
    curr_df["clean_required_skills"] = curr_df["work_required_skills"].apply(clean_text_nlp)
    df_stud_final["clean_student_skills"] = df_stud_final["student_skills"].apply(clean_text_nlp)
    
    # Ambil 1 mahasiswa sampel aktif UKRIDA untuk evaluasi matriks keputusan (misal: Mahasiswa 1)
    sample_student = df_stud_final.iloc[0]
    print(f"Mahasiswa Sampel: {sample_student['student_name']} ({sample_student['student_id']})")
    print(f"-> Kategori Minat : {sample_student['student_job_category']}")
    print(f"-> Min. Gaji      : Rp {sample_student['min_expected_salary']:,.0f}/jam")
    print(f"-> Jam Kerja Harap: {sample_student['student_expected_work_hour']} jam/minggu")
    print(f"-> Keahlian Mentah: {sample_student['student_skills']}")
    print(f"-> Keahlian Bersih: {sample_student['clean_student_skills']}")
    
    # Vektorisasi TF-IDF
    corpus = [sample_student["clean_student_skills"]] + curr_df["clean_required_skills"].tolist()
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)
    
    # Kalkulasi Cosine Similarity antara Mahasiswa (vektor 0) dan Lowongan (vektor 1 dst)
    sim_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    curr_df["C5_skill_similarity"] = np.round(sim_scores, 4)
    
    print(f"Statistik Skor Kemiripan Keahlian (C5):")
    print(f"-> Min  : {curr_df['C5_skill_similarity'].min():.4f}")
    print(f"-> Mean : {curr_df['C5_skill_similarity'].mean():.4f}")
    print(f"-> Max  : {curr_df['C5_skill_similarity'].max():.4f}")
    
    # -------------------------------------------------------------
    # 7. KONSTRUKSI MATRIKS KEPUTUSAN M x N (FITUR C1 - C5)
    # -------------------------------------------------------------
    print("\n[LANGKAH 7] Membentuk Matriks Keputusan M x N untuk Kriteria SPK...")
    
    # C1: Kesesuaian Kategori (1.0 jika sama, 0.3 jika beda)
    c1_scores = np.where(curr_df["job_category"] == sample_student["student_job_category"], 1.0, 0.3)
    
    # C2: Rasio Penawaran Gaji (work_salaryperhour / min_expected_salary)
    c2_scores = np.round(curr_df["work_salaryperhour"] / sample_student["min_expected_salary"], 4)
    
    # C3: Aksesibilitas Lokasi
    # 1.0 jika Remote atau sama-sama satu wilayah
    # 0.8 jika sesama Jakarta
    # 0.4 wilayah penyangga lain
    def calc_c3(row):
        sys = str(row["work_system"]).strip().lower()
        job_loc = str(row["work_job_location_clean"]).strip().lower()
        stud_loc = str(sample_student["student_location_clean"]).strip().lower()
        
        if sys == "remote" or job_loc == "remote" or job_loc == stud_loc:
            return 1.0
        elif "jakarta" in job_loc and "jakarta" in stud_loc:
            return 0.8
        else:
            return 0.4

    c3_scores = curr_df.apply(calc_c3, axis=1)
    
    # C4: Kesesuaian Jam Kerja: 1.0 - |work_hours - expected_hours| / 20
    diff_hours = np.abs(curr_df["work_hours"] - sample_student["student_expected_work_hour"])
    c4_scores = np.round(np.clip(1.0 - (diff_hours / 20.0), 0.0, 1.0), 4)
    
    # C5: Kemiripan Keahlian (Cosine Similarity)
    c5_scores = curr_df["C5_skill_similarity"]
    
    # Susun Matriks Keputusan M x N
    decision_matrix = pd.DataFrame({
        "job_id": curr_df["job_id"],
        "job_title": curr_df["job_title"],
        "company_name": curr_df["company_name"],
        "job_category": curr_df["job_category"],
        "work_job_location": curr_df["work_job_location_clean"],
        "work_system": curr_df["work_system"],
        "work_salaryperhour": curr_df["work_salaryperhour"],
        "work_hours": curr_df["work_hours"],
        "C1_kategori": c1_scores,
        "C2_rasio_gaji": c2_scores,
        "C3_lokasi": c3_scores,
        "C4_jam_kerja": c4_scores,
        "C5_kemiripan_skill": c5_scores
    })
    
    # -------------------------------------------------------------
    # 8. MENYIMPAN DATASET HASIL FASE 3
    # -------------------------------------------------------------
    print("\n[LANGKAH 8] Menyimpan Dataset Output Fase 3...")
    
    # 1. Dataset Lowongan Bersih
    clean_jobs_export = curr_df[[
        "job_id", "job_title", "company_name", "job_category", "work_salaryperhour",
        "work_job_location_clean", "work_hours", "work_system", "work_system_encoded",
        "work_required_skills", "clean_required_skills", "source_portal", "url", "date_posted"
    ]].rename(columns={"work_job_location_clean": "work_job_location"})
    clean_jobs_export.to_csv("clean_jobs_dataset.csv", index=False)
    print(f"-> [OK] Berhasil menyimpan 'clean_jobs_dataset.csv' ({len(clean_jobs_export)} baris)")
    
    # 2. Dataset Mahasiswa Bersih
    df_stud_final.to_csv("clean_students_dataset.csv", index=False)
    print(f"-> [OK] Berhasil menyimpan 'clean_students_dataset.csv' ({len(df_stud_final)} baris)")
    
    # 3. Matriks Keputusan Sample (Siap Masuk ke Fase 4)
    decision_matrix.to_csv("decision_matrix_sample.csv", index=False)
    print(f"-> [OK] Berhasil menyimpan 'decision_matrix_sample.csv' ({len(decision_matrix)} baris x {decision_matrix.shape[1]} kolom)")
    
    print("\n" + "=" * 75)
    print(" FASE 3 (DATA PREPARATION) SELESAI DENGAN SUKSES!")
    print(" Data telah bersih, terstandardisasi, dan fitur kriteria C1 - C5 telah terbentuk.")
    print(" Pipeline BERHENTI DI SINI sebagai output resmi persiapan data untuk Fase 4.")
    print("=" * 75)
    
    print("\nSampel 5 Baris Teratas Matriks Keputusan:")
    print(decision_matrix[["job_id", "job_title", "C1_kategori", "C2_rasio_gaji", "C3_lokasi", "C4_jam_kerja", "C5_kemiripan_skill"]].head())

if __name__ == "__main__":
    run_phase_3_pipeline()
