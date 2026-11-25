"""Scrape up to 1000+ fresh, open, Jabodetabek part-time jobs across 4 portals & run Phase 3 cleaning.

Outputs are written exclusively to `1000_*` files so existing CSVs and web data
are never overwritten:
- data/raw/raw-jobs/1000_raw_job_postings.csv
- data/processed/cleaned-jobs/1000_clean_jobs_dataset.csv
- data/processed/matrix/1000_decision_matrix_sample.csv
- data/processed/matrix/1000_tfidf_skills.json
"""

import argparse
import hashlib
import json
import re
import threading
import time
from collections import Counter, defaultdict, deque
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import quote, urlsplit, urlunsplit

import pandas as pd
import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from scripts.generate_raw_data import CATEGORIES_10, HEADERS, map_10_categories
from scripts.refresh_job_candidates import CLOSED_TEXT, JAKARTA, parse_date, schema_postings
from src.config import (
    NON_JABO_CITIES,
    PROJECT_ROOT,
    RAW_MOCK_STUDENTS_PATH,
    VALID_JABO_KEYWORDS,
)
from src.decision_matrix import build_clean_jobs_export, build_decision_matrix
from src.encoding import encode_work_system
from src.filtering import apply_6_layer_filtering, print_funnel_summary
from src.imputation import clean_student_missing_values, impute_job_missing_values
from src.skill_similarity import compute_skill_similarity, export_tfidf_artifact
from src.standardization import standardize_and_cap
from sklearn.feature_extraction.text import TfidfVectorizer

DEFAULT_RAW_OUT = PROJECT_ROOT / "data" / "raw" / "raw-jobs" / "1000_raw_job_postings.csv"
DEFAULT_CLEAN_OUT = PROJECT_ROOT / "data" / "processed" / "cleaned-jobs" / "1000_clean_jobs_dataset.csv"
DEFAULT_MATRIX_OUT = PROJECT_ROOT / "data" / "processed" / "matrix" / "1000_decision_matrix_sample.csv"
DEFAULT_TFIDF_OUT = PROJECT_ROOT / "data" / "processed" / "matrix" / "1000_tfidf_skills.json"

GLINTS_JABO_LOCS = {
    "DKI Jakarta": "78d63064-78a1-4577-8516-036a6c5e903e",
    "Jakarta Barat": "af0ed74f-1b51-43cf-a14c-459996e39105",
    "Jakarta Pusat": "e2a615bb-0997-42c8-a018-c4a1768ae01f",
    "Jakarta Selatan": "078b37b2-e791-4739-958e-c29192e5df3e",
    "Jakarta Timur": "3d6ac5e8-f12d-40cd-823d-44597402ea3b",
    "Jakarta Utara": "ea61f4ac-5864-4b2b-a2c8-aa744a2aafea",
    "Tangerang": "ae3c458e-5947-4833-8f1b-e001ce2fad1d",
    "Tangerang Selatan": "337f8da8-70d8-4916-9733-1cee8e4902e9",
    "Kab. Tangerang": "d305a80e-4891-45a4-8c5b-29c9242f431e",
    "Bekasi": "87c39cfb-0e3c-4edb-a7a0-754fb70cc587",
    "Kab. Bekasi": "826664b3-1f31-497f-bc8a-a23699b1a531",
    "Depok": "f5817918-7ce1-436d-9478-c438b3466adb",
    "Bogor": "262b7d3c-2c51-4854-a7e8-6635e0657338",
    "Kab. Bogor": "fbc373c5-cadc-4dd8-acb3-1e57850e2a08",
}

CATEGORY_SEARCH_TERMS = (
    "", "guru", "tutor", "pengajar", "english", "bimbel", "coding", "math", "mandarin", "trainer",
    "barista", "cook", "kitchen", "waiter", "waitress", "chef", "cafe", "baker", "f&b", "restoran",
    "kasir", "cashier", "store", "pramuniaga", "retail", "outlet", "toko", "crew", "apotek",
    "sales", "marketing", "spg", "promotor", "telemarketing", "account", "affiliate", "bisnis",
    "content", "social media", "copywriter", "host live", "live", "translator", "writer", "tiktok", "video",
    "desain", "design", "graphic", "video editor", "illustrator", "ui", "creative", "foto", "canva",
    "admin", "administrasi", "data entry", "operasional", "sekretaris", "staff", "finance", "hr", "akuntansi", "legal",
    "customer service", "cs", "receptionist", "resepsionis", "chat", "support", "call center", "front",
    "kurir", "driver", "warehouse", "gudang", "packer", "logistik", "delivery", "rider", "helper", "picker",
    "developer", "programmer", "software", "it", "web", "teknisi", "engineer", "qa", "network", "data", "analyst", "flutter", "wordpress",
)


_THREAD_LOCAL = threading.local()


def make_session():
    session = getattr(_THREAD_LOCAL, "session", None)
    if session is None:
        session = requests.Session()
        session.headers.update(HEADERS)
        retry = Retry(total=2, backoff_factor=0.3, status_forcelist=[500, 502, 503, 504])
        adapter = HTTPAdapter(max_retries=retry, pool_connections=20, pool_maxsize=20)
        session.mount("https://", adapter)
        _THREAD_LOCAL.session = session
    return session


