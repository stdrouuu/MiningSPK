"""6 lapisan rule-based filtering data mentah (Section 2.3)."""

from src.config import (
    EXPIRED_JOB_IDS,
    NEGATIVE_KEYWORD_REGEX,
    NON_JABO_CITIES,
    SALARY_MAX_FILTER,
    SALARY_MIN_FILTER,
    SCAM_KEYWORD_REGEX,
    VALID_JABO_KEYWORDS,
    MAX_STUDENT_HOURS,
)


def apply_6_layer_filtering(df_raw):
    """Jalankan 6 lapisan filtering. Return (df_bersih, funnel_log)."""
    funnel_log = []

    curr_df = df_raw.copy()
    funnel_log.append(("1. Total Data Mentah Awal", len(curr_df), 0))

    # Lapisan 1: Deduplikasi Data
    before_dedup = len(curr_df)
    curr_df = curr_df.drop_duplicates(subset=["job_id"])
    curr_df = curr_df.drop_duplicates(subset=["url"])
    curr_df["temp_title_norm"] = curr_df["job_title"].astype(str).str.lower().str.strip()
    curr_df["temp_comp_norm"] = curr_df["company_name"].astype(str).str.lower().str.strip()
    curr_df["temp_loc_norm"] = curr_df["work_job_location"].astype(str).str.lower().str.strip()
    curr_df = curr_df.drop_duplicates(subset=["temp_title_norm", "temp_comp_norm", "temp_loc_norm"])
    curr_df = curr_df.drop(columns=["temp_title_norm", "temp_comp_norm", "temp_loc_norm"])
    funnel_log.append(("2. Pasca Deduplikasi (Exact & Cross-Platform)", len(curr_df), before_dedup - len(curr_df)))

    # Lapisan 2: Negative Keyword Filtering (Pure Part-Time)
    before_neg = len(curr_df)
    curr_df = curr_df[~curr_df["job_title"].astype(str).str.contains(NEGATIVE_KEYWORD_REGEX, case=False, na=False)]
    funnel_log.append(("3. Pasca Filter Kata Kunci Negatif (Non-Part-Time)", len(curr_df), before_neg - len(curr_df)))

    # Lapisan 3: Student Feasibility Filtering (Jam Kerja <= 30 jam)
    before_feas = len(curr_df)
    curr_df = curr_df[curr_df["work_hours"].isna() | (curr_df["work_hours"] <= MAX_STUDENT_HOURS)]
    funnel_log.append(("4. Pasca Filter Kelayakan Beban Mahasiswa (Jam <= 30)", len(curr_df), before_feas - len(curr_df)))

    # Lapisan 4: Salary Anomaly & Anti-Scam Filtering
    before_salary = len(curr_df)
    curr_df = curr_df[curr_df["work_salaryperhour"].isna() |
                      ((curr_df["work_salaryperhour"] >= SALARY_MIN_FILTER) &
                       (curr_df["work_salaryperhour"] <= SALARY_MAX_FILTER))]
    curr_df = curr_df[~curr_df["work_required_skills"].astype(str).str.contains(SCAM_KEYWORD_REGEX, case=False, na=False)]
    curr_df = curr_df[~curr_df["job_title"].astype(str).str.contains(SCAM_KEYWORD_REGEX, case=False, na=False)]
    funnel_log.append(("5. Pasca Filter Anomali Gaji & Anti-Scam", len(curr_df), before_salary - len(curr_df)))

    # Lapisan 5: Geographic & Locality Filtering
    before_geo = len(curr_df)
    is_remote = curr_df["work_system"].astype(str).str.lower().str.strip() == "remote"
    loc_lower = curr_df["work_job_location"].astype(str).str.lower()
    is_jabo = loc_lower.apply(lambda x: any(k in x for k in VALID_JABO_KEYWORDS))
    is_non_jabo = loc_lower.apply(lambda x: any(k in x for k in NON_JABO_CITIES))
    curr_df = curr_df[(is_jabo & ~is_non_jabo) | (is_remote & ~is_non_jabo) | (is_remote & is_jabo)]
    funnel_log.append(("6. Pasca Filter Geografis (Jabodetabek / Remote)", len(curr_df), before_geo - len(curr_df)))

    # Lapisan 6: Completeness & Live Link Sanity Check
    before_comp = len(curr_df)
    curr_df = curr_df[curr_df["job_title"].notna() & (curr_df["job_title"].astype(str).str.strip() != "")]
    curr_df = curr_df[curr_df["url"].notna() & (curr_df["url"].astype(str).str.strip() != "")]
    curr_df = curr_df[~curr_df["job_id"].isin(EXPIRED_JOB_IDS)]
    funnel_log.append(("7. Pasca Filter Kelengkapan Data Esensial & Validasi Link", len(curr_df), before_comp - len(curr_df)))

    return curr_df, funnel_log


def print_funnel_summary(funnel_log):
    print("\n--- RINGKASAN CORONG FILTERING (DATA FUNNEL SUMMARY) ---")
    print(f"{'Tahapan Filter':<50} | {'Sisa Baris':<10} | {'Tereduksi':<10}")
    print("-" * 75)
    for stage, rem, drop in funnel_log:
        print(f"{stage:<50} | {rem:<10} | {drop:<10}")
    print("-" * 75)
