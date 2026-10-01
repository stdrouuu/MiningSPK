"""Salin data/processed/ ke web/public/data/ agar frontend selalu memakai data terbaru.

Jalankan dari root:  python scripts/sync_web_data.py
(Catatan: src/pipeline.py juga otomatis menyinkron setiap kali pipeline dijalankan.)
"""

import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "data" / "processed"
DST_DIR = PROJECT_ROOT / "web" / "public" / "data"

FILES = [
    "clean_jobs_dataset.csv",
    "clean_students_dataset.csv",
    "decision_matrix_sample.csv",
]


def main():
    DST_DIR.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        src = SRC_DIR / name
        if not src.exists():
            print(f"[SKIP] {src} tidak ditemukan")
            continue
        shutil.copy2(src, DST_DIR / name)
        print(f"[OK] {name} -> {DST_DIR / name}")


if __name__ == "__main__":
    main()