def is_jabo_text(text):
    low = str(text or "").lower()
    return any(k in low for k in VALID_JABO_KEYWORDS) and not any(k in low for k in NON_JABO_CITIES)


def title_has_non_jabo_placement(title):
    low = str(title or "").lower()
    return any(re.search(rf"\b{re.escape(city)}\b", low) for city in NON_JABO_CITIES)


def extract_hours_from_text(text):
    if not text:
        return None
    plain = BeautifulSoup(str(text), "html.parser").get_text(" ", strip=True)
    m_week = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?)\s*)?(?:jam|hours?)\s*(?:/|per)\s*(?:minggu|week|pekan)",
        plain,
        re.I,
    )
    if m_week:
        v1 = float(m_week.group(1))
        v2 = float(m_week.group(2)) if m_week.group(2) else v1
        hrs = (v1 + v2) / 2.0
        if 4 <= hrs <= 60:
            return round(hrs, 1)
    m_day = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?)\s*)?(?:jam|hours?)\s*(?:/|per)\s*(?:hari|day|shift)",
        plain,
        re.I,
    )
    if m_day:
        v1 = float(m_day.group(1))
        v2 = float(m_day.group(2)) if m_day.group(2) else v1
        hrs = ((v1 + v2) / 2.0) * 5.0
        if 4 <= hrs <= 60:
            return round(hrs, 1)
    return None


def salary_to_hourly(min_val, max_val, unit, currency="IDR"):
    if currency and str(currency).upper() != "IDR":
        return None
    vals = [
        float(v) for v in (min_val, max_val)
        if isinstance(v, (int, float)) and not isinstance(v, bool) and v > 0
    ]
    if not vals:
        return None
    amt = sum(vals) / len(vals)
    u = str(unit or "").upper()
    if u == "HOUR":
        return round(amt)
    if u == "DAY":
        return round(amt / 6.0)
    if u == "WEEK":
        return round(amt / 20.0)
    if u == "MONTH":
        return round(amt / 80.0)
    if u == "YEAR":
        return round(amt / 960.0)
    return None


def is_recent(posted_dt, updated_dt, now, max_post_days=180, max_update_days=30):
    if posted_dt and posted_dt.date() <= now.date() and (now.date() - posted_dt.date()) <= timedelta(days=max_post_days):
        return True
    if updated_dt and updated_dt.date() <= now.date() and (now.date() - updated_dt.date()) <= timedelta(days=max_update_days):
        return True
    return False


def make_job_id(source, url):
    path = urlsplit(url).path
    identifier = path.rsplit("/", 1)[-1] if source == "Glints" else path
    return "JOB-" + hashlib.sha256(f"{source}:{identifier}".encode()).hexdigest()[:20]


