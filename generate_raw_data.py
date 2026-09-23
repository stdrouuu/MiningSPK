"""
Script Generator Dataset Mentah (Raw Data) CRISP-DM Fase 3
Proyek SPK Rekomendasi Lowongan Part-Time Mahasiswa UKRIDA (Metode SMARTER)
Menghasilkan:
1. raw_job_postings.csv (530 sampel lowongan kerja dengan berbagai anomali nyata)
2. raw_student_preferences.csv (55 sampel kuesioner preferensi mahasiswa UKRIDA)
"""

import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Seed untuk reprodusibilitas data
random.seed(42)
np.random.seed(42)

# ==========================================
# 1. GENERASI DATASET MENTAH LOWONGAN KERJA
# ==========================================

job_templates = [
    # IT & Software
    {"title": "Junior Python Developer Part-Time", "category": "IT & Software", 
     "skills": "python, django, sql, git, rest api, problem solving", "salary": 45000, "hours": 20, "system": "Remote"},
    {"title": "Frontend Web Developer (Part-Time)", "category": "IT & Software", 
     "skills": "html, css, javascript, react, responsive web, git", "salary": 40000, "hours": 18, "system": "Hybrid"},
    {"title": "WordPress & Website Administrator", "category": "IT & Software", 
     "skills": "wordpress, php dasar, cpanel, seo dasar, maintenance web", "salary": 35000, "hours": 15, "system": "Remote"},
    {"title": "Data Entry & Web Scraper Assistant", "category": "IT & Software", 
     "skills": "python, excel, web scraping, data cleaning, pandas", "salary": 35000, "hours": 16, "system": "Remote"},
    {"title": "IT Support & Lab Assistant Weekend", "category": "IT & Software", 
     "skills": "hardware troubleshooting, networking dasar, windows os, komunikasi", "salary": 30000, "hours": 14, "system": "Onsite"},
    {"title": "Junior Mobile App Tester (QA Part-Time)", "category": "IT & Software", 
     "skills": "manual testing, bug reporting, jira, mobile apps, teliti", "salary": 38000, "hours": 16, "system": "Remote"},
    
    # Design & Creative
    {"title": "Graphic Designer Social Media Part-Time", "category": "Design & Creative", 
     "skills": "canva, adobe photoshop, illustrator, creative thinking, typography", "salary": 35000, "hours": 18, "system": "Remote"},
    {"title": "Video Editor Reels & TikTok (Part-Time)", "category": "Design & Creative", 
     "skills": "capcut, premiere pro, video editing, storytelling, audio sync", "salary": 40000, "hours": 15, "system": "Remote"},
    {"title": "UI/UX Designer Freelance / Paruh Waktu", "category": "Design & Creative", 
     "skills": "figma, wireframing, prototyping, user research, design system", "salary": 45000, "hours": 16, "system": "Remote"},
    {"title": "Junior 3D Modeler & Asset Creator", "category": "Design & Creative", 
     "skills": "blender, 3d modeling, texturing, rendering, kreatif", "salary": 42000, "hours": 15, "system": "Hybrid"},

    # Content & Communication
    {"title": "Social Media Admin Part-Time", "category": "Content & Communication", 
     "skills": "instagram, copywriting, customer service, fast response, canva dasar", "salary": 28000, "hours": 20, "system": "Remote"},
    {"title": "Content Writer & SEO Copywriter", "category": "Content & Communication", 
     "skills": "content writing, artikel blog, riset kata kunci, seo, bahasa indonesia baik", "salary": 32000, "hours": 15, "system": "Remote"},
    {"title": "Live Streaming Host (TikTok & Shopee)", "category": "Content & Communication", 
     "skills": "public speaking, komunikasi persuasif, percaya diri, live streaming, penjualan", "salary": 35000, "hours": 16, "system": "Onsite"},
    {"title": "Community Moderator & Chat Support", "category": "Content & Communication", 
     "skills": "discord, telegram, komunikasi ramah, penanganan keluhan, multitasking", "salary": 27000, "hours": 18, "system": "Remote"},

    # Education & Tutoring
    {"title": "Tutor Les Privat Matematika SD & SMP", "category": "Education & Tutoring", 
     "skills": "matematika dasar, sabar, komunikasi edukatif, membuat modul belajar", "salary": 50000, "hours": 10, "system": "Onsite"},
    {"title": "Pengajar Coding Anak (Scratch & Python Dasar)", "category": "Education & Tutoring", 
     "skills": "scratch, python dasar, logika pemrograman, public speaking, sabar", "salary": 60000, "hours": 12, "system": "Hybrid"},
    {"title": "Tutor Bahasa Inggris Percakapan (Part-Time)", "category": "Education & Tutoring", 
     "skills": "fluent english, toefl prep, speaking, presentation skill, ramah", "salary": 55000, "hours": 10, "system": "Remote"},
    {"title": "Asisten Pengajar Komputer Kantor", "category": "Education & Tutoring", 
     "skills": "microsoft word, excel dasar, powerpoint, bimbingan praktikum, teliti", "salary": 35000, "hours": 12, "system": "Onsite"},

    # Admin & Operational
    {"title": "Admin Toko Online & Marketplace Part-Time", "category": "Admin & Operational", 
     "skills": "tokopedia, shopee seller center, rekap data, excel, komunikasi pelanggan", "salary": 28000, "hours": 22, "system": "Hybrid"},
    {"title": "Data Entry Clerk Paruh Waktu", "category": "Admin & Operational", 
     "skills": "microsoft excel, spreadsheet, pengetikan 10 jari, ketelitian tinggi", "salary": 26000, "hours": 18, "system": "Remote"},
    {"title": "Barista Weekend Part-Time Coffee Shop", "category": "Admin & Operational", 
     "skills": "hospitality, espresso machine, pelayanan ramah, kasir pos, kebersihan", "salary": 25000, "hours": 16, "system": "Onsite"},
    {"title": "Event Crew & Registration Assistant", "category": "Admin & Operational", 
     "skills": "kerjasama tim, komunikasi aktif, fleksibilitas waktu, cekatan, problem solving", "salary": 30000, "hours": 14, "system": "Onsite"}
]

