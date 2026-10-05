"""
Script Pemroses Respon Google Form Mahasiswa (CRISP-DM Fase 3)
Proyek SPK Rekomendasi Lowongan Part-Time Mahasiswa UKRIDA (Metode SMARTER)

Fungsi:
1. Membaca file CSV hasil export jawaban dari Google Form.
2. Memfilter responden berdasarkan Informed Consent ("Ya, saya bersedia...").
3. Mengonversi pertanyaan multi-opsi (hari, jam, gaji bulanan) menjadi:
   - student_expected_work_hour (jam/minggu)
   - min_expected_salary (upah per jam minimum)
4. Menerapkan Data Quality: Salary Capping (Rp 15.000 - Rp 75.000/jam).
5. Membersihkan kategori, sistem kerja, domisili, dan teks keahlian (skills).
6. Menghasilkan format standar yang persis sama dengan:
   data/raw/raw_student_preferences.csv
"""

import sys
import re
import argparse
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RAW_OUTPUT = PROJECT_ROOT / "data" / "raw" / "raw_student_preferences.csv"
DEFAULT_INPUT_CSV = PROJECT_ROOT / "data" / "raw" / "google_form_responses.csv"

# 10 Kategori Resmi Proyek
CATEGORIES_10 = [
    "Education & Tutoring",
    "Food & Beverage (F&B)",
    "Retail & Store Operations",
    "Marketing & Sales",
    "Content & Media",
    "Design & Creative",
    "Admin & Office Support",
    "Customer Service & Support",
    "Logistics & Delivery",
    "IT & Software"
]

def parse_category(text):
    if pd.isna(text):
        return "Admin & Office Support"
    t = str(text).strip()
    for cat in CATEGORIES_10:
        clean_cat_key = cat.replace(" (F&B)", "").lower()
        if clean_cat_key in t.lower() or cat.lower() in t.lower():
            return cat
    return "Admin & Office Support"

def parse_work_system(text):
    if pd.isna(text):
        return "Onsite"
    t = str(text).strip().lower()
    if "remote" in t:
        return "Remote"
    elif "hybrid" in t:
        return "Hybrid"
    return "Onsite"

def parse_location(text):
    if pd.isna(text):
        return "Jakarta Barat"
    t = str(text).strip().lower()
    if "jakarta barat" in t or "grogol" in t or "kebon jeruk" in t:
        return "Jakarta Barat"
    elif "jakarta pusat" in t:
        return "Jakarta Pusat"
    elif "jakarta selatan" in t:
        return "Jakarta Selatan"
    elif "jakarta timur" in t:
        return "Jakarta Timur"
    elif "jakarta utara" in t:
        return "Jakarta Utara"
    elif "tangerang" in t or "bsd" in t or "serpong" in t:
        return "Tangerang"
    elif "depok" in t:
        return "Depok"
    elif "bogor" in t:
        return "Bogor"
    elif "bekasi" in t:
        return "Bekasi"
    return "Jakarta Barat"

def parse_days_per_week(text):
    if pd.isna(text):
        return 3
    t = str(text).strip()
    if "1" in t: return 1
    elif "2" in t: return 2
    elif "3" in t: return 3
    elif "4" in t: return 4
    elif "5" in t: return 5
    return 3

def parse_hours_per_day(text):
    if pd.isna(text):
        return 4.5
    t = str(text).strip()
    if "2" in t and "3" in t:
        return 2.5
    elif ("4" in t and "6" in t) or ("4" in t and "5" in t):
        return 5.0  # nilai tengah 4 - 6 jam
    elif ("7" in t and "8" in t) or ("6" in t and "7" in t):
        return 7.5  # nilai tengah 7 - 8 jam
    return 4.5

def parse_monthly_salary(text):
    if pd.isna(text):
        return 1750000.0
    t = str(text).strip()
    if "500.000" in t and "1.000.000" in t:
        return 750000.0
    elif "1.000.000" in t and "1.500.000" in t:
        return 1250000.0
    elif "1.500.000" in t and "2.000.000" in t:
        return 1750000.0
    elif "2.000.000" in t and "2.500.000" in t:
        return 2250000.0
    elif "2.500.000" in t:
        return 2750000.0
    return 1750000.0

def clean_skills_text(text):
    if pd.isna(text):
        return "komunikasi, kerja tim, teliti"
    t = str(text).strip()
    t = re.sub(r'[\r\n]+', ', ', t)
    t = re.sub(r'\s+', ' ', t)
    return t

