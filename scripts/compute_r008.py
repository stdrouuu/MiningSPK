import sys
from pathlib import Path
import pandas as pd, numpy as np
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))
from src.config import C2_RATIO_CAP
from src.nlp import clean_text_nlp
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json

JOBS = PROJECT_ROOT/"data"/"processed"/"cleaned-jobs"/"clean_jobs_dataset.csv"
STUD = PROJECT_ROOT/"data"/"processed"/"cleaned-real-students"/"clean_real_student.csv"
df_jobs = pd.read_csv(JOBS)
df_stud = pd.read_csv(STUD)
stud = df_stud[df_stud.student_id=="MHS-R008"].iloc[0].to_dict()
print("STUD:", stud)

# C1-C4
C1_MATCH=1.0; C1_NOM=0.3
c1 = np.where(df_jobs["job_category"]==stud["student_job_category"], C1_MATCH, C1_NOM)
c2 = np.clip(df_jobs["work_salaryperhour"]/stud["min_expected_salary"], 0, C2_RATIO_CAP).astype(float)
jl = df_jobs["work_job_location"].str.lower(); sl=str(stud["student_location_clean"]).lower(); sysc=df_jobs["work_system"].str.lower()
c3 = np.where((sysc=="remote")|(jl==sl), 1.0, np.where(jl.str.contains("jakarta") & pd.Series([("jakarta" in sl)]*len(df_jobs), index=df_jobs.index), 0.8, 0.4))
# geo: Tangerang Selatan student -> Jakarta jobs get 0.4, Tangerang jobs? jl==sl? need exact: Tangerang vs Tangerang Selatan -> not equal, not jakarta -> 0.4. Remote=1.0
c4 = np.clip(1.0-(df_jobs["work_hours"]-stud["student_expected_work_hour"]).abs()/20.0, 0, 1.0).astype(float)

# C5 via TFIDF fitted on jobs only (like pipeline)
job_texts = df_jobs["clean_required_skills"].fillna("").tolist()
stud_texts = df_stud["clean_student_skills"].fillna("").tolist()
# fit on jobs only
vec = TfidfVectorizer()
jm = vec.fit_transform(job_texts)
# transform student R008
idx = df_stud[df_stud.student_id=="MHS-R008"].index[0]
# need position in stud_texts order
s_pos = df_stud.reset_index().query("student_id=='MHS-R008'").index
# simpler: transform single
sm = vec.transform([df_stud.loc[df_stud.student_id=="MHS-R008","clean_student_skills"].iloc[0]])
c5_all = cosine_similarity(sm, jm)[0]
print("c5 stats", c5_all.min(), c5_all.max(), c5_all.mean())

mat = np.column_stack([c1,c2,c3,c4,c5_all])
mins = mat.min(0); maxs = mat.max(0)
print("MIN", mins)
print("MAX", maxs)

def roc_ties(ranks):
    keys = sorted(ranks, key=lambda k: ranks[k])
    out, pos, i = {}, 1, 0
    while i < len(keys):
        j=i
        while j+1<len(keys) and ranks[keys[j+1]]==ranks[keys[i]]:
            j+=1
        group=keys[i:j+1]
        w=np.mean([sum(1/k for k in range(p,6))/5 for p in range(pos,pos+len(group))])
        for k in group: out[k]=w
        pos+=len(group); i=j+1
    return out

# two rank scenarios: spreadsheet default C1>C2>C3>C4>C5 and old default C2>C4>C3>C1>C5
for name, ranks in [
    ("R008-spreadsheet C1>C2>C3>C4>C5", {"C1":1,"C2":2,"C3":3,"C4":4,"C5":5}),
    ("old-default C2>C4>C3>C1>C5", {"C1":4,"C2":1,"C3":3,"C4":2,"C5":5}),
]:
    w = roc_ties(ranks)
    print(name, w)
    u = np.where(maxs==mins, 1.0, (mat-mins)/np.where(maxs==mins,1,maxs-mins))
    wv = np.array([w["C1"],w["C2"],w["C3"],w["C4"],w["C5"]])
    score = u @ wv
    order = sorted(range(len(score)), key=lambda i: (-round(float(score[i]),4), -round(float(c2[i]),4), -round(float(c5_all[i]),4), str(df_jobs.iloc[i]["job_id"])))
    print(f"--- top15 {name} ---")
    for r, i in enumerate(order[:15],1):
        j = df_jobs.iloc[i]
        print(f"{r} {j['job_id']} {j['job_title'][:45]!r} C1={c1[i]:.1f} C2={c2[i]:.4f} C3={c3[i]:.1f} C4={c4[i]:.4f} C5={c5_all[i]:.4f} | u={[round(float(x),4) for x in u[i]]} U={score[i]:.4f}")
    print(f"mean U={score.mean():.4f} min={score.min():.4f} max={score.max():.4f}")
    # save top for report
    import json as js
    Path(f"docs/assets_laporan/top15_{name.split()[0]}.json").write_text("x", encoding="utf-8")
