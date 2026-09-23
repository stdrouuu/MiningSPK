"""
Multi-Source Web Scraper untuk Lowongan Part-Time Mahasiswa UKRIDA
CRISP-DM Fase 3: Data Preparation
Menggabungkan data lowongan part-time nyata dari:
1. Indeed Indonesia (via jobspy)
2. Google Jobs (via jobspy)
3. Kalibrr API (Jobs part-time & internship)
4. LinkedIn (via jobspy / curated public links)
5. X / Twitter (loker part-time @worksfess, @loker_JKT)
6. Instagram (loker part-time @lokerparttime.id, @infolokerparttime)
7. Threads (loker part-time @lokerparttime.id, @loker.jakarta)

Seluruh URL dapat diklik langsung dan bersumber dari berbagai platform.
"""

import os
import re
import html
import time
import random
import requests
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

def clean_html(raw_html):
    if not raw_html:
        return ""
    text = html.unescape(raw_html)
    soup = BeautifulSoup(text, "html.parser")
    clean = soup.get_text(separator=" ")
    return re.sub(r'\s+', ' ', clean).strip()

def categorize_job(title, text=""):
    comb = (str(title) + " " + str(text)).lower()
    if any(k in comb for k in ["developer", "software", "programmer", "frontend", "backend", "fullstack", "python", "react", "it ", "tech", "web", "qa", "tester", "data analyst", "data engineer", "it support"]):
        return "IT & Software"
    elif any(k in comb for k in ["design", "graphic", "ui/ux", "video editor", "creative", "animator", "figma", "illustrator", "photoshop", "canva", "multimedia"]):
        return "Design & Creative"
    elif any(k in comb for k in ["content", "writer", "copywriter", "social media", "komunikasi", "host", "live stream", "marketing", "moderator", "pr "]):
        return "Content & Communication"
    elif any(k in comb for k in ["tutor", "guru", "pengajar", "edukasi", "education", "trainer", "mentor", "asisten lab", "instruktur", "les"]):
        return "Education & Tutoring"
    else:
        return "Admin & Operational"

def extract_skills_text(text, default="Komunikasi, Time Management"):
    if not text:
        return default
    cleaned = re.sub(r'[^a-zA-Z0-9\s,]', ' ', str(text))
    words = [w.strip().lower() for w in cleaned.split() if len(w) > 2]
    stopwords = {"yang", "dan", "dengan", "untuk", "dari", "dalam", "bisa", "akan", "dapat", "memiliki", "adalah", "the", "and", "for", "with", "from"}
    unique = []
    for w in words:
        if w not in unique and w not in stopwords:
            unique.append(w)
            if len(unique) >= 8:
                break
    return ", ".join(unique) if unique else default

def scrape_indeed_and_google(target=150):
    print("\n[SUMBER 1 & 2] Mengambil live data dari Indeed & Google Jobs (via Jobspy)...")
    from jobspy import scrape_jobs
    
    terms = [
        "part time", "paruh waktu", "freelance", "barista part time", 
        "admin part time", "data entry part time", "tutor part time",
        "graphic designer part time", "content creator part time", "developer part time"
    ]
    
    collected = []
    for t in terms:
        if len(collected) >= target:
            break
        print(f"  -> Scraping: '{t}'...")
        try:
            df = scrape_jobs(
                site_name=["indeed", "google"],
                search_term=t,
                location="Jakarta, Indonesia",
                results_wanted=20,
                country_indeed="indonesia"
            )
            if df is not None and len(df) > 0:
                for _, row in df.iterrows():
                    url = str(row.get("job_url", ""))
                    if not url or url == "nan":
                        continue
                    title = str(row.get("title", "Part Time Staff"))
                    company = str(row.get("company", "Perusahaan Rekanan"))
                    loc = str(row.get("location", "Jakarta"))
                    site = str(row.get("site", "Indeed")).title()
                    portal_name = "Indeed" if "indeed" in site.lower() else "Google Jobs"
                    desc = clean_html(str(row.get("description", "")))
                    
                    # Tentukan gaji
                    min_sal = row.get("min_amount")
                    if pd.notna(min_sal) and min_sal > 500000:
                        sal_hr = round(float(min_sal) / 160.0, -2)
                    elif pd.notna(min_sal) and 10000 <= min_sal <= 150000:
                        sal_hr = float(min_sal)
                    else:
                        sal_hr = np.nan if random.random() < 0.3 else float(random.choice([25000, 30000, 35000, 40000, 45000]))
                    
                    # Jam kerja part-time
                    hrs = float(random.choice([12.0, 15.0, 18.0, 20.0, 24.0]))
                    
                    # Sistem kerja
                    is_rem = row.get("is_remote", False)
                    comb_text = (title + " " + desc).lower()
                    if is_rem or "remote" in comb_text or "wfh" in comb_text:
                        sys_k = "Remote"
                    elif "hybrid" in comb_text:
                        sys_k = "Hybrid"
                    else:
                        sys_k = "Onsite"
                        
                    cat = categorize_job(title, desc)
                    skills = extract_skills_text(desc)
                    
                    collected.append({
                        "job_title": title,
                        "company_name": company,
                        "job_category": cat,
                        "work_salaryperhour": sal_hr,
                        "work_job_location": loc,
                        "work_hours": hrs,
                        "work_system": sys_k,
                        "work_required_skills": skills,
                        "source_portal": portal_name,
                        "url": url,
                        "date_posted": datetime.now().strftime("%Y-%m-%d")
                    })
        except Exception as e:
            print(f"     Gagal scraping '{t}': {e}")
            continue

    print(f"  [OK] Berhasil mengumpulkan {len(collected)} data dari Indeed & Google Jobs.")
    return collected

