"""Evaluasi SPK Fase 4-5: stabilitas ranking, eksperimen n-gram, sensitivitas C1/C3.

Membaca data/processed (jobs + mock/real students), menghitung ulang SPK penuh
per mahasiswa memakai spesifikasi yang SAMA dengan web (C2 cap, ROC ties,
normalisasi full-set, tie-breaker) lalu melaporkan:
  1. Stabilitas top-5/top-10 antar 5 skenario leader (seperti sensitivity.ts).
  2. Eksperimen ngram (1,1) vs (1,2) untuk C5: overlap top-10.
  3. Sensitivitas C1 non-match {0.2,0.3,0.5}: berapa top-5 berubah.

Jalankan dari root:  python scripts/eval_spk.py [--source real|mock]
"""

import argparse
import sys
from itertools import combinations
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from src.config import C2_RATIO_CAP
from src.nlp import clean_text_nlp

JOBS = PROJECT_ROOT / "data" / "processed" / "cleaned-jobs" / "clean_jobs_dataset.csv"
STUDENTS = {
    "mock": PROJECT_ROOT / "data" / "processed" / "cleaned-mock-students" / "clean_students_dataset.csv",
    "real": PROJECT_ROOT / "data" / "processed" / "cleaned-real-students" / "clean_real_student.csv",
}

C1_MATCH, C3_LEVELS = 1.0, (1.0, 0.8, 0.4)


def roc_ties(ranks):
    """Bobot ROC dengan ties (mirror weightsWithTies di roc.ts)."""
    keys = sorted(ranks, key=lambda k: ranks[k])
    out, pos, i = {}, 1, 0
    while i < len(keys):
        j = i
        while j + 1 < len(keys) and ranks[keys[j + 1]] == ranks[keys[i]]:
            j += 1
        group = keys[i:j + 1]
        w = np.mean([sum(1 / k for k in range(p, 6)) / 5 for p in range(pos, pos + len(group))])
        for k in group:
            out[k] = w
        pos += len(group)
        i = j + 1
    return out


def c1_c4(df_jobs, stud, c1_nomatch=0.3):
    c1 = np.where(df_jobs["job_category"] == stud["student_job_category"], C1_MATCH, c1_nomatch)
    c2 = np.clip(df_jobs["work_salaryperhour"] / stud["min_expected_salary"], 0, C2_RATIO_CAP)
    jl, sl = df_jobs["work_job_location"].str.lower(), str(stud["student_location_clean"]).lower()
    sys = df_jobs["work_system"].str.lower()
    c3 = np.where((sys == "remote") | (jl == sl), C3_LEVELS[0],
                  np.where(jl.str.contains("jakarta") & pd.Series([("jakarta" in sl)] * len(df_jobs), index=df_jobs.index),
                           C3_LEVELS[1], C3_LEVELS[2]))
    c4 = np.clip(1.0 - (df_jobs["work_hours"] - stud["student_expected_work_hour"]).abs() / 20.0, 0, 1.0)
    return np.asarray(c1, dtype=float), np.asarray(c2, dtype=float), np.asarray(c3, dtype=float), np.asarray(c4, dtype=float)


def tfidf_c5(job_texts, stud_texts, ngram=(1, 1)):
    vec = TfidfVectorizer(ngram_range=ngram)
    jm = vec.fit_transform(job_texts)
    sm = vec.transform(stud_texts)
    return cosine_similarity(sm, jm)


def rank_all(c1, c2, c3, c4, c5, weights, job_ids):
    mat = np.column_stack([c1, c2, c3, c4, c5])
    mins, maxs = mat.min(0), mat.max(0)
    u = np.where(maxs == mins, 1.0, (mat - mins) / np.where(maxs == mins, 1, maxs - mins))
    w = np.array([weights["C1"], weights["C2"], weights["C3"], weights["C4"], weights["C5"]])
    score = u @ w
    order = sorted(range(len(score)),
                   key=lambda i: (-round(float(score[i]), 4), -round(float(c2[i]), 4),
                                  -round(float(c5[i]), 4), str(job_ids[i])))
    return [job_ids[i] for i in order], score


def overlap(a, b, k):
    return len(set(a[:k]) & set(b[:k])) / k


def main(source):
    df_jobs = pd.read_csv(JOBS)
    df_stud = pd.read_csv(STUDENTS[source])
    job_ids = df_jobs["job_id"].tolist()
    job_texts = df_jobs["clean_required_skills"].fillna("").tolist()
    stud_texts = df_stud["clean_student_skills"].fillna("").tolist()
    print(f"[EVAL] {len(df_jobs)} jobs x {len(df_stud)} students ({source})")

    base_ranks = {"C1": 3, "C2": 1, "C3": 2, "C4": 4, "C5": 5}  # default survei Fase 2
    w_base = roc_ties(base_ranks)
    c5_uni = tfidf_c5(job_texts, stud_texts, (1, 1))
    c5_bi = tfidf_c5(job_texts, stud_texts, (1, 2))

    leaders = ["C1", "C2", "C3", "C4", "C5"]
    stab5, stab10, ng10, sens, stable_winner = [], [], [], [], 0
    for s, stud in enumerate(df_stud.itertuples()):
        c1, c2, c3, c4 = c1_c4(df_jobs, stud._asdict())
        ranked_base, _ = rank_all(c1, c2, c3, c4, c5_uni[s], w_base, job_ids)
        # 1. stabilitas: 5 skenario leader
        tops5, tops10 = [], []
        for lead in leaders:
            rest = sorted([k for k in leaders if k != lead], key=lambda k: base_ranks[k])
            lr = {lead: 1}
            for i, k in enumerate(rest):
                lr[k] = i + 2
            r, _ = rank_all(c1, c2, c3, c4, c5_uni[s], roc_ties(lr), job_ids)
            tops5.append(r[:5])
            tops10.append(r[:10])
        stab5.append(np.mean([overlap(a, b, 5) for a, b in combinations(tops5, 2)]))
        stab10.append(np.mean([overlap(a, b, 10) for a, b in combinations(tops10, 2)]))
        winners = [t[0] for t in tops5]
        if max(winners.count(w) for w in set(winners)) >= 3:
            stable_winner += 1
        # 2. n-gram
        r_bi, _ = rank_all(c1, c2, c3, c4, c5_bi[s], w_base, job_ids)
        ng10.append(overlap(ranked_base, r_bi, 10))
        # 3. sensitivitas C1
        alt = []
        for nm in (0.2, 0.5):
            c1a = np.where(df_jobs["job_category"] == stud._asdict()["student_job_category"], C1_MATCH, nm)
            r, _ = rank_all(c1a, c2, c3, c4, c5_uni[s], w_base, job_ids)
            alt.append(overlap(ranked_base, r, 5))
        sens.append(np.mean(alt))

    print(f"Stabilitas top-5 antar skenario : {np.mean(stab5):.3f} (min {np.min(stab5):.3f})")
    print(f"Stabilitas top-10 antar skenario: {np.mean(stab10):.3f}")
    print(f"Overlap top-10 unigram vs (1,2): {np.mean(ng10):.3f}  -> {'SHIP bigram' if np.mean(ng10) < 0.7 else 'tetap unigram'}")
    print(f"Overlap top-5 C1 0.3 vs {{0.2,0.5}}: {np.mean(sens):.3f}")
    print(f"Juara stabil (sama di >=3/5 skenario): {stable_winner}/{len(df_stud)} responden")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", choices=["mock", "real"], default="real")
    main(ap.parse_args().source)
