"""Standardisasi lokasi + capping outlier + privasi (Section 3.2)."""

from src.config import MAX_STUDENT_HOURS, SALARY_CLIP_LOWER, SALARY_CLIP_UPPER
from src.locations import standardize_location


def standardize_and_cap(df_jobs, df_students_clean):
    """Standardisasi lokasi, buang Non-Jabodetabek sisa, capping gaji/jam, hapus kolom privasi."""
    df_jobs["work_job_location_clean"] = df_jobs.apply(
        lambda r: standardize_location(r["work_job_location"], r["work_system"]), axis=1
    )
    df_students_clean["student_location_clean"] = df_students_clean["student_location"].apply(standardize_location)

    # Filter ketat: pastikan tidak ada "Non-Jabodetabek" tersisa
    df_jobs = df_jobs[df_jobs["work_job_location_clean"] != "Non-Jabodetabek"]

    # Capping jam kerja & gaji
    df_jobs["work_hours"] = df_jobs["work_hours"].clip(upper=MAX_STUDENT_HOURS)
    df_jobs["work_salaryperhour"] = df_jobs["work_salaryperhour"].clip(
        lower=SALARY_CLIP_LOWER, upper=SALARY_CLIP_UPPER
    )

    # Hapus atribut non-esensial mahasiswa untuk privasi
    df_students_final = df_students_clean.drop(columns=["student_nim", "timestamp"], errors="ignore")
    return df_jobs, df_students_final