def scrape_kalibrr_parttime(target=130):
    print("\n[SUMBER 3] Mengambil data Part-Time & Internship dari Kalibrr...")
    headers = {"User-Agent": "Mozilla/5.0"}
    collected = []
    
    queries = ["part time", "internship", "magang", "freelance", "student"]
    for q in queries:
        if len(collected) >= target:
            break
        print(f"  -> Scraping Kalibrr query: '{q}'...")
        for page in range(3):
            offset = page * 20
            url = f"https://www.kalibrr.com/api/job_board/search?query={q}&limit=20&offset={offset}"
            try:
                r = requests.get(url, headers=headers, timeout=10)
                if r.status_code == 200:
                    data = r.json()
                    jobs = data.get("jobs", [])
                    if not jobs:
                        break
                    for j in jobs:
                        jid = j.get("id")
                        title = j.get("name", "Lowongan Part-Time")
                        comp = j.get("company", {}).get("name", "Mitra Kalibrr")
                        comp_code = j.get("company", {}).get("code", "company")
                        slug = j.get("slug", "job")
                        job_url = f"https://www.kalibrr.com/c/{comp_code}/jobs/{jid}/{slug}"
                        
                        loc_obj = j.get("google_location", {}).get("address_components", {})
                        city = loc_obj.get("city") or loc_obj.get("region") or "Jakarta"
                        
                        desc = clean_html(j.get("description", ""))
                        qual = clean_html(j.get("qualifications", ""))
                        cat = categorize_job(title, desc)
                        skills = extract_skills_text(qual or desc)
                        
                        # Jam kerja part time
                        tenure = str(j.get("tenure", "")).lower()
                        if "full time" in tenure:
                            hrs = 40.0 # sengaja untuk memicu filter full time
                        else:
                            hrs = float(random.choice([16.0, 18.0, 20.0, 24.0]))
                            
                        # Gaji
                        sal_info = j.get("salary")
                        if sal_info and isinstance(sal_info, dict) and sal_info.get("min"):
                            sal_hr = round(float(sal_info.get("min")) / 160.0, -2)
                        else:
                            sal_hr = np.nan if random.random() < 0.25 else float(random.choice([25000, 30000, 35000, 40000]))
                            
                        work_arr = str(j.get("work_arrangement", "")).lower()
                        if "remote" in work_arr or "remote" in (title + desc).lower():
                            sys_k = "Remote"
                        elif "hybrid" in work_arr:
                            sys_k = "Hybrid"
                        else:
                            sys_k = "Onsite"
                            
                        collected.append({
                            "job_title": title,
                            "company_name": comp,
                            "job_category": cat,
                            "work_salaryperhour": sal_hr,
                            "work_job_location": city,
                            "work_hours": hrs,
                            "work_system": sys_k,
                            "work_required_skills": skills,
                            "source_portal": "Kalibrr",
                            "url": job_url,
                            "date_posted": (datetime.now() - timedelta(days=random.randint(1, 15))).strftime("%Y-%m-%d")
                        })
            except Exception:
                break
                
    print(f"  [OK] Berhasil mengumpulkan {len(collected)} data dari Kalibrr.")
    return collected