companies = [
    "PT Solusi Digital Nusantara", "TechKreasi Indonesia", "EduSmart Private Academy",
    "Kopi Senja Utama", "Media Kreasi Studio", "Bintang E-Commerce Pratama",
    "Lentera Edukasi Bangsa", "PixelCraft Creative Hub", "Nusantara Logistics",
    "Gaya Kreatif Digital", "Alpha Software Lab", "Sinar Mandiri Retail",
    "Bumi Hijau Consulting", "Vanguard Media Network", "Dua Saudara Coffee & Eatery"
]

locations_jabodetabek = [
    "Jakarta Barat", "Jakbar", "Jkt Barat", "Tanjung Duren", "Grogol", "Kebon Jeruk",
    "Jakarta Selatan", "Jaksel", "Jkt Selatan",
    "Jakarta Pusat", "Jakarta Timur", "Jakarta Utara",
    "Tangerang", "Tangerang Selatan", "Depok", "Bekasi", "Bogor", "Remote"
]

locations_non_jabodetabek = [
    "Surabaya", "Bandung", "Medan", "Semarang", "Yogyakarta", "Bali", "Indonesia"
]

portals = ["LinkedIn", "Glints", "JobStreet", "Kalibrr", "KitaLulus"]

raw_jobs = []
job_counter = 1000

# 1.1 Buat ~320 data VALID (sebelum ditambah anomali dan duplikasi)
for i in range(330):
    job_counter += 1
    tmpl = random.choice(job_templates)
    comp = random.choice(companies)
    loc = random.choice(locations_jabodetabek)
    portal = random.choice(portals)
    
    # Variasikan sedikit gaji & jam kerja
    salary_noise = random.randint(-4, 4) * 2000
    salary = max(20000, tmpl["salary"] + salary_noise)
    hours_noise = random.randint(-4, 4)
    hours = min(28, max(8, tmpl["hours"] + hours_noise))
    
    # Missing value buatan (sesuai spesifikasi Section 3.1)
    # ~15% gaji hilang
    salary_val = np.nan if random.random() < 0.15 else salary
    # ~10% jam kerja hilang
    hours_val = np.nan if random.random() < 0.10 else hours
    # ~4% sistem kerja hilang
    system_val = np.nan if random.random() < 0.04 else tmpl["system"]
    # ~4% skill hilang
    skills_val = np.nan if random.random() < 0.04 else tmpl["skills"]
    
    date_p = (datetime.now() - timedelta(days=random.randint(1, 28))).strftime("%Y-%m-%d")
    
    raw_jobs.append({
        "job_id": f"JOB-{job_counter}",
        "job_title": tmpl["title"],
        "company_name": comp,
        "job_category": tmpl["category"],
        "work_salaryperhour": salary_val,
        "work_job_location": loc,
        "work_hours": hours_val,
        "work_system": system_val,
        "work_required_skills": skills_val,
        "source_portal": portal,
        "url": f"https://www.{portal.lower().replace(' ', '')}.com/jobs/{job_counter}",
        "date_posted": date_p
    })