# --- 1. GLINTS ---
def discover_glints():
    def fetch_explore(url):
        s = make_session()
        try:
            r = s.get(url, timeout=10)
            if r.status_code != 200:
                return [], []
            sc = BeautifulSoup(r.text, "html.parser").find("script", id="__NEXT_DATA__")
            if not sc:
                return [], []
            pp = json.loads(sc.string).get("props", {}).get("pageProps", {})
            return (
                pp.get("initialJobs", {}).get("jobsInPage", []),
                pp.get("initialFilters", {}).get("hierarchicalLocations", []),
            )
        except Exception:
            return [], []

    urls = []
    for lid in GLINTS_JABO_LOCS.values():
        urls.append(f"https://glints.com/id/opportunities/jobs/explore?jobTypes=PART_TIME&locationId={lid}&country=ID&page=1")
        urls.append(f"https://glints.com/id/opportunities/jobs/explore?jobTypes=PART_TIME&locationId={lid}&sortBy=LATEST&country=ID&page=1")
        for wa in ("ONSITE", "HYBRID", "REMOTE"):
            urls.append(f"https://glints.com/id/opportunities/jobs/explore?jobTypes=PART_TIME&locationId={lid}&workArrangementOptions={wa}&country=ID&page=1")
        for exp in ("NO_EXPERIENCE", "LESS_THAN_A_YEAR", "ONE_TO_THREE_YEARS", "THREE_TO_FIVE_YEARS"):
            urls.append(f"https://glints.com/id/opportunities/jobs/explore?jobTypes=PART_TIME&locationId={lid}&yearsOfExperienceRanges={exp}&country=ID&page=1")

    hubs = [
        "", GLINTS_JABO_LOCS["DKI Jakarta"], GLINTS_JABO_LOCS["Tangerang"],
        GLINTS_JABO_LOCS["Bekasi"], GLINTS_JABO_LOCS["Depok"],
    ]
    for kw in CATEGORY_SEARCH_TERMS:
        for lid in hubs:
            lp = f"&locationId={lid}" if lid else ""
            kp = f"&keyword={quote(kw)}" if kw else ""
            urls.append(f"https://glints.com/id/opportunities/jobs/explore?jobTypes=PART_TIME{kp}{lp}&country=ID&page=1")

    urls = list(dict.fromkeys(urls))
    print(f"[1/4 Glints] Scanning {len(urls)} explore URLs...", flush=True)

    seen = {}
    extra_lids = {}
    with ThreadPoolExecutor(max_workers=12) as ex:
        for idx, (jobs, locs) in enumerate(ex.map(fetch_explore, urls), 1):
            if idx % 150 == 0:
                print(f"  [Glints explore] {idx}/{len(urls)} done (unique={len(seen)})", flush=True)
            for j in jobs:
                jid = j.get("id")
                if jid and j.get("type") == "PART_TIME" and j.get("status") == "OPEN" and jid not in seen:
                    seen[jid] = j
                loc = j.get("location") or {}
                parents = " ".join(p.get("name", "") for p in loc.get("parents", []))
                fl = f"{loc.get('formattedName', '')} {parents}".strip()
                if loc.get("id") and is_jabo_text(fl):
                    extra_lids[loc["id"]] = fl
            for hl in locs:
                nid = hl.get("id")
                name = (hl.get("formattedName") or hl.get("name") or "").strip()
                if nid and is_jabo_text(name) and "kapanewon" not in name.lower():
                    extra_lids[nid] = name

    sub_urls = []
    for lid in extra_lids:
        if lid not in GLINTS_JABO_LOCS.values():
            sub_urls.append(f"https://glints.com/id/opportunities/jobs/explore?jobTypes=PART_TIME&locationId={lid}&country=ID&page=1")
    sub_urls = list(dict.fromkeys(sub_urls))[:80]
    print(f"[1/4 Glints] Scanning {len(sub_urls)} sub-location URLs...", flush=True)
    with ThreadPoolExecutor(max_workers=12) as ex:
        for jobs, _ in ex.map(fetch_explore, sub_urls):
            for j in jobs:
                jid = j.get("id")
                if jid and j.get("type") == "PART_TIME" and j.get("status") == "OPEN" and jid not in seen:
                    seen[jid] = j

    jabo_cands = []
    for j in seen.values():
        loc = j.get("location") or {}
        parents = " ".join(p.get("name", "") for p in loc.get("parents", []))
        fl = f"{loc.get('formattedName', '')} {parents}".strip()
        if is_jabo_text(fl):
            jabo_cands.append((j, fl))
    print(f"[1/4 Glints] Discovered {len(seen)} unique OPEN PART_TIME ({len(jabo_cands)} Jabodetabek)", flush=True)
    return jabo_cands


def verify_glints(candidates, now):
    def worker(item):
        j, fl = item
        title = str(j.get("title") or "").strip()
        slug = re.sub(r"[^a-zA-Z0-9]+", "-", title).strip("-").lower() or "job"
        url = f"https://glints.com/id/opportunities/jobs/{slug}/{j['id']}"
        s = make_session()
        try:
            r = s.get(url, timeout=12, allow_redirects=True)
            if r.status_code != 200:
                return None, f"http_{r.status_code}"
            soup = BeautifulSoup(r.text, "html.parser")
            if CLOSED_TEXT.search(soup.get_text(" ", strip=True)):
                return None, "closed"
            lds = []
            for el in soup.find_all("script", type="application/ld+json"):
                try:
                    lds.extend(list(schema_postings(json.loads(el.get_text()))))
                except Exception:
                    pass
            if len(lds) != 1:
                return None, "missing_ld"
            p = lds[0]
            emp = p.get("employmentType") or []
            if isinstance(emp, str):
                emp = [emp]
            if not any("PART" in str(e).upper() for e in emp):
                return None, "not_part_time"
            vt = parse_date(p.get("validThrough"))
            if vt and (vt < now if "T" in str(p.get("validThrough")) else vt.date() < now.date()):
                return None, "expired"
            dp = parse_date(p.get("datePosted")) or parse_date(j.get("createdAt"))
            ua = parse_date(j.get("updatedAt"))
            if not is_recent(dp, ua, now):
                return None, "stale"
            final_title = str(p.get("title") or title).strip()
            if title_has_non_jabo_placement(final_title):
                return None, "title_non_jabo"
            cat_obj = j.get("hierarchicalJobCategory") or {}
            cn = cat_obj.get("name", "") + " " + " ".join(x.get("name", "") for x in cat_obj.get("parents", []))
            cat = map_10_categories(final_title, cn or (p.get("occupationalCategory") or ""))

            sal_hr = None
            bs = p.get("baseSalary") or {}
            val = bs.get("value") if isinstance(bs, dict) else {}
            if isinstance(val, dict):
                sal_hr = salary_to_hourly(val.get("minValue", val.get("value")), val.get("maxValue"), val.get("unitText"), bs.get("currency"))
            if sal_hr is None and j.get("salaries"):
                sal0 = j["salaries"][0]
                sal_hr = salary_to_hourly(sal0.get("minAmount"), sal0.get("maxAmount"), sal0.get("salaryMode"), sal0.get("CurrencyCode"))

            hrs = None
            wh = re.fullmatch(r"(\d+(?:\.\d+)?)\s*(?:hours?|jam)\s*(?:per|/)\s*(?:week|minggu)", str(p.get("workHours") or "").strip(), re.I)
            if wh:
                hrs = float(wh.group(1))
            if hrs is None:
                hrs = extract_hours_from_text(p.get("description"))

            sk = ", ".join(x["skill"]["name"] for x in (j.get("skills") or []) if isinstance(x, dict) and (x.get("skill") or {}).get("name"))
            if not sk and p.get("skills"):
                sk = p["skills"] if isinstance(p["skills"], str) else ", ".join(str(x) for x in p["skills"])

            wa = str(j.get("workArrangementOption") or "").upper()
            ws = "Remote" if wa == "REMOTE" else ("Hybrid" if wa == "HYBRID" else "Onsite")
            logo = (p.get("hiringOrganization") or {}).get("logo") or ""
            if not logo and (j.get("company") or {}).get("logo"):
                logo = f"https://images.glints.com/unsafe/glints-dashboard.oss-ap-southeast-1.aliyuncs.com/company-logo/{j['company']['logo']}"

            sort_dt = max(d for d in (dp, ua) if d is not None).date().isoformat()
            return {
                "job_id": make_job_id("Glints", url),
                "job_title": final_title,
                "company_name": str((p.get("hiringOrganization") or {}).get("name") or (j.get("company") or {}).get("name") or "").strip(),
                "job_category": cat,
                "work_salaryperhour": sal_hr,
                "work_job_location": fl,
                "work_hours": hrs,
                "work_system": ws,
                "work_required_skills": sk if sk else None,
                "source_portal": "Glints",
                "url": url,
                "date_posted": dp.date().isoformat() if dp else sort_dt,
                "_sort_date": sort_dt,
                "_logo": logo,
            }, None
        except Exception:
            return None, "error"

    rows, rejected = [], Counter()
    with ThreadPoolExecutor(max_workers=14) as ex:
        for row, err in ex.map(worker, candidates):
            if row:
                rows.append(row)
            else:
                rejected[err] += 1
    print(f"[1/4 Glints] Verified {len(rows)} / {len(candidates)} (rejected={dict(rejected)})", flush=True)
    return rows