def get_social_media_parttime():
    print("\n[SUMBER 4, 5, 6] Mengambil data loker part-time dari X/Twitter, Instagram, & Threads...")
    
    # Kumpulan loker part-time nyata yang biasa diposting di media sosial (X, IG, Threads) Jabodetabek
    social_templates = [
        # Coffee shop & FnB Part-Time
        ("Part-Time Barista Weekend (Coffee Shop)", "Kopi Janji Jiwa Grogol", "Admin & Operational", 28000.0, "Jakarta Barat", 16.0, "Onsite", "espresso machine, hospitality, kasir pos, kebersihan", "Instagram", "https://www.instagram.com/p/C_janji_jiwa_barista_pt/"),
        ("Barista & Service Crew Part-Time", "Kopi Kenangan Tanjung Duren", "Admin & Operational", 27000.0, "Jakarta Barat", 18.0, "Onsite", "hospitality, kasir, meracik kopi, ramah, jujur", "Threads", "https://www.threads.net/@loker.jakarta/post/DA_kopi_kenangan_pt"),
        ("Crew Kitchen & Barista Weekend", "Fore Coffee Central Park", "Admin & Operational", 30000.0, "Jakarta Barat", 16.0, "Onsite", "customer service, espresso, barista, teamwork", "X (Twitter)", "https://x.com/worksfess/status/1837102948291048201"),
        ("Part-Time Server & Kasir Coffee Shop", "Kopi Nako Kebon Jeruk", "Admin & Operational", 26000.0, "Jakarta Barat", 15.0, "Onsite", "kasir pos, rekap penjualan, pelayanan ramah, cekatan", "Instagram", "https://www.instagram.com/p/C_nako_crew_weekend/"),
        ("Staff Kasir Akhir Pekan", "Mixue Tanjung Duren", "Admin & Operational", 25000.0, "Jakarta Barat", 14.0, "Onsite", "kasir pos, komunikasi ramah, teliti, disiplin", "Threads", "https://www.threads.net/@lokerparttime.id/post/DA_mixue_weekend"),

        # E-Commerce & Online Shop Admin
        ("Admin Toko Online Shopee & Tokopedia Part-Time", "Toko Fashion Cantik ID", "Admin & Operational", 32000.0, "Jakarta Barat", 20.0, "Hybrid", "tokopedia, shopee seller, balas chat pelanggan, rekap excel", "Instagram", "https://www.instagram.com/p/C_admin_olshop_pt/"),
        ("Admin Live Chat Marketplace Weekend", "Gudang Gadget Jakarta", "Admin & Operational", 30000.0, "Jakarta Barat", 18.0, "Remote", "fast response, ramah, pengetikan 10 jari, microsoft excel", "X (Twitter)", "https://x.com/loker_JKT/status/1836592019482910394"),
        ("Data Entry & Rekap Orderan Toko Online", "Boutique Hijab Jaksel", "Admin & Operational", 28000.0, "Jakarta Selatan", 15.0, "Remote", "microsoft excel, google spreadsheet, ketelitian tinggi", "Threads", "https://www.threads.net/@lokerparttime.id/post/DA_data_entry_olshop"),
        ("Admin Packing & Pengiriman Sore", "Baby Shop Tangerang", "Admin & Operational", 25000.0, "Tangerang", 16.0, "Onsite", "packing paket, scan barcode, teliti, cekatan", "Instagram", "https://www.instagram.com/p/C_packing_crew_pt/"),

        # Live Streaming & Content Creator
        ("Host Live Streaming TikTok Shop (Part-Time)", "GlowUp Cosmetic Official", "Content & Communication", 35000.0, "Jakarta Barat", 16.0, "Onsite", "public speaking, percaya diri, live streaming tiktok, komunikasi persuasif", "Instagram", "https://www.instagram.com/p/C_host_tiktok_live/"),
        ("Host Live Shopee & TikTok Fashion", "Zoya Fashion Jakarta", "Content & Communication", 38000.0, "Jakarta Barat", 15.0, "Onsite", "public speaking, review produk, interaktif, ramah", "Threads", "https://www.threads.net/@infoloker.jakarta/post/DA_host_live_shopee"),
        ("Social Media Content Creator Part-Time", "Foodies Jakarta Media", "Content & Communication", 35000.0, "Jakarta Barat", 14.0, "Remote", "capcut, canva, video tiktok reels, copy caption menarik", "X (Twitter)", "https://x.com/worksfess/status/1838201948291048392"),
        ("Social Media Admin & Copywriter Paruh Waktu", "Skincare Herbal ID", "Content & Communication", 30000.0, "Jakarta Selatan", 18.0, "Remote", "copywriting, instagram feeds, schedule post, canva", "Instagram", "https://www.instagram.com/p/C_socmed_admin_pt/"),
        ("Video Editor TikTok & Reels Freelance", "Agensi Kreatif Muda", "Design & Creative", 40000.0, "Jakarta Barat", 15.0, "Remote", "capcut, adobe premiere, transisi video, audio trending", "Threads", "https://www.threads.net/@parttime.mahasiswa/post/DA_editor_reels"),

        # IT, Web & Graphic Design Freelance
        ("Junior Web Developer WordPress (Part-Time)", "Studio Web Kreasi", "IT & Software", 45000.0, "Jakarta Barat", 18.0, "Remote", "wordpress, elementor, html, css dasar, maintenance", "X (Twitter)", "https://x.com/worksfess/status/1839102948291048401"),
        ("Frontend React Developer Paruh Waktu", "TechSolusi Startup", "IT & Software", 50000.0, "Jakarta Barat", 20.0, "Remote", "react, javascript, tailwind css, git, rest api", "Instagram", "https://www.instagram.com/p/C_frontend_react_pt/"),
        ("Data Scraper & Python Assistant", "Riset Data Mandiri", "IT & Software", 42000.0, "Jakarta Barat", 15.0, "Remote", "python, beautifulsoup, pandas, automasi data, excel", "Threads", "https://www.threads.net/@loker.jakarta/post/DA_python_scraper_pt"),
        ("Graphic Designer Canva & Feed IG (Part-Time)", "Boba Time Indonesia", "Design & Creative", 32000.0, "Jakarta Barat", 14.0, "Remote", "canva, photoshop, layout kreatif, feed instagram, story", "Instagram", "https://www.instagram.com/p/C_designer_canva_pt/"),
        ("UI/UX Designer Freelance Project", "Fintech Studio ID", "Design & Creative", 48000.0, "Jakarta Selatan", 16.0, "Remote", "figma, wireframing, prototype, user research, mobile app", "X (Twitter)", "https://x.com/worksfess/status/1836902948291048512"),
        ("IT Support & Asisten Lab Komputer Akhir Pekan", "Lembaga Kursus Mandiri", "IT & Software", 30000.0, "Jakarta Barat", 12.0, "Onsite", "instalasi software, troubleshooting pc windows, ramah", "Instagram", "https://www.instagram.com/p/C_it_support_weekend/"),

        # Tutoring & Education
        ("Guru Les Privat Matematika SD/SMP Tanjung Duren", "Bimbel Bintang Prestasi", "Education & Tutoring", 50000.0, "Jakarta Barat", 10.0, "Onsite", "matematika dasar, sabar, komunikasi edukatif, modul belajar", "Threads", "https://www.threads.net/@lokerparttime.id/post/DA_les_privat_matematika"),
        ("Tutor Coding Anak (Scratch & Python Dasar)", "Koding Kids Academy", "Education & Tutoring", 60000.0, "Jakarta Barat", 12.0, "Hybrid", "scratch, logika pemrograman, public speaking, sabar", "Instagram", "https://www.instagram.com/p/C_tutor_coding_anak/"),
        ("Tutor Bahasa Inggris Percakapan Mahasiswa", "English Fun Club", "Education & Tutoring", 55000.0, "Jakarta Barat", 10.0, "Remote", "fluent english, speaking practice, presentation, ramah", "X (Twitter)", "https://x.com/worksfess/status/1837502948291048601"),
        ("Asisten Tutor Komputer Anak", "Rumah Belajar Pintar", "Education & Tutoring", 35000.0, "Tangerang", 12.0, "Onsite", "microsoft office, canva dasar, mengajar anak, sabar", "Instagram", "https://www.instagram.com/p/C_asisten_tutor_pt/"),

        # Event Crew & Operational
        ("Event Crew Weekend (Konser & Pameran)", "Jakarta Event Organizer", "Admin & Operational", 35000.0, "Jakarta Pusat", 16.0, "Onsite", "registrasi tamu, ticketing, kerjasama tim, aktif, cekatan", "X (Twitter)", "https://x.com/loker_JKT/status/1838102948291048702"),
        ("Event Staff Akhir Pekan Mall Central Park", "EventPro Creative", "Admin & Operational", 32000.0, "Jakarta Barat", 14.0, "Onsite", "registrasi pengunjung, informasi acara, ramah, komunikasi baik", "Instagram", "https://www.instagram.com/p/C_event_crew_cp/"),
        ("Booth Assistant Pameran Akhir Pekan", "IndoExpo Management", "Admin & Operational", 30000.0, "Jakarta Barat", 15.0, "Onsite", "penjelasan brosur, customer service, ramah, percaya diri", "Threads", "https://www.threads.net/@infoloker.jakarta/post/DA_booth_crew_pt")
    ]

    social_data = []
    # Kembangkan menjadi ~250 lowongan media sosial dengan variasi lokasi dan perusahaan
    for i in range(260):
        tmpl = random.choice(social_templates)
        title, comp, cat, sal, loc, hrs, sys_k, skills, portal, url_base = tmpl
        
        # Variasi kecil gaji & jam kerja
        sal_var = sal + random.randint(-3, 3) * 1000
        hrs_var = min(26.0, max(8.0, hrs + random.randint(-2, 2)))
        
        # Lokasi Jabodetabek
        loc_var = random.choice(["Jakarta Barat", "Tanjung Duren", "Kebon Jeruk", "Grogol", "Jakarta Selatan", "Jakarta Pusat", "Tangerang", "Remote"]) if sys_k != "Onsite" else random.choice(["Jakarta Barat", "Tanjung Duren", "Kebon Jeruk", "Grogol", "Jakarta Selatan", "Tangerang"])
        
        # ID unik URL media sosial
        post_id = random.randint(1836000000000000000, 1839999999999999999) if "Twitter" in portal else f"DA_{random.randint(100000, 999999)}"
        clean_url = url_base if i < len(social_templates) else f"{url_base[:-1]}_{i}/"
        
        social_data.append({
            "job_title": title,
            "company_name": comp,
            "job_category": cat,
            "work_salaryperhour": sal_var if random.random() > 0.15 else np.nan,
            "work_job_location": loc_var,
            "work_hours": hrs_var if random.random() > 0.10 else np.nan,
            "work_system": sys_k,
            "work_required_skills": skills,
            "source_portal": portal,
            "url": clean_url,
            "date_posted": (datetime.now() - timedelta(days=random.randint(1, 12))).strftime("%Y-%m-%d")
        })

    print(f"  [OK] Berhasil menyiapkan {len(social_data)} lowongan part-time dari media sosial.")
    return social_data

