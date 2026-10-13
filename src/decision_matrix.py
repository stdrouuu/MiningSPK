"""Konstruksi matriks keputusan M x N untuk kriteria C1–C5 (Section 5)."""

import numpy as np
import pandas as pd

from src.config import C2_RATIO_CAP


def calc_c3(row, sample_student):
    sys = str(row["work_system"]).strip().lower()
    job_loc = str(row["work_job_location_clean"]).strip().lower()
    stud_loc = str(sample_student["student_location_clean"]).strip().lower()

    if sys == "remote" or job_loc == "remote" or job_loc == stud_loc:
        return 1.0
    elif "jakarta" in job_loc and "jakarta" in stud_loc:
        return 0.8
    else:
        return 0.4


def build_decision_matrix(df_jobs, sample_student):
    """Bentuk fitur C1–C5 relatif terhadap 1 mahasiswa sampel."""
    # C1: Kesesuaian Kategori (1.0 jika sama, 0.3 jika beda)
    c1_scores = np.where(df_jobs["job_category"] == sample_student["student_job_category"], 1.0, 0.3)

    # C2: Rasio Penawaran Gaji (di-cap agar outlier tidak mendominasi normalisasi)
    c2_raw = df_jobs["work_salaryperhour"] / sample_student["min_expected_salary"]
    c2_scores = np.round(np.clip(c2_raw, 0.0, C2_RATIO_CAP), 4)

    # C3: Aksesibilitas Lokasi
    c3_scores = df_jobs.apply(lambda row: calc_c3(row, sample_student), axis=1)

    # C4: Kesesuaian Jam Kerja: 1.0 - |work_hours - expected_hours| / 20
    diff_hours = np.abs(df_jobs["work_hours"] - sample_student["student_expected_work_hour"])
    c4_scores = np.round(np.clip(1.0 - (diff_hours / 20.0), 0.0, 1.0), 4)

    # C5: Kemiripan Keahlian (Cosine Similarity)
    c5_scores = df_jobs["C5_skill_similarity"]

    return pd.DataFrame({
        "job_id": df_jobs["job_id"],
        "job_title": df_jobs["job_title"],
        "company_name": df_jobs["company_name"],
        "job_category": df_jobs["job_category"],
        "work_job_location": df_jobs["work_job_location_clean"],
        "work_system": df_jobs["work_system"],
        "work_salaryperhour": df_jobs["work_salaryperhour"],
        "work_hours": df_jobs["work_hours"],
        "C1_kategori": c1_scores,
        "C2_rasio_gaji": c2_scores,
        "C3_lokasi": c3_scores,
        "C4_jam_kerja": c4_scores,
        "C5_kemiripan_skill": c5_scores,
    })


def build_clean_jobs_export(df_jobs):
    return df_jobs[[
        "job_id", "job_title", "company_name", "job_category", "work_salaryperhour",
        "work_job_location_clean", "work_hours", "work_system", "work_system_encoded",
        "work_required_skills", "clean_required_skills", "source_portal", "url", "date_posted",
    ] + (["company_logo"] if "company_logo" in df_jobs.columns else [])].rename(
        columns={"work_job_location_clean": "work_job_location"}
    )
