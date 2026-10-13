"""Salin data/processed/ ke web/public/data/ agar frontend selalu memakai data terbaru.

Jalankan dari root:
    python scripts/sync_web_data.py            # default: mahasiswa mock
    python scripts/sync_web_data.py --source real   # isi /data dengan responden GForm
(Catatan: src/pipeline.py juga otomatis menyinkron setiap kali pipeline dijalankan.)
"""

import argparse
import shutil
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from src.config import (  # noqa: E402
    CLEAN_JOBS_PATH,
    CLEAN_MOCK_STUDENTS_PATH,
    CLEAN_REAL_STUDENTS_PATH,
    DECISION_MATRIX_PATH,
    WEB_DATA_DIR,
)


def main(source="mock"):
    students_src = CLEAN_REAL_STUDENTS_PATH if source == "real" else CLEAN_MOCK_STUDENTS_PATH
    pairs = [
        (CLEAN_JOBS_PATH, WEB_DATA_DIR / "clean_jobs_dataset.csv"),
        (students_src, WEB_DATA_DIR / "clean_students_dataset.csv"),
        (DECISION_MATRIX_PATH, WEB_DATA_DIR / "decision_matrix_sample.csv"),
    ]
    WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)
    for src, dst in pairs:
        if not src.exists():
            print(f"[SKIP] {src} tidak ditemukan")
            continue
        shutil.copy2(src, dst)
        print(f"[OK] {src.name} ({source}) -> {dst}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", choices=["mock", "real"], default="mock")
    args = parser.parse_args()
    main(source=args.source)
