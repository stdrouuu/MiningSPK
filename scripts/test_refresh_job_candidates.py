import json
import unittest
from datetime import datetime

from scripts.refresh_job_candidates import JAKARTA, balanced_sample, parse_posting


class JobRefreshTests(unittest.TestCase):
    def test_detail_validation(self):
        now = datetime(2026, 11, 25, 12, tzinfo=JAKARTA)
        job = {
            "@type": "JobPosting", "title": "Frontend Developer",
            "employmentType": "PART_TIME", "datePosted": "2026-11-21",
            "validThrough": "2026-11-25",
            "hiringOrganization": {"name": "Example"},
            "jobLocation": {"address": {"addressLocality": "Jakarta Barat"}},
            "baseSalary": {"currency": "IDR", "value": {"unitText": "MONTH", "value": 3000000}},
        }

        def parse(overrides=None, markup=""):
            payload = json.dumps({"@graph": [{**job, **(overrides or {})}]})
            html = f'<main>{markup}</main><script type="application/ld+json">{payload}</script>'
            return parse_posting(html, now, 30)

        row, failure = parse()
        self.assertIsNone(failure)
        self.assertEqual(row["job_category"], "IT & Software")
        self.assertIsNone(row["work_salaryperhour"])
        self.assertIsNone(row["work_hours"])
        for overrides, markup, expected in [
            ({}, "<p>Lowongan ini sudah ditutup</p>", "closed"),
            ({"validThrough": "2026-11-24"}, "", "expired"),
            ({"validThrough": None}, "", "application_unverified"),
            ({"employmentType": "FULL_TIME"}, "", "part_time_unverified"),
            ({"datePosted": "2026-09-25"}, "", "date_unverified_or_stale"),
            ({"jobLocation": {"address": {"addressLocality": "Bandung"}}}, "", "location_unverified_or_out_of_area"),
        ]:
            with self.subTest(expected=expected):
                self.assertEqual(parse(overrides, markup), (None, expected))

    def test_sampling_prioritizes_category_coverage_and_recency(self):
        def posting(category, day):
            return {"job_category": category, "date_posted": f"2026-11-{day:02d}"}

        older_it, recent_it = posting("IT & Software", 2), posting("IT & Software", 4)
        tutor = posting("Education & Tutoring", 5)
        courier = posting("Logistics & Delivery", 3)
        unknown = posting("Uncategorized", 6)
        self.assertEqual(
            balanced_sample([older_it, recent_it, tutor, courier, unknown], 3),
            [tutor, recent_it, courier],
        )
