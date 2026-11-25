"""Collect verified part-time listings into a staged CSV for review."""

import argparse
import csv
import hashlib
import json
import re
from collections import Counter, defaultdict, deque
from datetime import datetime, timedelta
from pathlib import Path
from time import sleep
from urllib.parse import urlsplit, urlunsplit
from zoneinfo import ZoneInfo

import pandas as pd
import requests
from bs4 import BeautifulSoup

from scripts.generate_raw_data import (
    HEADERS,
    map_10_categories,
    scrape_glints,
    scrape_kalibrr,
    scrape_kitalulus,
    scrape_loker_id,
)
from src.config import VALID_JABO_KEYWORDS
from src.filtering import apply_6_layer_filtering


SEARCH_TERMS = (
    "web developer", "kurir motor", "kasir", "customer service", "barista", "admin",
    "graphic designer", "content creator", "sales", "tutor",
    "frontend developer", "delivery driver", "store crew", "it support",
    "backend developer", "warehouse", "software engineer", "qa engineer",
    "programmer", "remote", "",
)
JAKARTA = ZoneInfo("Asia/Jakarta")
CLOSED_TEXT = re.compile(
    r"lowongan (?:ini )?(?:sudah |telah )?(?:ditutup|kedaluwarsa|tidak aktif)"
    r"|(?:job|position) (?:is )?no longer (?:available|accepting applications)"
    r"|lamaran (?:sudah |telah )?ditutup",
    re.IGNORECASE,
)
APPLY_TEXT = re.compile(r"^(?:lamar(?: sekarang| pekerjaan)?|apply(?: now| for this job)?)$", re.I)


def schema_postings(value):
    if isinstance(value, list):
        for item in value:
            yield from schema_postings(item)
    elif isinstance(value, dict):
        types = value.get("@type", [])
        if types == "JobPosting" or isinstance(types, list) and "JobPosting" in types:
            yield value
        yield from schema_postings(value.get("@graph"))


def parse_date(value):
    try:
        date = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return date.replace(tzinfo=JAKARTA) if date.tzinfo is None else date.astimezone(JAKARTA)
    except ValueError:
        return None


def parse_posting(html, now, max_age_days):
    page = BeautifulSoup(html, "html.parser")
    if CLOSED_TEXT.search(page.get_text(" ", strip=True)):
        return None, "closed"
    postings = []
    for element in page.find_all("script", type="application/ld+json"):
        try:
            postings.extend(schema_postings(json.loads(element.get_text())))
        except ValueError:
            continue
    if len(postings) != 1:
        return None, "missing_or_ambiguous_posting"
    posting = postings[0]
    kinds = posting.get("employmentType", [])
    if isinstance(kinds, str):
        kinds = [kinds]
    normalized = {re.sub(r"[\s_-]+", "", str(kind)).casefold() for kind in kinds or []}
    if normalized not in ({"parttime"}, {"paruhwaktu"}):
        return None, "part_time_unverified"

    posted = parse_date(posting.get("datePosted"))
    if not posted or posted.date() > now.date() or now.date() - posted.date() > timedelta(days=max_age_days):
        return None, "date_unverified_or_stale"
    deadline = parse_date(posting.get("validThrough"))
    if deadline and (deadline < now if "T" in str(posting["validThrough"]) else deadline.date() < now.date()):
        return None, "expired"
    has_apply = any(
        APPLY_TEXT.fullmatch(control.get_text(" ", strip=True))
        and not control.has_attr("disabled") and control.get("aria-disabled") != "true"
        for control in page.select("main button, main a[href], article button, article a[href]")
    )
    if not deadline and not has_apply:
        return None, "application_unverified"

    title = str(posting.get("title") or "").strip()
    company = str((posting.get("hiringOrganization") or {}).get("name") or "").strip()
    if not title or not company:
        return None, "missing_title_or_company"
    locations = posting.get("jobLocation") or []
    if isinstance(locations, dict):
        locations = [locations]
    remote = str(posting.get("jobLocationType") or "").upper() == "TELECOMMUTE"
    city = ""
    for location in locations:
        address = location.get("address") or {}
        candidate = str(address.get("addressLocality") or address.get("addressRegion") or "")
        if any(key in candidate.casefold() for key in VALID_JABO_KEYWORDS):
            city = candidate
            break
    if not city and not remote:
        return None, "location_unverified_or_out_of_area"

    salary = posting.get("baseSalary") or {}
    rate = salary.get("value") if isinstance(salary, dict) else None
    hourly = rate.get("minValue", rate.get("value")) if isinstance(rate, dict) and (
        salary.get("currency") == "IDR" and str(rate.get("unitText")).upper() == "HOUR"
    ) else None
    if not isinstance(hourly, (int, float)) or isinstance(hourly, bool):
        hourly = None
    work_hours = re.fullmatch(r"(\d+(?:\.\d+)?)\s*(?:hours?|jam)\s*(?:per|/)\s*(?:week|minggu)", str(posting.get("workHours") or "").strip(), re.I)

    skills = posting.get("skills")
    if isinstance(skills, list):
        skills = ", ".join(value for value in skills if isinstance(value, str))
    if isinstance(skills, str) and "<" in skills:
        skills = BeautifulSoup(skills, "html.parser").get_text(" ", strip=True)
    return {
        "job_title": title,
        "company_name": company,
        "job_category": map_10_categories(title, posting.get("occupationalCategory") or ""),
        "work_salaryperhour": hourly,
        "work_job_location": "Remote" if remote else city,
        "work_hours": float(work_hours[1]) if work_hours else None,
        "work_system": "Remote" if remote else None,
        "work_required_skills": skills if isinstance(skills, str) else None,
        "date_posted": posted.date().isoformat(),
        "checked_at": now.isoformat(),
    }, None