# --- 2. LOKER.ID ---
def scrape_loker_verified(now):
    def fetch_links(url):
        s = make_session()
        try:
            r = s.get(url, timeout=10)
            if r.status_code != 200:
                return []
            soup = BeautifulSoup(r.text, "html.parser")
            return [
                (a["href"] if a["href"].startswith("http") else f"https://www.loker.id{a['href']}")
                for a in soup.find_all("a", href=True)
                if a["href"].endswith(".html") and not any(x in a["href"] for x in ["tentang", "kebijakan", "syarat", "kontak", "tips"])
            ]
        except Exception:
            return []

    cities = ["jakarta-barat", "jakarta-pusat", "jakarta-selatan", "jakarta-timur", "jakarta-utara", "bekasi", "depok", "tangerang", "tangerang-selatan", "bogor"]
    list_urls = [f"https://www.loker.id/tipe-pekerjaan/paruh-waktu/{c}" for c in cities]
    list_urls += [f"https://www.loker.id/tipe-pekerjaan/paruh-waktu/{c}/page/{p}" for c in cities for p in (2, 3)]
    list_urls += [f"https://www.loker.id/tipe-pekerjaan/paruh-waktu/page/{p}" for p in range(1, 16)]

    urls = set()
    with ThreadPoolExecutor(max_workers=8) as ex:
        for batch in ex.map(fetch_links, list_urls):
            urls.update(batch)

    jabo_hints = ["jakarta", "tangerang", "bekasi", "depok", "bogor", "tangsel", "cikarang", "serpong", "bsd", "bintaro", "cibubur"]
    # Check URLs with Jabo hints plus any ambiguous ones without known non-Jabo slugs
    non_jabo_slugs = ["bandung", "surabaya", "semarang", "yogyakarta", "jogja", "bali", "denpasar", "medan", "malang", "solo", "surakarta", "kediri", "cirebon", "sukabumi", "sidoarjo", "sleman", "bantul", "kerinci", "mojokerto", "makassar", "palembang"]
    target_urls = [u for u in sorted(urls) if any(k in u.lower() for k in jabo_hints) or not any(nj in u.lower() for nj in non_jabo_slugs)]
    print(f"[2/4 Loker.id] Discovered {len(urls)} URLs -> checking {len(target_urls)} Jabodetabek/ambiguous URLs...", flush=True)

    s = make_session()
    rows, rejected = [], Counter()
    for u in target_urls:
        clean_u = urlunsplit(urlsplit(u)._replace(query="", fragment=""))
        time.sleep(0.35)
        try:
            r = s.get(clean_u, timeout=12, allow_redirects=False)
            if r.status_code == 429:
                time.sleep(2.5)
                r = s.get(clean_u, timeout=12, allow_redirects=False)
            if r.status_code != 200:
                rejected[f"http_{r.status_code}"] += 1
                continue
            soup = BeautifulSoup(r.text, "html.parser")
            if CLOSED_TEXT.search(soup.get_text(" ", strip=True)):
                rejected["closed"] += 1
                continue
            lds = []
            for el in soup.find_all("script", type="application/ld+json"):
                try:
                    lds.extend(list(schema_postings(json.loads(el.get_text()))))
                except Exception:
                    pass
            if len(lds) != 1:
                rejected["missing_ld"] += 1
                continue
            p = lds[0]
            emp = p.get("employmentType") or []
            if isinstance(emp, str):
                emp = [emp]
            if not any("PART" in str(e).upper() or "PARUH" in str(e).upper() for e in emp):
                rejected["not_part_time"] += 1
                continue
            vt = parse_date(p.get("validThrough"))
            if vt and (vt < now if "T" in str(p.get("validThrough")) else vt.date() < now.date()):
                rejected["expired"] += 1
                continue
            dp = parse_date(p.get("datePosted"))
            if not is_recent(dp, dp, now):
                rejected["stale"] += 1
                continue
            locs = p.get("jobLocation") or []
            if isinstance(locs, dict):
                locs = [locs]
            fl = " ".join(f"{(l.get('address') or {}).get('addressLocality', '')} {(l.get('address') or {}).get('addressRegion', '')}" for l in locs if isinstance(l, dict)).strip()
            if not is_jabo_text(fl):
                rejected["non_jabo"] += 1
                continue
            title = str(p.get("title") or "").strip()
            if not title or title_has_non_jabo_placement(title):
                rejected["title_invalid"] += 1
                continue
            company = str((p.get("hiringOrganization") or {}).get("name") or "").strip() or "Mitra Perusahaan Loker.id"
            bs = p.get("baseSalary") or {}
            val = bs.get("value") if isinstance(bs, dict) else {}
            sal_hr = salary_to_hourly(val.get("minValue", val.get("value")), val.get("maxValue"), val.get("unitText"), bs.get("currency")) if isinstance(val, dict) else None
            hrs = extract_hours_from_text(p.get("description"))
            sk = p.get("skills")
            if isinstance(sk, list):
                sk = ", ".join(str(x) for x in sk)
            if isinstance(sk, str) and "<" in sk:
                sk = BeautifulSoup(sk, "html.parser").get_text(" ", strip=True)
            remote = str(p.get("jobLocationType") or "").upper() == "TELECOMMUTE"
            ws = "Remote" if remote else ("Hybrid" if "hybrid" in str(p.get("description") or "").lower() else "Onsite")
            logo = (p.get("hiringOrganization") or {}).get("logo") or ""
            if not logo:
                og = soup.find("meta", property="og:image")
                if og and og.get("content") and "logo" in og["content"].lower():
                    logo = og["content"]
            rows.append({
                "job_id": make_job_id("Loker.id", clean_u),
                "job_title": title,
                "company_name": company,
                "job_category": map_10_categories(title, p.get("occupationalCategory") or ""),
                "work_salaryperhour": sal_hr,
                "work_job_location": fl,
                "work_hours": hrs,
                "work_system": ws,
                "work_required_skills": sk if isinstance(sk, str) and sk.strip() else None,
                "source_portal": "Loker.id",
                "url": clean_u,
                "date_posted": dp.date().isoformat(),
                "_sort_date": dp.date().isoformat(),
                "_logo": logo,
            })
        except Exception:
            rejected["error"] += 1
    print(f"[2/4 Loker.id] Verified {len(rows)} / {len(target_urls)} (rejected={dict(rejected)})", flush=True)
    return rows


