"""Konversi export Google Form -> rawкування mahasiswa format pipeline (skrip tunggal).

Menggantikan scripts/convert_gform_to_raw.py + scripts/process_google_form_responses.py
yang logikanya berbeda (clip gaji, floor jam, mapping lokasi). Aturan final:
- Jam/minggu = min(30, max(8, round(hari x jam/hari))) — sama dgn KuesionerPage.jamIdealPerMinggu
- Gaji/jam = round(bulanan / (jam x 4) / 1000) x 1000, clip 15rb-60rb — sama dgn KuesionerPage.perJam
- Lokasi = teks asli GForm (pipeline yg menstandarkan via src.locations)
- Filter consent (bila kolomnya ada) + dedup NIM non-kosong (ambil terakhir)

Jalankan dari root:
    python scripts/process_gform.py
    python scripts/process_gform.py <input.csv> <output.csv>
"""

import csv
import re
import sys
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = PROJECT_ROOT / "data" / "raw" / "raw-real-students" / "Survei_GformResponses_1.csv"
DEFAULT_OUTPUT = PROJECT_ROOT / "data" / "raw" / "raw-real-students" / "raw_real_student_preferences.csv"

HEADER = ["student_id", "student_nim", "student_name", "student_job_category",
          "preferred_category", "min_expected_salary", "student_location",
          "student_expected_work_hour", "preferred_work_system", "student_skills",
          "timestamp"]


def monthly_from_q7(s: str) -> int:
    if "di atas" in s.lower():
        return 2750000
    if "2.000.000" in s and "2.500.000" in s:
        return 2250000
    if "1.500.000" in s and "2.000.000" in s:
        return 1750000
    if "1.000.000" in s and "1.500.000" in s:
        return 1250000
    if "500.000" in s:
        return 750000
    raise ValueError(f"Q7 tak dikenal: {s!r}")


def days_from_q6a(s: str) -> int:
    m = re.match(r"\s*(\d)", s.strip())
    if not m:
        raise ValueError(f"Q6a tak dikenal: {s!r}")
    return int(m.group(1))  # "5 hari atau lebih" -> 5


def hours_per_day_from_q6b(s: str) -> float:
    if "7" in s and "8" in s:
        return 7.5
    if "4" in s and "6" in s:
        return 5.0
    if "2" in s and "3" in s:
        return 2.5
    raise ValueError(f"Q6b tak dikenal: {s!r}")


def canonical_category(q4: str) -> str:
    t = q4.strip()
    if t.startswith("Food & Beverage / F&B"):
        return "Food & Beverage (F&B)"
    return t.split(" (")[0].strip()


def canonical_system(q5: str) -> str:
    if "Hybrid" in q5:
        return "Hybrid"
    if "Onsite" in q5:
        return "Onsite"
    if "Remote" in q5:
        return "Remote"
    return q5.strip()


def per_jam(monthly: int, jam_ideal: int) -> int:
    v = round(monthly / (jam_ideal * 4) / 1000) * 1000
    return min(60000, max(15000, v))


def find_col(cols, *keywords):
    for c in cols:
        cl = c.lower()
        if all(k in cl for k in keywords):
            return c
    return None


def main(input_path=DEFAULT_INPUT, output_path=DEFAULT_OUTPUT):
    input_path, output_path = Path(input_path), Path(output_path)
    if not input_path.exists():
        print(f"[ERROR] File tidak ditemukan: {input_path}")
        return False

    with open(input_path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    print(f"[INFO] {len(rows)} baris respons dari {input_path.name}")
    if not rows:
        return False
    cols = list(rows[0].keys())

    c_consent = find_col(cols, "persetujuan") or find_col(cols, "consent") or find_col(cols, "bersedia")
    c_nim = find_col(cols, "q1") or find_col(cols, "nim")
    c_name = find_col(cols, "q2") or find_col(cols, "nama")
    c_loc = find_col(cols, "q3") or find_col(cols, "tinggal")
    c_cat = find_col(cols, "q4") or find_col(cols, "minati")
    c_sys = find_col(cols, "q5") or find_col(cols, "sistem kerja")
    c_days = find_col(cols, "q6a") or find_col(cols, "berapa hari")
    c_hpd = find_col(cols, "q6b") or find_col(cols, "berapa jam")
    c_sal = find_col(cols, "q7") or find_col(cols, "gaji") or find_col(cols, "upah")
    c_skill = find_col(cols, "q8") or find_col(cols, "skill")
    c_ts = find_col(cols, "timestamp") or "Timestamp"

    # 1. Filter consent (hanya bila kolomnya ada di form)
    if c_consent:
        before = len(rows)
        rows = [r for r in rows
                if (r[c_consent] or "").strip().lower().startswith("ya")
                or ("setuju" in (r[c_consent] or "").lower()
                    and "tidak" not in (r[c_consent] or "").lower())]
        if len(rows) < before:
            print(f"[CLEANING] {before - len(rows)} baris dibuang (tidak bersedia).")

    # 2. Dedup NIM non-kosong, ambil respon terakhir
    if c_nim:
        seen, deduped = set(), []
        for r in reversed(rows):
            nim = (r[c_nim] or "").strip()
            if nim and nim != "-" and nim in seen:
                continue
            seen.add(nim)
            deduped.append(r)
        rows = list(reversed(deduped))

    # 3. Konversi
    out = []
    for i, r in enumerate(rows, start=1):
        nim = (r[c_nim] or "").strip() if c_nim else ""
        if nim == "-":
            nim = ""
        name = (r[c_name] or "").strip() if c_name else ""
        cat = canonical_category(r[c_cat]) if c_cat else "Admin & Office Support"
        loc = (r[c_loc] or "").strip() if c_loc else ""
        sys_w = canonical_system(r[c_sys]) if c_sys else "Onsite"
        days = days_from_q6a(r[c_days]) if c_days else 3
        hpd = hours_per_day_from_q6b(r[c_hpd]) if c_hpd else 5.0
        jam = min(30, max(8, round(days * hpd)))
        salary = per_jam(monthly_from_q7(r[c_sal]) if c_sal else 1750000, jam)
        skills = (r[c_skill] or "").strip() if c_skill else ""
        if skills == "-":
            skills = ""
        raw_ts = (r[c_ts] or "").strip() if c_ts and c_ts in r else ""
        try:
            ts = datetime.strptime(raw_ts, "%m/%d/%Y %H:%M:%S").strftime("%Y-%m-%d %H:%M:%S")
        except ValueError:
            ts = raw_ts
        out.append({"student_id": f"MHS-R{i:03d}", "student_nim": nim,
                    "student_name": name, "student_job_category": cat,
                    "preferred_category": cat, "min_expected_salary": salary,
                    "student_location": loc, "student_expected_work_hour": jam,
                    "preferred_work_system": sys_w, "student_skills": skills,
                    "timestamp": ts})

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=HEADER)
        w.writeheader()
        w.writerows(out)
    print(f"[OK] {len(out)} baris -> {output_path}")
    return True


if __name__ == "__main__":
    ok = main(*sys.argv[1:3]) if len(sys.argv) > 1 else main()
    sys.exit(0 if ok else 1)
