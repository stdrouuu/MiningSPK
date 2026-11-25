import unittest

from scripts.generate_raw_data import map_10_categories


class JobCategoryTests(unittest.TestCase):
    def test_role_matching(self):
        cases = [
            ("Branch Sales Executive", "Education", "Marketing & Sales"),
            ("Mandarin Translator", "Education", "Content & Media"),
            ("Coding Instructor", "IT", "Education & Tutoring"),
            ("English Teachers", "", "Education & Tutoring"),
            ("Tutor Les Privat", "", "Education & Tutoring"),
            ("Kurir Motor", "Education", "Logistics & Delivery"),
            ("Café Crew", "", "Food & Beverage (F&B)"),
            ("Asisten Kepala Toko", "", "Retail & Store Operations"),
            ("Staff", "Logistics", "Logistics & Delivery"),
            ("Dokter Umum", "", "Uncategorized"),
            ("Staff", "", "Uncategorized"),
        ]
        for title, portal_category, expected in cases:
            with self.subTest(title=title, portal_category=portal_category):
                self.assertEqual(map_10_categories(title, portal_category), expected)