# --- 3. KITALULUS ---
def scrape_kitalulus_verified(now):
    def fetch_links(url):
        s = make_session()
        try:
            r = s.get(url, timeout=10)
            if r.status_code != 200:
                return []
            soup = BeautifulSoup(r.text, "html.parser")
            return [
                (a["href"] if a["href"].startswith("http") else f"https://www.kitalulus.com{a['href']}")
                for a in soup.find_all("a", href=re.compile(r"/lowongan/detail/"))
            ]
        except Exception:
            return []

    slugs = [
        "/lowongan/in-provinsi-dki-jakarta", "/lowongan/in-jakarta-barat", "/lowongan/in-jakarta-pusat",
        "/lowongan/in-jakarta-selatan", "/lowongan/in-jakarta-timur", "/lowongan/in-jakarta-utara",
        "/lowongan/in-kota-tangerang", "/lowongan/in-kota-tangerang-selatan", "/lowongan/in-kabupaten-tangerang",
        "/lowongan/in-kota-bekasi", "/lowongan/in-kabupaten-bekasi",
        "/lowongan/in-kota-depok", "/lowongan/in-kota-bogor", "/lowongan/in-kabupaten-bogor",
    ]
    kws = [
        "part+time", "paruh+waktu", "parttime", "daily+worker",
        "part+time+jakarta", "part+time+tangerang", "part+time+bekasi", "part+time+depok", "part+time+bogor",
        "paruh+waktu+jakarta", "paruh+waktu+tangerang", "paruh+waktu+bekasi",
        "part+time+barista", "part+time+kasir", "part+time+admin", "part+time+tutor", "part+time+guru",
        "part+time+sales", "part+time+marketing", "part+time+kurir", "part+time+driver",
        "part+time+desain", "part+time+designer", "part+time+video+editor", "part+time+it",
        "part+time+customer+service", "part+time+content", "part+time+host", "part+time+waiter",
        "part+time+store", "part+time+operator",
    ]
    list_urls = [f"https://www.kitalulus.com{slug}?keyword={kw}&page={p}" for slug in slugs for kw in ("part+time", "paruh+waktu", "parttime", "daily+worker") for p in (1, 2)]
    list_urls += [f"https://www.kitalulus.com/lowongan?keyword={kw}&page={p}" for kw in kws for p in (1, 2, 3)]
    list_urls = list(dict.fromkeys(list_urls))

    urls = set()
    with ThreadPoolExecutor(max_workers=12) as ex:
        for batch in ex.map(fetch_links, list_urls):
            urls.update(batch)
    print(f"[3/4 KitaLulus] Discovered {len(urls)} candidate URLs...", flush=True)

    def worker(u):
        clean_u = urlunsplit(urlsplit(u)._replace(query="", fragment=""))
        s = make_session()
        try:
            r = s.get(clean_u, timeout=10, allow_redirects=False)
            if r.status_code != 200:
                return None, f"http_{r.status_code}"
            soup = BeautifulSoup(r.text, "html.parser")
            if CLOSED_TEXT.search(soup.get_text(" ", strip=True)):
                return None, "closed"
            lds = []
            for el in soup.find_all("script", type="application/ld+json"):
                try:
                    lds.extend(list(schema_postings(json.loads(el.get_text()))))
                except Exception:
                    pass
            if len(lds) != 1:
                return None, "missing_ld"
            p = lds[0]
            emp = p.get("employmentType") or []
            if isinstance(emp, str):
                emp = [emp]
            if not any("PART" in str(e).upper() or "PARUH" in str(e).upper() for e in emp):
                return None, "not_part_time"
            vt = parse_date(p.get("validThrough"))
            if vt and (vt < now if "T" in str(p.get("validThrough")) else vt.date() < now.date()):
                return None, "expired"
            dp = parse_date(p.get("datePosted"))
            if not is_recent(dp, dp, now):
                return None, "stale"
            locs = p.get("jobLocation") or []
            if isinstance(locs, dict):
                locs = [locs]
            fl = " ".join(f"{(l.get('address') or {}).get('addressLocality', '')} {(l.get('address') or {}).get('addressRegion', '')}" for l in locs if isinstance(l, dict)).strip()
            if not is_jabo_text(fl):
                return None, "non_jabo"
            title = str(p.get("title") or "").strip()
            if not title or title_has_non_jabo_placement(title):
                return None, "title_invalid"
            company = str((p.get("hiringOrganization") or {}).get("name") or "").strip() or "Mitra Kerja KitaLulus"
            bs = p.get("baseSalary") or {}
            val = bs.get("value") if isinstance(bs, dict) else {}
            sal_hr = salary_to_hourly(val.get("minValue", val.get("value")), val.get("maxValue"), val.get("unitText"), bs.get("currency")) if isinstance(val, dict) else None
            hrs = extract_hours_from_text(p.get("description"))
            sk = p.get("skills")
            if isinstance(sk, list):
                sk = ", ".join(str(x) for x in sk)
            remote = str(p.get("jobLocationType") or "").upper() == "TELECOMMUTE"
            ws = "Remote" if remote else ("Hybrid" if "hybrid" in str(p.get("description") or "").lower() else "Onsite")
            logo = (p.get("hiringOrganization") or {}).get("logo") or ""
            return {
                "job_id": make_job_id("KitaLulus", clean_u),
                "job_title": title,
                "company_name": company,
                "job_category": map_10_categories(title, p.get("occupationalCategory") or ""),
                "work_salaryperhour": sal_hr,
                "work_job_location": fl,
                "work_hours": hrs,
                "work_system": ws,
                "work_required_skills": sk if isinstance(sk, str) and sk.strip() else None,
                "source_portal": "KitaLulus",
                "url": clean_u,
                "date_posted": dp.date().isoformat(),
                "_sort_date": dp.date().isoformat(),
                "_logo": logo,
            }, None
        except Exception:
            return None, "error"

    rows, rejected = [], Counter()
    with ThreadPoolExecutor(max_workers=12) as ex:
        for row, err in ex.map(worker, sorted(urls)):
            if row:
                rows.append(row)
            else:
                rejected[err] += 1
    print(f"[3/4 KitaLulus] Verified {len(rows)} / {len(urls)} (rejected={dict(rejected)})", flush=True)
    return rows


