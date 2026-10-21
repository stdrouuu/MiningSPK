"""Hapus company_logo yang blank (putih/transparan penuh) dari dataset clean.

Logo yang HTTP-nya OK tapi isinya blank tidak memicu onError di browser,
sehingga fallback icon tidak pernah tampil. Script ini mendownload tiap logo
unik, memeriksa pikselnya dengan Pillow, dan mengosongkan company_logo bila
logo tersebut praktis tidak terlihat.

Jalankan dari root:
    python scripts/scrub_blank_logos.py
    python scripts/sync_web_data.py   # agar web/public/data ikut terbarui
"""

import io
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import pandas as pd
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from src.config import CLEAN_JOBS_PATH, WEB_DATA_DIR  # noqa: E402

JOB_COLUMN = "company_logo"
TIMEOUT = 15

UA_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36"
}


def is_blank_image(data: bytes) -> bool:
    """True bila gambar kosong: semua piksel transparan atau mendekati putih."""
    try:
        im = Image.open(io.BytesIO(data)).convert("RGBA")
    except Exception:
        return True
    # Downsample biar cepat; blank tetap terdeteksi walau dikecilkan.
    im.thumbnail((64, 64))
    for r, g, b, a in im.get_flattened_data() if hasattr(im, "get_flattened_data") else im.getdata():
        if a <= 10:
            continue
        if r > 240 and g > 240 and b > 240:
            continue
        return False
    return True


def check_url(url: str) -> bool:
    """Return True bila logo blank/unreachable (sebaiknya dikosongkan)."""
    try:
        req = urllib.request.Request(url, headers=UA_HEADERS)
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            data = resp.read(6 * 1024 * 1024)
        return is_blank_image(data)
    except Exception:
        return False


def main() -> None:
    df = pd.read_csv(CLEAN_JOBS_PATH)
    urls = [u for u in df[JOB_COLUMN].dropna().unique().tolist() if u.strip()]
    print(f"{len(urls)} logo unik diperiksa...")

    blank = set()
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = {pool.submit(check_url, u): u for u in urls}
        for i, fut in enumerate(as_completed(futures), 1):
            url = futures[fut]
            if fut.result():
                blank.add(url)
            if i % 50 == 0:
                print(f"  {i}/{len(urls)} selesai")

    print(f"{len(blank)} logo blank/unreachable ditemukan")
    mask = df[JOB_COLUMN].isin(blank)
    print("Baris terdampak:", int(mask.sum()))
    df.loc[mask, JOB_COLUMN] = pd.NA
    df.to_csv(CLEAN_JOBS_PATH, index=False)
    print(f"[OK] {CLEAN_JOBS_PATH} diperbarui")

    dst = WEB_DATA_DIR / "clean_jobs_dataset.csv"
    if dst.exists():
        df.to_csv(dst, index=False)
        print(f"[OK] {dst} diperbarui")


if __name__ == "__main__":
    main()
