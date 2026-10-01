"""Penanganan missing values lowongan + mahasiswa (Section 3.1)."""

from src.config import DEFAULT_SKILLS_TEXT, DEFAULT_WORK_SYSTEM

MISSING_VALUE_COLUMNS = ["work_salaryperhour", "work_hours", "work_system", "work_required_skills"]


def impute_job_missing_values(df):
    """Imputasi lowongan: median/kategori (gaji & jam), modus (sistem), default (skills)."""
    print("Jumlah Missing Values SEBELUM Imputasi:")
    print(df[MISSING_VALUE_COLUMNS].isna().sum())

    # 3.1 Imputasi Median per Kategori untuk Gaji
    salary_medians = df.groupby("job_category")["work_salaryperhour"].transform("median")
    df["work_salaryperhour"] = df["work_salaryperhour"].fillna(salary_medians)
    df["work_salaryperhour"] = df["work_salaryperhour"].fillna(df["work_salaryperhour"].median())

    # 3.2 Imputasi Median per Kategori untuk Jam Kerja
    hours_medians = df.groupby("job_category")["work_hours"].transform("median")
    df["work_hours"] = df["work_hours"].fillna(hours_medians)
    df["work_hours"] = df["work_hours"].fillna(df["work_hours"].median())

    # 3.3 Imputasi Modus untuk work_system
    df["work_system"] = df["work_system"].fillna(DEFAULT_WORK_SYSTEM)

    # 3.4 Imputasi Default Value untuk work_required_skills
    df["work_required_skills"] = df["work_required_skills"].fillna(DEFAULT_SKILLS_TEXT)

    print("\nJumlah Missing Values SETELAH Imputasi:")
    print(df[MISSING_VALUE_COLUMNS].isna().sum())
    return df


def clean_student_missing_values(df_stud):
    """Listwise deletion untuk kuesioner mahasiswa (wajib lengkap)."""
    print(f"\nData Mahasiswa Awal: {len(df_stud)} responden")
    df_stud_clean = df_stud.dropna(
        subset=["student_skills", "min_expected_salary", "student_expected_work_hour"]
    ).copy()
    dropped = len(df_stud) - len(df_stud_clean)
    print(f"Data Mahasiswa Bersih (setelah Deletion baris tidak lengkap): {len(df_stud_clean)} responden (Dihapus: {dropped})")
    return df_stud_clean
