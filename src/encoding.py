"""Categorical encoding sistem kerja (Section 4.1): Remote=1, Hybrid=2, Onsite=3."""

from src.config import SYSTEM_MAPPING


def encode_work_system(df_jobs):
    df_jobs["work_system_encoded"] = df_jobs["work_system"].map(SYSTEM_MAPPING).fillna(3).astype(int)
    print(f"Distribusi Encoding Sistem Kerja: \n{df_jobs['work_system_encoded'].value_counts().to_dict()}")
    return df_jobs
