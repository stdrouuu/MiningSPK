"""Konversi Survei_GformResponses_1.csv -> raw_real_student_preferences.csv (format raw pipeline).

Logika disamakan dengan web/src/components/kuesioner/KuesionerPage.tsx:
- Q6a x Q6b -> jam/minggu = min(30, max(8, round(days * hoursPerDay)))
- Q7 bulanan -> per jam = round(monthly / (jam*4) / 1000)*1000, clip 15rb-60rb
Jalankan dari root:  python scripts/convert_gform_to_raw.py
"""
import csv
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data" / "raw" / "Survei_GformResponses_1.csv"
DST = ROOT / "data" / "raw" / "raw_real_student_preferences.csv"

Q7_MAP = [
    ("di atas", 2750000),
    ("2.000.000", 2250000),  # Rp 2jt-2,5jt
    ("1.500.000", 1750000),
    ("1.000.000", 1250000),  # cek setelah 1.5jt agar tidak salah match; lihat catatan di bawah
    ("500.000", 750000),
]

def monthly_from_q7(s: str) -> int:
    t = s.lower()
    if "di atas" in t:
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
    return int(m.group(1))  # 5 hari atau lebih -> 5

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
    # selain itu ambil teks sebelum " (" sesuai value Q4_OPTIONS frontend
    return t.split(" (")[0].strip()

def canonical_location(q3: str) -> str:
    t = q3.strip()
    if "Jakarta Barat" in t:
        return "Jakarta Barat"
    if "Jakarta Pusat" in t:
        return "Jakarta Pusat"
    if "Jakarta Selatan" in t:
        return "Jakarta Selatan"
    if "Jakarta Timur" in t:
        return "Jakarta Timur"
    if "Jakarta Utara" in t:
        return "Jakarta Utara"
    if "Tangerang" in t:
        return "Tangerang Selatan"  # sesuai Q3_OPTIONS frontend
    if "Depok" in t or "Bogor" in t:
        return "Depok"
    if "Bekasi" in t:
        return "Bekasi"
    return t

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

def main():
    with open(SRC, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    out = []
    for i, r in enumerate(rows, start=1):
        sid = f"MHS-R{i:03d}"
        nim = (r["Q1. Nomor Induk Mahasiswa (NIM)"] or "").strip()
        if nim == "-":
            nim = ""
        name = (r["Q2. Nama Lengkap"] or "").strip()
        cat = canonical_category(r["Q4. Bidang pekerjaan part-time apa yang paling Anda minati?"])
        loc = (r["Q3. Di area mana Anda tinggal saat ini?"] or "").strip()
        sys = canonical_system(r["Q5. Sistem kerja part-time seperti apa yang Anda harapkan?"])
        days = days_from_q6a(r["Q6a. Dalam seminggu, berapa hari waktu kerja part-time yang Anda harapkan?"])
        hpd = hours_per_day_from_q6b(r["Q6b. Berapa jam waktu yang diharapkan untuk bekerja part-time?"])
        jam = min(30, max(8, round(days * hpd)))
        salary = per_jam(monthly_from_q7(r["Q7. Berapa banyak upah / gaji yang Anda harapkan per bulan?"]), jam)
        skills = (r["Q8. Tuliskan skills apa saja yang Anda miliki saat ini:"] or "").strip()
        if skills.strip() == "-":
            skills = ""
        try:
            ts = datetime.strptime(r["Timestamp"].strip(), "%m/%d/%Y %H:%M:%S").strftime("%Y-%m-%d %H:%M:%S")
        except ValueError:
            ts = r["Timestamp"].strip()
        out.append({
            "student_id": sid,
            "student_nim": nim,
            "student_name": name,
            "student_job_category": cat,
            "preferred_category": cat,
            "min_expected_salary": salary,
            "student_location": loc,
            "student_expected_work_hour": jam,
            "preferred_work_system": sys,
            "student_skills": skills,
            "timestamp": ts,
        })
    with open(DST, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["student_id","student_nim","student_name","student_job_category","preferred_category","min_expected_salary","student_location","student_expected_work_hour","preferred_work_system","student_skills","timestamp"])
        w.writeheader()
        w.writerows(out)
    print(f"[OK] {len(out)} baris -> {DST}")
    # ringkasan konversi untuk verifikasi
    for row in out[:3]:
        print(row)

if __name__ == "__main__":
    main()