# --- 4. KALIBRR ---
def scrape_kalibrr_verified(now):
    s = make_session()
    kal_jobs = []
    for off in range(0, 500, 100):
        try:
            r = s.get(f"https://www.kalibrr.com/api/job_board/search?tenure=Part%20time&country=Indonesia&limit=100&offset={off}", timeout=15)
            batch = r.json().get("jobs", []) if r.status_code == 200 else []
            if not batch:
                break
            kal_jobs.extend(batch)
        except Exception:
            break

    jabo_cands = []
    for j in kal_jobs:
        ac = (j.get("google_location") or {}).get("address_components") or {}
        fl = f"{ac.get('city', '')} {ac.get('region', '')}".strip()
        if is_jabo_text(fl):
            jabo_cands.append((j, fl))
    print(f"[4/4 Kalibrr] Discovered {len(kal_jobs)} Part-time ({len(jabo_cands)} Jabodetabek)...", flush=True)

    def worker(item):
        j, fl = item
        jid = j.get("id")
        comp = j.get("company") or {}
        url = f"https://www.kalibrr.com/c/{comp.get('code', 'company')}/jobs/{jid}/{j.get('slug', 'job')}"
        sk_s = make_session()
        try:
            r = sk_s.get(f"https://www.kalibrr.com/api/jobs/{jid}", timeout=10)
            kd = r.json() if r.status_code == 200 else j
        except Exception:
            kd = j
        if str(kd.get("tenure") or j.get("tenure")) != "Part time":
            return None, "not_part_time"
        if kd.get("is_draft") or kd.get("visibility") == "private":
            return None, "closed"
        end_d = parse_date(kd.get("application_end_date") or j.get("application_end_date"))
        if end_d and end_d < now:
            return None, "expired"
        dp = parse_date(kd.get("created_at") or j.get("created_at"))
        ua = parse_date(kd.get("activation_date") or j.get("activation_date"))
        if not is_recent(dp, ua, now):
            return None, "stale"
        title = str(kd.get("name") or j.get("name") or "").strip()
        if not title or title_has_non_jabo_placement(title):
            return None, "title_invalid"
        sal_hr = None
        if kd.get("base_salary") or kd.get("maximum_salary"):
            sal_hr = salary_to_hourly(kd.get("base_salary"), kd.get("maximum_salary"), kd.get("salary_interval") or "MONTH", kd.get("salary_currency") or "IDR")
        hrs = extract_hours_from_text((kd.get("description") or "") + " " + (kd.get("qualifications") or ""))
        sk = ", ".join(x.get("name", "") for x in (kd.get("job_sds_skills") or j.get("job_sds_skills") or []) if isinstance(x, dict) and x.get("name"))
        ws = "Remote" if kd.get("is_work_from_home") else ("Hybrid" if kd.get("is_hybrid") else "Onsite")
        sort_dt = max(d for d in (dp, ua) if d is not None).date().isoformat()
        return {
            "job_id": make_job_id("Kalibrr", url),
            "job_title": title,
            "company_name": str(comp.get("name") or j.get("company_name") or "").strip(),
            "job_category": map_10_categories(title, kd.get("function") or j.get("function") or ""),
            "work_salaryperhour": sal_hr,
            "work_job_location": fl,
            "work_hours": hrs,
            "work_system": ws,
            "work_required_skills": sk or None,
            "source_portal": "Kalibrr",
            "url": url,
            "date_posted": dp.date().isoformat() if dp else sort_dt,
            "_sort_date": sort_dt,
            "_logo": comp.get("logo") or "",
        }, None

    rows, rejected = [], Counter()
    with ThreadPoolExecutor(max_workers=10) as ex:
        for row, err in ex.map(worker, jabo_cands):
            if row:
                rows.append(row)
            else:
                rejected[err] += 1
    print(f"[4/4 Kalibrr] Verified {len(rows)} / {len(jabo_cands)} (rejected={dict(rejected)})", flush=True)
    return rows