def balanced_sample(rows, target):
    groups = defaultdict(deque)
    for row in sorted(rows, key=lambda job: job["date_posted"], reverse=True):
        groups[row["job_category"]].append(row)
    selected = []
    uncategorized = groups.pop("Uncategorized", deque())
    while groups and len(selected) < target:
        for category in list(groups):
            selected.append(groups[category].popleft())
            if not groups[category]:
                del groups[category]
            if len(selected) == target:
                break
    selected.extend(list(uncategorized)[:target - len(selected)])
    return selected


def collect(session, candidates, now, max_age_days, delay):
    seen = set()
    seen_jobs = set()
    rejected = Counter()
    rows = []
    for candidate in candidates:
        url = urlsplit(candidate["url"])
        home = urlsplit({
            "Glints": "https://glints.com", "Loker.id": "https://www.loker.id",
            "KitaLulus": "https://www.kitalulus.com", "Kalibrr": "https://www.kalibrr.com",
        }[candidate["source"]])
        allowed_host = home.hostname.removeprefix("www.")
        if url.scheme != "https" or (url.hostname or "").removeprefix("www.") != allowed_host:
            rejected["unexpected_url"] += 1
            continue
        url = urlunsplit(url._replace(query="", fragment=""))
        if url in seen:
            continue
        seen.add(url)
        sleep(delay)
        try:
            response = session.get(url, timeout=10, allow_redirects=False)
            if response.status_code != 200:
                rejected[f"http_{response.status_code}"] += 1
                continue
            row, reason = parse_posting(response.text, now, max_age_days)
        except (requests.RequestException, AttributeError, TypeError, KeyError, ValueError):
            rejected["request_or_parse_error"] += 1
            continue
        if row is None:
            rejected[reason] += 1
            continue
        identifier = urlsplit(url).path
        if candidate["source"] == "Glints":
            identifier = identifier.rsplit("/", 1)[-1]
        key = f"{candidate['source']}:{identifier}"
        if key in seen_jobs:
            continue
        seen_jobs.add(key)
        rows.append({
            "job_id": "JOB-" + hashlib.sha256(key.encode()).hexdigest()[:20],
            **row, "source_portal": candidate["source"], "url": url,
        })
    return rows, rejected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", type=int, default=1000)
    parser.add_argument("--pages", type=int, default=3, help="Glints pages per query")
    parser.add_argument("--max-age-days", type=int, default=30)
    parser.add_argument("--output", type=Path, default=Path("data/raw/raw-jobs/refresh_candidates.csv"))
    args = parser.parse_args()
    if min(args.target, args.pages, args.max_age_days) < 1:
        parser.error("Target, pages, and max age must be positive")
    if args.output.exists():
        parser.error(f"Output already exists: {args.output}")
    candidates = scrape_glints(SEARCH_TERMS, args.pages) + scrape_loker_id() + scrape_kitalulus() + scrape_kalibrr()
    with requests.Session() as session:
        session.headers.update(HEADERS)
        rows, rejected = collect(session, candidates, datetime.now(JAKARTA), args.max_age_days, delay=0.5)
    print(f"Verified: {len(rows)} / {len(candidates)} discovered. Rejected: {dict(rejected)}")
    if not rows:
        parser.exit(1, "No verified listings. Dataset unchanged.\n")
    # Filter before balancing so weak or duplicate listings cannot fill category slots.
    rows.sort(key=lambda row: row["date_posted"], reverse=True)
    frame = pd.DataFrame(rows)
    for column in ("work_salaryperhour", "work_hours"):
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    clean, funnel = apply_6_layer_filtering(frame)
    selected = balanced_sample([rows[index] for index in clean.index], args.target)
    print(f"Filtering: {funnel}")
    print(f"Selected: {len(selected)} / {args.target}. Categories: {dict(Counter(r['job_category'] for r in selected))}")
    if not selected:
        parser.exit(1, "No eligible listings. Dataset unchanged.\n")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("x", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, selected[0].keys())
        writer.writeheader()
        writer.writerows(selected)


if __name__ == "__main__":
    main()
