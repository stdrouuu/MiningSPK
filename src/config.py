"""Konfigurasi terpusat pipeline data preparation (satu-satunya sumber konstanta & path)."""

from pathlib import Path

# Root proyek = folder yang memuat src/, data/, scripts/, notebooks/, docs/
PROJECT_ROOT = Path(__file__).resolve().parents[1]

# --- Lokasi dataset (layout final, lihat docs/PLAN_CRISPDM_FASE_4_6.md) ---
RAW_JOBS_PATH = PROJECT_ROOT / "data" / "raw" / "raw-jobs" / "raw_job_postings.csv"
RAW_MOCK_STUDENTS_PATH = PROJECT_ROOT / "data" / "raw" / "raw-mock-students" / "raw_student_preferences.csv"
RAW_REAL_STUDENTS_PATH = PROJECT_ROOT / "data" / "raw" / "raw-real-students" / "raw_real_student_preferences.csv"
GFORM_EXPORT_PATH = PROJECT_ROOT / "data" / "raw" / "raw-real-students" / "Survei_GformResponses_1.csv"

# Kompatibilitas: path lama = mock (perilaku pipeline tidak berubah bila tanpa argumen)
RAW_STUDENTS_PATH = RAW_MOCK_STUDENTS_PATH

CLEAN_JOBS_PATH = PROJECT_ROOT / "data" / "processed" / "cleaned-jobs" / "clean_jobs_dataset.csv"
CLEAN_MOCK_STUDENTS_PATH = PROJECT_ROOT / "data" / "processed" / "cleaned-mock-students" / "clean_students_dataset.csv"
CLEAN_REAL_STUDENTS_PATH = PROJECT_ROOT / "data" / "processed" / "cleaned-real-students" / "clean_real_student.csv"
CLEAN_STUDENTS_PATH = CLEAN_MOCK_STUDENTS_PATH

DECISION_MATRIX_PATH = PROJECT_ROOT / "data" / "processed" / "matrix" / "decision_matrix_sample.csv"

# Salinan untuk frontend web (di-serve oleh Vite dari web/public/data/)
WEB_DATA_DIR = PROJECT_ROOT / "web" / "public" / "data"

# --- Aturan filtering 6 lapisan ---
NEGATIVE_KEYWORD_REGEX = (
    r'\bfull[-\s]?time\b|\bpenuh waktu\b|\bpermanent\b|\btetap\b|\bpurna waktu\b|'
    r'\bfreelance\b|\blepas\b|\bproyek lepas\b|\bproject[-\s]?based\b|'
    r'\bsupervisor\b|\bmanager\b|\bmanajer\b|\bdirektur\b|\bdirector\b|\bhead of\b|\blead(?! generating)\b|'
    r'\bintern\b|\binternship\b|\bmagang\b|\bvolunteer\b|\bmanagement trainee\b|\bkontrak tahunan\b'
)

SCAM_KEYWORD_REGEX = (
    r'komisi murni|tanpa gaji pokok|bagi hasil murni|like video|klik iklan|cuan ratusan ribu|investasi klik'
)

VALID_JABO_KEYWORDS = [
    "jakarta", "jakbar", "jaksel", "jakpus", "jaktim", "jakut", "tanjung duren",
    "grogol", "kebon jeruk", "tangerang", "tangsel", "depok", "bekasi", "bogor",
]

NON_JABO_CITIES = [
    "bandung", "surabaya", "semarang", "yogyakarta", "jogja", "bali", "denpasar",
    "medan", "malang", "solo", "surakarta", "kediri", "cirebon", "sukabumi", "sidoarjo",
]

# job_id yang terbukti kedaluwarsa (redirect ke /id/404 saat validasi link)
EXPIRED_JOB_IDS = ["JOB-1006", "JOB-1220"]

# --- Batas logis outlier ---
SALARY_MIN_FILTER = 10000.0      # bawah untuk filter anomali (Lapisan 4)
SALARY_MAX_FILTER = 200000.0     # atas untuk filter anomali (Lapisan 4)
SALARY_CLIP_LOWER = 10000.0      # capping akhir (Section 3.2)
SALARY_CLIP_UPPER = 150000.0     # capping akhir (Section 3.2)
MAX_STUDENT_HOURS = 30.0         # batas jam kerja mahasiswa/minggu

# --- Imputasi ---
DEFAULT_SKILLS_TEXT = "Komunikasi, Time Management"
DEFAULT_WORK_SYSTEM = "Onsite"

# --- Batas modeling SPK (Fase 4) ---
C2_RATIO_CAP = 2.0            # cap rasio gaji sebelum normalisasi (G4)
MIN_SALARY_PER_HOUR = 15000.0 # floor gaji/jam mahasiswa (samakan KuesionerPage.perJam)
MAX_SALARY_PER_HOUR = 60000.0 # ceiling gaji/jam mahasiswa (samakan KuesionerPage.perJam)
MIN_STUDENT_HOURS = 8.0       # floor jam/minggu (samakan KuesionerPage.jamIdealPerMinggu)

# --- Encoding sistem kerja ---
SYSTEM_MAPPING = {"Remote": 1, "Hybrid": 2, "Onsite": 3}