def balanced_select(rows, target, portal_priority=("KitaLulus", "Loker.id", "Kalibrr", "Glints")):
    """Round-robin across all 10 categories, prioritizing newest & minority portals first."""
    portal_rank = {p: i for i, p in enumerate(portal_priority)}
    groups = defaultdict(deque)
    sorted_rows = sorted(
        rows,
        key=lambda r: (r.get("_sort_date", r["date_posted"]), -portal_rank.get(r["source_portal"], 99)),
        reverse=True,
    )
    # Interleave so minority portals aren't pushed out within large categories
    for r in sorted_rows:
        groups[r["job_category"]].append(r)

    selected = []
    cats = [c for c in CATEGORIES_10 if c in groups]
    while cats and len(selected) < target:
        next_cats = []
        for c in cats:
            if groups[c]:
                selected.append(groups[c].popleft())
                if len(selected) == target:
                    break
            if groups[c]:
                next_cats.append(c)
        cats = next_cats
    return selected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", type=int, default=1000)
    parser.add_argument("--raw-out", type=Path, default=DEFAULT_RAW_OUT)
    parser.add_argument("--clean-out", type=Path, default=DEFAULT_CLEAN_OUT)
    parser.add_argument("--matrix-out", type=Path, default=DEFAULT_MATRIX_OUT)
    parser.add_argument("--tfidf-out", type=Path, default=DEFAULT_TFIDF_OUT)
    parser.add_argument("--from-raw", action="store_true", help="Skip scraping and re-run cleaning from existing --raw-out")
    args = parser.parse_args()

    now = datetime.now(JAKARTA)
    print("=" * 75)
    print(f" POPULATE {args.target} JOBS (LIVE SCRAPE + PHASE 3 CLEANING) @ {now.isoformat()}")
    print("=" * 75)

    logo_map = {}
    if args.clean_out.exists():
        try:
            prev = pd.read_csv(args.clean_out, usecols=["job_id", "company_logo"])
            logo_map.update({r["job_id"]: str(r["company_logo"]) for _, r in prev.dropna(subset=["company_logo"]).iterrows() if str(r["company_logo"]).strip()})
        except Exception:
            pass

    if args.from_raw:
        df_raw_export = pd.read_csv(args.raw_out)
        sort_map = {r["job_id"]: str(r["date_posted"]) for _, r in df_raw_export.iterrows()}
        print(f"Loaded existing RAW ({len(df_raw_export)} rows) from '{args.raw_out}'")
    else:
        g_cands = discover_glints()
        g_rows = verify_glints(g_cands, now)
        l_rows = scrape_loker_verified(now)
        kl_rows = scrape_kitalulus_verified(now)
        k_rows = scrape_kalibrr_verified(now)

        all_rows = g_rows + l_rows + kl_rows + k_rows
        print(f"\nTotal verified scraped (all categories): {len(all_rows)}")
        print("  Raw Portal distribution:", dict(Counter(r["source_portal"] for r in all_rows)))
        print("  Raw Category distribution:", dict(Counter(r["job_category"] for r in all_rows)))

        raw_cols = [
            "job_id", "job_title", "company_name", "job_category",
            "work_salaryperhour", "work_job_location", "work_hours",
            "work_system", "work_required_skills", "source_portal", "url", "date_posted",
        ]
        df_raw = pd.DataFrame(all_rows)
        logo_map.update({r["job_id"]: r.get("_logo", "") for r in all_rows if r.get("_logo")})
        sort_map = {r["job_id"]: r.get("_sort_date", r["date_posted"]) for r in all_rows}

        df_raw_export = df_raw[raw_cols].copy()
        args.raw_out.parent.mkdir(parents=True, exist_ok=True)
        df_raw_export.to_csv(args.raw_out, index=False)
        print(f"\n-> [OK] Saved RAW ({len(df_raw_export)} rows) -> '{args.raw_out}'")

    # --- Run Phase 3 Cleaning Pipeline (without overwriting existing CSVs) ---
    for col in ("work_salaryperhour", "work_hours"):
        df_raw_export[col] = pd.to_numeric(df_raw_export[col], errors="coerce")

    curr_df, funnel_log = apply_6_layer_filtering(df_raw_export)
    print_funnel_summary(funnel_log)

    before_cat = len(curr_df)
    curr_df = curr_df[curr_df["job_category"].isin(CATEGORIES_10)].copy()
    print(f"-> Filter 10 Kategori (buang Uncategorized): {before_cat} -> {len(curr_df)} (dibuang {before_cat - len(curr_df)})")

    # Balance up to --target across all 10 categories
    if len(curr_df) > args.target:
        records = curr_df.to_dict("records")
        for r in records:
            r["_sort_date"] = sort_map.get(r["job_id"], r["date_posted"])
        balanced = balanced_select(records, args.target)
        curr_df = pd.DataFrame(balanced).drop(columns=["_sort_date"], errors="ignore")
        print(f"-> Balanced sampling to target={args.target}: {len(curr_df)} rows")

    # Imputation, Standardization, Encoding, NLP TF-IDF
    curr_df = impute_job_missing_values(curr_df)
    df_stud = pd.read_csv(RAW_MOCK_STUDENTS_PATH)
    df_stud_clean = clean_student_missing_values(df_stud)
    curr_df, df_stud_final = standardize_and_cap(curr_df, df_stud_clean)

    curr_df["company_logo"] = curr_df["job_id"].map(logo_map).fillna("")
    curr_df = encode_work_system(curr_df)
    curr_df, sample_student = compute_skill_similarity(curr_df, df_stud_final, artifact_dir=None)

    # Export TF-IDF artifact to 1000_ path only (never touch web/public/data)
    vec = TfidfVectorizer()
    vec.fit(curr_df["clean_required_skills"].tolist())
    export_tfidf_artifact(vec, args.tfidf_out)

    clean_export = build_clean_jobs_export(curr_df)
    args.clean_out.parent.mkdir(parents=True, exist_ok=True)
    clean_export.to_csv(args.clean_out, index=False)

    matrix = build_decision_matrix(curr_df, sample_student)
    args.matrix_out.parent.mkdir(parents=True, exist_ok=True)
    matrix.to_csv(args.matrix_out, index=False)

    print("\n" + "=" * 75)
    print(f" DONE! RAW={len(df_raw_export)} -> CLEAN={len(clean_export)}")
    print(f" Clean Portals   : {clean_export['source_portal'].value_counts().to_dict()}")
    print(f" Clean Categories: {clean_export['job_category'].value_counts().to_dict()}")
    print(f" Clean Locations : {clean_export['work_job_location'].value_counts().to_dict()}")
    print(f" Salary nulls={clean_export['work_salaryperhour'].isna().sum()}, min={clean_export['work_salaryperhour'].min()}, max={clean_export['work_salaryperhour'].max()}")
    print(f" Hours  nulls={clean_export['work_hours'].isna().sum()}, min={clean_export['work_hours'].min()}, max={clean_export['work_hours'].max()}")
    print("=" * 75)


if __name__ == "__main__":
    main()
