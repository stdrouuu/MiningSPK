"""Enrich clean_jobs_dataset.csv with original company logos.

Each source posting page (Glints) embeds a JSON-LD JobPosting block whose
hiringOrganization object carries the real company logo URL, e.g.
  "hiringOrganization": {"name": "...", "logo": "https://images.glints.com/...png"}
This script fetches every job URL, extracts that logo, and stores it in a new
company_logo column. Run once, then the portal serves logos from data.
"""
import csv
import json
import re
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = r"C:\Users\ASUS\Desktop\phase-3"
SRC = ROOT + r"\clean_jobs_dataset.csv"
WEB_COPY = ROOT + r"\web\public\data\clean_jobs_dataset.csv"

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) upmatch-spk/1.0"}
JSONLD_RE = re.compile(
    r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
    re.DOTALL | re.IGNORECASE,
)
OGIMAGE_RE = re.compile(
    r'<meta[^>]*property="og:image"[^>]*content="([^"]+)"', re.IGNORECASE
)


def extract_logo(page_url):
    """Return (logo_url, same_as) from the page JSON-LD, or (None, None)."""
    try:
        req = urllib.request.Request(page_url, headers=UA)
        with urllib.request.urlopen(req, timeout=25) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
    except Exception as exc:
        return None, f"fetch_error: {exc}"
    for block in JSONLD_RE.findall(html):
        try:
            data = json.loads(block.strip())
        except Exception:
            continue
        items = data if isinstance(data, list) else [data]
        for item in items:
            if not isinstance(item, dict):
                continue
            org = item.get("hiringOrganization")
            if isinstance(org, dict) and org.get("logo"):
                return org["logo"], org.get("sameAs")
    # Fallback: og:image (loker.id and kalibrr expose the company logo there)
    m = OGIMAGE_RE.search(html)
    if m and "logo" in m.group(1).lower():
        return m.group(1), None
    if m:
        return None, f"og_image_not_logo: {m.group(1)[:80]}"
    return None, "no_logo_in_jsonld"


def main():
    with open(SRC, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    print(f"rows: {len(rows)}")

    urls = [r["url"] for r in rows if r.get("url")]
    # Retry mode: only refetch rows still missing a logo, one worker, slow.
    retry_only = len(sys.argv) > 1 and sys.argv[1] == "--retry-missing"
    if retry_only:
        urls = [r["url"] for r in rows if r.get("url") and not r.get("company_logo")]
        print(f"retrying missing only: {len(urls)}")
    print(f"urls to fetch: {len(urls)}")

    results = {}
    ok = 0
    workers = 1 if retry_only else 8
    with ThreadPoolExecutor(max_workers=workers) as pool:
        for url, (logo, note) in zip(urls, pool.map(extract_logo, urls)):
            results[url] = logo or ""
            if logo:
                ok += 1
            else:
                print(f"  MISS {url} [{note}]")
            time.sleep(2.0 if retry_only else 0.05)
    print(f"logos found: {ok}/{len(urls)}")

    for r in rows:
        if r.get("url", "") in results:
            if results[r["url"]] or not r.get("company_logo"):
                r["company_logo"] = results[r["url"]]
        elif "company_logo" not in r:
            r["company_logo"] = ""

    fieldnames = list(rows[0].keys())
    if "company_logo" not in fieldnames:
        fieldnames.append("company_logo")
    for path in (SRC, WEB_COPY):
        with open(path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            w.writerows(rows)
        print(f"wrote {path}")


if __name__ == "__main__":
    sys.exit(main())