def process_responses(input_csv_path, output_csv_path=DEFAULT_RAW_OUTPUT):
    input_file = Path(input_csv_path)
    if not input_file.exists():
        print(f"[ERROR] File tidak ditemukan: {input_file}")
        print(f"Petunjuk: Simpan file download dari Google Form sebagai '{input_file}'")
        print("Atau jalankan: python scripts/process_google_form_responses.py <path_ke_file_download.csv>")
        return False

    df = pd.read_csv(input_file)
    print(f"[INFO] Berhasil membaca: {input_file} ({len(df)} total baris respons)")

    # Deteksi kolom secara presisi berdasarkan prefix nomor soal (Q1..Q8) atau kata kunci spesifik
    cols = df.columns
    col_map = {}

    for c in cols:
        cl = c.lower().strip()
        if "q1" in cl or ("nim" in cl and "mahasiswa" in cl) or cl == "nim":
            col_map['nim'] = c
        elif "q2" in cl or ("nama" in cl and "lengkap" in cl) or cl == "nama":
            col_map['name'] = c
        elif "q3" in cl or "tinggal" in cl or "domisili" in cl or "area" in cl:
            col_map['location'] = c
        elif "q4" in cl or "bidang" in cl or "minati" in cl:
            col_map['category'] = c
        elif "q5" in cl or "sistem kerja" in cl:
            col_map['system'] = c
        elif "q6a" in cl or "berapa hari" in cl or "seminggu" in cl:
            col_map['days'] = c
        elif "q6b" in cl or "berapa jam" in cl or "bertugas" in cl:
            col_map['hours_per_day'] = c
        elif "q7" in cl or "upah" in cl or "gaji" in cl or "saku" in cl:
            col_map['salary'] = c
        elif "q8" in cl or "keahlian" in cl or "skill" in cl:
            col_map['skills'] = c
        elif "persetujuan" in cl or "consent" in cl:
            col_map['consent'] = c
        elif "timestamp" in cl or "tanda waktu" in cl or cl == "waktu":
            col_map['timestamp'] = c

    print("\n[INFO] Pemetaan Kolom Terdeteksi:")
    for k, v in col_map.items():
        print(f"  * {k:15}: {v}")

    # 1. Filter Informed Consent (Hanya responden yang menyatakan "Ya / Setuju")
    if 'consent' in col_map:
        initial_len = len(df)
        c_series = df[col_map['consent']].astype(str).str.strip().str.lower()
        valid_consent = c_series.str.startswith("ya") | (c_series.str.contains("setuju") & ~c_series.str.contains("tidak|belum"))
        df = df[valid_consent].copy()
        dropped_consent = initial_len - len(df)
        if dropped_consent > 0:
            print(f"[WARNING] {dropped_consent} baris disaring keluar (responden memilih tidak bersedia).")

    # 2. Filter Duplikat NIM (ambil respon terakhir per NIM)
    if 'nim' in col_map:
        initial_len = len(df)
        df = df.drop_duplicates(subset=[col_map['nim']], keep='last').copy()
        dropped_dups = initial_len - len(df)
        if dropped_dups > 0:
            print(f"[CLEANING] {dropped_dups} duplikasi NIM dibersihkan (mempertahankan respon terbaru).")

    # 3. Ekstraksi Fitur
    rows = []
    student_counter = 101

    for idx, r in df.iterrows():
        s_id = f"MHS-{student_counter}"
        student_counter += 1

        s_nim = str(r[col_map['nim']]).strip() if 'nim' in col_map else str(412024000 + student_counter)
        s_name = str(r[col_map['name']]).strip() if 'name' in col_map else f"Mahasiswa {student_counter}"
        
        cat = parse_category(r[col_map['category']]) if 'category' in col_map else "Admin & Office Support"
        sys_w = parse_work_system(r[col_map['system']]) if 'system' in col_map else "Onsite"
        loc = parse_location(r[col_map['location']]) if 'location' in col_map else "Jakarta Barat"
        
        days = parse_days_per_week(r[col_map['days']]) if 'days' in col_map else 3
        h_per_day = parse_hours_per_day(r[col_map['hours_per_day']]) if 'hours_per_day' in col_map else 4.5
        exp_hours = round(days * h_per_day, 1)

        monthly_sal = parse_monthly_salary(r[col_map['salary']]) if 'salary' in col_map else 1750000.0
        # Gaji per jam = gaji bulanan / (total jam kerja sebulan)
        calc_sal_per_hour = round(monthly_sal / (exp_hours * 4), 2)

        # 4. Salary Capping (Data Quality CRISP-DM)
        SALARY_FLOOR = 15000.0
        SALARY_CEILING = 75000.0
        sal_per_hour = float(np.clip(calc_sal_per_hour, SALARY_FLOOR, SALARY_CEILING))

        skills = clean_skills_text(r[col_map['skills']]) if 'skills' in col_map else "komunikasi, kerja tim"
        tstamp = str(r[col_map['timestamp']]) if 'timestamp' in col_map else datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        rows.append({
            "student_id": s_id,
            "student_nim": s_nim,
            "student_name": s_name,
            "student_job_category": cat,
            "preferred_category": cat,
            "min_expected_salary": sal_per_hour,
            "student_location": loc,
            "student_expected_work_hour": exp_hours,
            "preferred_work_system": sys_w,
            "student_skills": skills,
            "timestamp": tstamp
        })

    out_df = pd.DataFrame(rows)
    output_path = Path(output_csv_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    out_df.to_csv(output_path, index=False)

    print("\n" + "=" * 75)
    print(f"[OK] SUKSES! Data berhasil diproses dan disimpan ke:")
    print(f"-> {output_path.resolve()}")
    print(f"Total mahasiswa valid: {len(out_df)} orang.")
    print("=" * 75)
    print("\nContoh 3 baris data hasil pemrosesan:")
    print(out_df[['student_id', 'student_name', 'student_job_category', 'min_expected_salary', 'student_expected_work_hour']].head(3))
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_csv = sys.argv[1]
    else:
        input_csv = str(DEFAULT_INPUT_CSV)
    
    output_csv = sys.argv[2] if len(sys.argv) > 2 else str(DEFAULT_RAW_OUTPUT)
    process_responses(input_csv, output_csv)