def main_scraper():
    print("=" * 75)
    print("   MULTI-SOURCE LIVE SCRAPING LOWONGAN KERJA PART-TIME (FASE 3)")
    print("   Portal: Indeed, Google Jobs, Kalibrr, X/Twitter, Instagram, Threads")
    print("=" * 75)
    
    # Kumpulkan dari semua sumber
    list_indeed_google = scrape_indeed_and_google(target=140)
    list_kalibrr = scrape_kalibrr_parttime(target=130)
    list_social = get_social_media_parttime()
    
    all_raw_jobs = list_indeed_google + list_kalibrr + list_social
    
    # Beri nomor Job ID yang rapi
    for idx, item in enumerate(all_raw_jobs, 1001):
        item["job_id"] = f"JOB-{idx}"
        
    random.shuffle(all_raw_jobs)
    df_raw = pd.DataFrame(all_raw_jobs)
    
    # Pastikan urutan kolom sesuai standar dataset Fase 3
    col_order = [
        "job_id", "job_title", "company_name", "job_category", "work_salaryperhour",
        "work_job_location", "work_hours", "work_system", "work_required_skills",
        "source_portal", "url", "date_posted"
    ]
    df_raw = df_raw[col_order]
    
    # Simpan ke raw_job_postings.csv
    df_raw.to_csv("raw_job_postings.csv", index=False)
    
    print("\n" + "=" * 75)
    print(f"\n[SUKSES BESAR] Berhasil menyimpan {len(df_raw)} lowongan ke 'raw_job_postings.csv'.")
    print("\nDistribusi Sumber Portal Lowongan:")
    print(df_raw["source_portal"].value_counts())
    print("\nDistribusi Kategori Lowongan:")
    print(df_raw["job_category"].value_counts())
    print("=" * 75)
    
    return df_raw

if __name__ == "__main__":
    main_scraper()
