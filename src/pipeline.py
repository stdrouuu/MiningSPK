"""
CRISP-DM Fase 3: Data Preparation Pipeline
Proyek: SPK Rekomendasi Pekerjaan Part-Time Mahasiswa UKRIDA
Fokus: Persiapan data, pembersihan 6 lapisan, imputasi, standardisasi, NLP TF-IDF Cosine Similarity,
       dan konstruksi matriks keputusan M x N (Kriteria C1 - C5).
Catatan: Pipeline ini menghasilkan matriks keputusan (Fase 3). Pemodelan SMARTER
(Fase 4) diimplementasikan di web/src/lib/spk.ts, evaluasinya di scripts/eval_spk.py.

Cara jalan:
    python -m src.pipeline        # dari root proyek
    python src/pipeline.py        # alternatif langsung
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import argparse

import pandas as pd

from src.config import (
    CLEAN_JOBS_PATH,
    CLEAN_MOCK_STUDENTS_PATH,
    CLEAN_REAL_STUDENTS_PATH,
    DECISION_MATRIX_PATH,
    RAW_JOBS_PATH,
    RAW_MOCK_STUDENTS_PATH,
    RAW_REAL_STUDENTS_PATH,
    WEB_DATA_DIR,
    # Kompatibel layout lama:
    CLEAN_STUDENTS_PATH,
    RAW_STUDENTS_PATH,
)
from src.decision_matrix import build_clean_jobs_export, build_decision_matrix
from src.encoding import encode_work_system
from src.filtering import apply_6_layer_filtering, print_funnel_summary
from src.imputation import clean_student_missing_values, impute_job_missing_values
from src.skill_similarity import compute_skill_similarity
from src.standardization import standardize_and_cap


def run_phase_3_pipeline(source="mock"):
    """Jalankan pipeline. source='mock' (default, perilaku lama) atau 'real'."""
    if source not in ("mock", "real"):
        raise ValueError("source harus 'mock' atau 'real'")
    raw_students = RAW_REAL_STUDENTS_PATH if source == "real" else RAW_MOCK_STUDENTS_PATH
    clean_students = CLEAN_REAL_STUDENTS_PATH if source == "real" else CLEAN_MOCK_STUDENTS_PATH
    print("=" * 75)
    print("      CRISP-DM FASE 3: DATA PREPARATION PIPELINE EXECUTION")
    print("      Proyek SPK Lowongan Part-Time Mahasiswa UKRIDA")
    print(f"      Sumber mahasiswa: {source.upper()} ({raw_students.name})")
    print("=" * 75)

    # -------------------------------------------------------------
    # 1. DATA INGESTION
    # -------------------------------------------------------------
    print("\n[LANGKAH 1] Membaca Dataset Mentah (Data Ingestion)...")
    df_raw = pd.read_csv(RAW_JOBS_PATH)
    df_stud = pd.read_csv(raw_students)

    print(f"-> Total data mentah lowongan: {len(df_raw)} baris")
    print(f"-> Total data mentah kuesioner mahasiswa: {len(df_stud)} responden")

    # -------------------------------------------------------------
    # 2. FILTERING 6 LAPISAN
    # -------------------------------------------------------------
    print("\n[LANGKAH 2] Menjalankan 6 Lapisan Filtering Data Mentah...")
    curr_df, funnel_log = apply_6_layer_filtering(df_raw)
    print_funnel_summary(funnel_log)

    # -------------------------------------------------------------
    # 3. PENANGANAN MISSING VALUES (SECTION 3.1)
    # -------------------------------------------------------------
    print("\n[LANGKAH 3] Penanganan Missing Values...")
    curr_df = impute_job_missing_values(curr_df)
    df_stud_clean = clean_student_missing_values(df_stud)

    # -------------------------------------------------------------
    # 4. PENANGANAN OUTLIER & STANDARDISASI FORMAT (SECTION 3.2)
    # -------------------------------------------------------------
    print("\n[LANGKAH 4] Standardisasi Format & Batas Logis Outlier...")
    curr_df, df_stud_final = standardize_and_cap(curr_df, df_stud_clean)
    # Pertahankan company_logo hasil enrichment sebelumnya (scripts/enrich_company_logos.py):
    # pipeline tidak me-regenerasi logo, jadi bawa maju dari output processed terdahulu bila ada.
    if "company_logo" not in curr_df.columns and CLEAN_JOBS_PATH.exists():
        try:
            prev_logos = pd.read_csv(CLEAN_JOBS_PATH, usecols=["job_id", "company_logo"])
            prev_logos = prev_logos.drop_duplicates(subset=["job_id"])
            curr_df = curr_df.merge(prev_logos, on="job_id", how="left")
            print(f"-> company_logo dipertahankan dari '{CLEAN_JOBS_PATH}' ({prev_logos['company_logo'].notna().sum()} logo)")
        except Exception as exc:
            print(f"-> [WARN] Gagal mempertahankan company_logo: {exc}")

    # -------------------------------------------------------------
    # 5. CATEGORICAL ENCODING (SECTION 4.1)
    # -------------------------------------------------------------
    print("\n[LANGKAH 5] Melakukan Categorical Encoding Sistem Kerja (work_system)...")
    curr_df = encode_work_system(curr_df)

    # -------------------------------------------------------------
    # 6. TEXT MINING KEAHLIAN: NLP & COSINE SIMILARITY (SECTION 4.2)
    # -------------------------------------------------------------
    print("\n[LANGKAH 6] Text Mining Keahlian (NLP TF-IDF & Cosine Similarity)...")
    curr_df, sample_student = compute_skill_similarity(
        curr_df, df_stud_final, artifact_dir=DECISION_MATRIX_PATH.parent
    )

    # -------------------------------------------------------------
    # 7. KONSTRUKSI MATRIKS KEPUTUSAN M x N (FITUR C1 - C5)
    # -------------------------------------------------------------
    print("\n[LANGKAH 7] Membentuk Matriks Keputusan M x N untuk Kriteria SPK...")
    decision_matrix = build_decision_matrix(curr_df, sample_student)

    # -------------------------------------------------------------
    # 8. MENYIMPAN DATASET HASIL FASE 3
    # -------------------------------------------------------------
    print("\n[LANGKAH 8] Menyimpan Dataset Output Fase 3...")

    clean_jobs_export = build_clean_jobs_export(curr_df)
    clean_jobs_export.to_csv(CLEAN_JOBS_PATH, index=False)
    print(f"-> [OK] Berhasil menyimpan '{CLEAN_JOBS_PATH}' ({len(clean_jobs_export)} baris)")

    df_stud_final.to_csv(clean_students, index=False)
    print(f"-> [OK] Berhasil menyimpan '{clean_students}' ({len(df_stud_final)} baris)")

    # Matriks keputusan sampel (mahasiswa pertama) hanya ditulis untuk mock
    # agar artefak referensi Fase 3 tidak tertimpa saat run real.
    if source == "mock":
        decision_matrix.to_csv(DECISION_MATRIX_PATH, index=False)
        print(f"-> [OK] Berhasil menyimpan '{DECISION_MATRIX_PATH}' ({len(decision_matrix)} baris x {decision_matrix.shape[1]} kolom)")

    # Sinkron salinan frontend agar web/public/data selalu sama dengan data/processed/.
    # Nama file web tetap clean_students_dataset.csv (yang dibaca App.tsx),
    # apa pun sumbernya — sumber terakhir yang di-run menjadi isi /data.
    try:
        WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)
        clean_jobs_export.to_csv(WEB_DATA_DIR / CLEAN_JOBS_PATH.name, index=False)
        df_stud_final.to_csv(WEB_DATA_DIR / CLEAN_STUDENTS_PATH.name, index=False)
        if source == "mock":
            decision_matrix.to_csv(WEB_DATA_DIR / DECISION_MATRIX_PATH.name, index=False)
        print(f"-> [OK] Salinan web disinkron ke '{WEB_DATA_DIR}' (sumber: {source})")
    except Exception as exc:  # jangan gagalkan pipeline hanya karena sinkron web
        print(f"-> [WARN] Sinkron web dilewati: {exc}")

    print("\n" + "=" * 75)
    print(" FASE 3 (DATA PREPARATION) SELESAI DENGAN SUKSES!")
    print(" Data telah bersih, terstandardisasi, dan fitur kriteria C1 - C5 telah terbentuk.")
    print(" Matriks keputusan diteruskan ke Fase 4 (Modeling) di web/src/lib/spk.ts.")
    print("=" * 75)

    print("\nSampel 5 Baris Teratas Matriks Keputusan:")
    print(decision_matrix[["job_id", "job_title", "C1_kategori", "C2_rasio_gaji", "C3_lokasi", "C4_jam_kerja", "C5_kemiripan_skill"]].head())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CRISP-DM Fase 3 pipeline")
    parser.add_argument("--source", choices=["mock", "real"], default="mock",
                        help="Sumber data mahasiswa (default: mock)")
    args = parser.parse_args()
    run_phase_3_pipeline(source=args.source)