# 1.2 Tambah 25 Baris Duplikat (Layer 1 Testing)
# - 15 Exact duplicate
for i in range(15):
    target = random.choice(raw_jobs[:100])
    raw_jobs.append(dict(target))

# - 10 Cross-platform duplicate (job_title + company + location sama, portal beda)
for i in range(10):
    target = random.choice(raw_jobs[100:200])
    dup = dict(target)
    job_counter += 1
    dup["job_id"] = f"JOB-{job_counter}"
    dup["source_portal"] = "KitaLulus" if target["source_portal"] != "KitaLulus" else "JobStreet"
    dup["url"] = f"https://www.{dup['source_portal'].lower()}.com/jobs/{job_counter}"
    raw_jobs.append(dup)

# 1.3 Tambah 70 Lowongan Kata Kunci Negatif (Layer 2 Testing)
negative_prefixes = [
    "Full-Time Senior", "Full Time Officer", "Magang Mahasiswa Akhir", 
    "Internship IT Support", "Volunteer Event", "Management Trainee (MT)", 
    "Kontrak Tahunan Staff", "Full-Time Staff Marketing"
]
for i in range(70):
    job_counter += 1
    tmpl = random.choice(job_templates)
    neg_word = random.choice(negative_prefixes)
    raw_jobs.append({
        "job_id": f"JOB-{job_counter}",
        "job_title": f"{neg_word} - {tmpl['title']}",
        "company_name": random.choice(companies),
        "job_category": tmpl["category"],
        "work_salaryperhour": 50000,
        "work_job_location": random.choice(locations_jabodetabek),
        "work_hours": 40,
        "work_system": tmpl["system"],
        "work_required_skills": tmpl["skills"],
        "source_portal": random.choice(portals),
        "url": f"https://portal.com/jobs/{job_counter}",
        "date_posted": (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d")
    })

# 1.4 Tambah 45 Lowongan Overtime / Jam Kerja Tidak Layak Mahasiswa (Layer 3 Testing)
for i in range(45):
    job_counter += 1
    tmpl = random.choice(job_templates)
    raw_jobs.append({
        "job_id": f"JOB-{job_counter}",
        "job_title": f"Shift Malam Penuh - {tmpl['title']}",
        "company_name": random.choice(companies),
        "job_category": tmpl["category"],
        "work_salaryperhour": 35000,
        "work_job_location": random.choice(locations_jabodetabek),
        "work_hours": random.choice([35, 40, 45, 50]), # > 30 jam
        "work_system": "Onsite",
        "work_required_skills": tmpl["skills"],
        "source_portal": random.choice(portals),
        "url": f"https://portal.com/jobs/{job_counter}",
        "date_posted": (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    })

# 1.5 Tambah 30 Lowongan Anomali Gaji & Anti-Scam (Layer 4 Testing)
scam_cases = [
    {"salary": 0, "skill": "sistem komisi murni tanpa gaji pokok, cari member baru"},
    {"salary": 4000, "skill": "upah harian sangat kecil, kerja serabutan"},
    {"salary": 500000, "skill": "kerja paruh waktu like video tiktok cuan ratusan ribu"},
    {"salary": 800000, "skill": "investasi klik iklan harian berpenghasilan fantastis"}
]
for i in range(30):
    job_counter += 1
    scam = random.choice(scam_cases)
    raw_jobs.append({
        "job_id": f"JOB-{job_counter}",
        "job_title": "Part-Time Tugas Online Cepat Kaya / Komisi",
        "company_name": "Multi Marketing Global",
        "job_category": "Admin & Operational",
        "work_salaryperhour": scam["salary"],
        "work_job_location": "Jakarta Barat",
        "work_hours": 15,
        "work_system": "Remote",
        "work_required_skills": scam["skill"],
        "source_portal": random.choice(portals),
        "url": f"https://portal.com/jobs/{job_counter}",
        "date_posted": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
    })

# 1.6 Tambah 30 Lowongan Non-Jabodetabek Onsite (Layer 5 Testing)
for i in range(30):
    job_counter += 1
    tmpl = random.choice(job_templates)
    raw_jobs.append({
        "job_id": f"JOB-{job_counter}",
        "job_title": f"{tmpl['title']} Area Daerah",
        "company_name": random.choice(companies),
        "job_category": tmpl["category"],
        "work_salaryperhour": 30000,
        "work_job_location": random.choice(locations_non_jabodetabek),
        "work_hours": 20,
        "work_system": "Onsite", # Onsite di luar kota
        "work_required_skills": tmpl["skills"],
        "source_portal": random.choice(portals),
        "url": f"https://portal.com/jobs/{job_counter}",
        "date_posted": (datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d")
    })

# 1.7 Tambah 10 Data Rusak / Incomplete (Layer 6 Testing)
for i in range(10):
    job_counter += 1
    raw_jobs.append({
        "job_id": f"JOB-{job_counter}",
        "job_title": np.nan, # Judul hilang
        "company_name": "Perusahaan Tidak Teridentifikasi",
        "job_category": "IT & Software",
        "work_salaryperhour": 35000,
        "work_job_location": "Jakarta Barat",
        "work_hours": 15,
        "work_system": "Remote",
        "work_required_skills": np.nan,
        "source_portal": "JobStreet",
        "url": np.nan, # Link 404/hilang
        "date_posted": (datetime.now() - timedelta(days=12)).strftime("%Y-%m-%d")
    })

# Shuffle dataset
random.shuffle(raw_jobs)
df_raw_jobs = pd.DataFrame(raw_jobs)
df_raw_jobs.to_csv("raw_job_postings.csv", index=False)
print(f"[OK] Berhasil membuat raw_job_postings.csv dengan {len(df_raw_jobs)} baris data.")

# ==========================================
# 2. GENERASI DATA KUESIONER MAHASISWA UKRIDA
# ==========================================

first_names = [
    "Brandon", "Andrew", "Raffael", "Michael", "Kevin", "Jason", "Daniel", "Christian",
    "David", "Jonathan", "Samuel", "Nathan", "Timothy", "Christopher", "Nicholas",
    "Jessica", "Stephanie", "Vanessa", "Patricia", "Michelle", "Amanda", "Chelsea",
    "Angelica", "Felicia", "Jennifer", "Grace", "Clara", "Evelyn", "Nathania", "Sheryl"
]
last_names = [
    "Sutedja", "Linardi", "Lolaroh", "Sipahutar", "Wijaya", "Tan", "Kusuma", "Santoso",
    "Pratama", "Hartanto", "Gunawan", "Setiawan", "Hidayat", "Chandra", "Budiman",
    "Liem", "Purnomo", "Susanto", "Halim", "Wongso"
]

student_skill_pools = [
    "python, pandas, web development, html, css, sql dasar, git",
    "canva, capcut, adobe photoshop, video editing, social media marketing",
    "microsoft excel, word, data entry, pengetikan, komunikasi ramah",
    "scratch, python dasar, algoritma pemrograman, matematika, mengajar anak",
    "public speaking, presentasi, live streaming host, copywriting, negosiasi",
    "react, javascript, frontend development, ui/ux design, figma",
    "hardware pc, instalasi windows, troubleshooting jaringan, customer service",
    "copywriting, content writer, seo dasar, riset artikel, bahasa inggris aktif"
]

categories = [
    "IT & Software", "Design & Creative", "Content & Communication", 
    "Education & Tutoring", "Admin & Operational"
]

student_rows = []
for i in range(1, 56):
    nim = f"41202{random.choice(['4', '5'])}{random.randint(10, 99):02d}"
    name = f"{random.choice(first_names)} {random.choice(last_names)}"
    cat = random.choice(categories)
    min_sal = random.choice([25000, 30000, 35000, 40000, 45000])
    loc = random.choice(["Jakarta Barat", "Tanjung Duren", "Kebon Jeruk", "Jakarta Selatan", "Tangerang"])
    sched = random.choice(["Weekend Only", "Weekday Malam", "Fleksibel Paruh Waktu"])
    exp_hours = random.choice([12, 15, 16, 18, 20])
    skills = random.choice(student_skill_pools)
    ts = (datetime.now() - timedelta(days=random.randint(1, 14), hours=random.randint(1, 10))).strftime("%Y-%m-%d %H:%M:%S")

    # Sisipkan 3 data bolong untuk simulasi Missing Value Deletion pada Kuesioner
    if i in [14, 28, 42]:
        skills = np.nan
        min_sal = np.nan

    student_rows.append({
        "student_id": f"MHS-{i:03d}",
        "student_nim": nim,
        "student_name": name,
        "student_job_category": cat,
        "min_expected_salary": min_sal,
        "student_location": loc,
        "student_work_schedule": sched,
        "student_expected_work_hour": exp_hours,
        "student_skills": skills,
        "timestamp": ts
    })

df_students = pd.DataFrame(student_rows)
df_students.to_csv("raw_student_preferences.csv", index=False)
print(f"[OK] Berhasil membuat raw_student_preferences.csv dengan {len(df_students)} baris data.")
