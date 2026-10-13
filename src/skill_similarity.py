"""Text mining keahlian: TF-IDF + Cosine Similarity untuk C5 (Section 4.2)."""

import json
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from src.config import WEB_DATA_DIR
from src.nlp import clean_text_nlp

# Artefak untuk web agar C5 di frontend memakai IDF yang SAMA dengan pipeline (G1).
TFIDF_ARTIFACT_NAME = "tfidf_skills.json"


def export_tfidf_artifact(vectorizer, path):
    """Simpan vocabulary + idf agar web menghitung TF-IDF yang identik."""
    artifact = {
        "vocabulary": {term: int(idx) for term, idx in vectorizer.vocabulary_.items()},
        "idf": [float(v) for v in vectorizer.idf_],
        "ngram_range": list(vectorizer.ngram_range),
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(artifact, f)
    print(f"-> [OK] Artefak TF-IDF ({len(artifact['vocabulary'])} term) -> '{path}'")


def compute_skill_similarity(df_jobs, df_students_final, artifact_dir=None):
    """Preprocess teks skill, vektorisasi TF-IDF, hitung cosine similarity vs 1 mahasiswa sampel.

    IDF di-fit dari korpus lowongan SAJA (bukan sampel+lowongan) agar stabil
    antar mahasiswa dan bisa dipakai ulang oleh web (G1). Artefak
    vocabulary+idf diekspor untuk frontend bila artifact_dir diisi.
    """
    df_jobs["clean_required_skills"] = df_jobs["work_required_skills"].apply(clean_text_nlp)
    df_students_final["clean_student_skills"] = df_students_final["student_skills"].apply(clean_text_nlp)

    sample_student = df_students_final.iloc[0]
    print(f"Mahasiswa Sampel: {sample_student['student_name']} ({sample_student['student_id']})")
    print(f"-> Kategori Minat : {sample_student['student_job_category']}")
    print(f"-> Min. Gaji      : Rp {sample_student['min_expected_salary']:,.0f}/jam")
    print(f"-> Jam Kerja Harap: {sample_student['student_expected_work_hour']} jam/minggu")
    print(f"-> Keahlian Mentah: {sample_student['student_skills']}")
    print(f"-> Keahlian Bersih: {sample_student['clean_student_skills']}")

    # Fit IDF pada korpus lowongan saja -> stabil untuk semua mahasiswa.
    vectorizer = TfidfVectorizer()
    job_matrix = vectorizer.fit_transform(df_jobs["clean_required_skills"].tolist())
    stud_matrix = vectorizer.transform([sample_student["clean_student_skills"]])

    sim_scores = cosine_similarity(stud_matrix, job_matrix).flatten()
    df_jobs["C5_skill_similarity"] = np.round(sim_scores, 4)

    print("Statistik Skor Kemiripan Keahlian (C5):")
    print(f"-> Min  : {df_jobs['C5_skill_similarity'].min():.4f}")
    print(f"-> Mean : {df_jobs['C5_skill_similarity'].mean():.4f}")
    print(f"-> Max  : {df_jobs['C5_skill_similarity'].max():.4f}")

    if artifact_dir is not None:
        export_tfidf_artifact(vectorizer, Path(artifact_dir) / TFIDF_ARTIFACT_NAME)
        try:
            WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)
            export_tfidf_artifact(vectorizer, WEB_DATA_DIR / TFIDF_ARTIFACT_NAME)
        except Exception as exc:
            print(f"-> [WARN] Sinkron artefak TF-IDF ke web dilewati: {exc}")

    return df_jobs, sample_student
