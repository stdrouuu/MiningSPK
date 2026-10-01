"""Text mining keahlian: TF-IDF + Cosine Similarity untuk C5 (Section 4.2)."""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from src.nlp import clean_text_nlp


def compute_skill_similarity(df_jobs, df_students_final):
    """Preprocess teks skill, vektorisasi TF-IDF, hitung cosine similarity vs 1 mahasiswa sampel."""
    df_jobs["clean_required_skills"] = df_jobs["work_required_skills"].apply(clean_text_nlp)
    df_students_final["clean_student_skills"] = df_students_final["student_skills"].apply(clean_text_nlp)

    sample_student = df_students_final.iloc[0]
    print(f"Mahasiswa Sampel: {sample_student['student_name']} ({sample_student['student_id']})")
    print(f"-> Kategori Minat : {sample_student['student_job_category']}")
    print(f"-> Min. Gaji      : Rp {sample_student['min_expected_salary']:,.0f}/jam")
    print(f"-> Jam Kerja Harap: {sample_student['student_expected_work_hour']} jam/minggu")
    print(f"-> Keahlian Mentah: {sample_student['student_skills']}")
    print(f"-> Keahlian Bersih: {sample_student['clean_student_skills']}")

    corpus = [sample_student["clean_student_skills"]] + df_jobs["clean_required_skills"].tolist()
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)

    sim_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    df_jobs["C5_skill_similarity"] = np.round(sim_scores, 4)

    print("Statistik Skor Kemiripan Keahlian (C5):")
    print(f"-> Min  : {df_jobs['C5_skill_similarity'].min():.4f}")
    print(f"-> Mean : {df_jobs['C5_skill_similarity'].mean():.4f}")
    print(f"-> Max  : {df_jobs['C5_skill_similarity'].max():.4f}")

    return df_jobs, sample_student
