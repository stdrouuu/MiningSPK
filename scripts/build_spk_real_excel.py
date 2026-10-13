"""Build SPK SMARTER Excel BARU dari DATA REAL (bukan mock).
Evaluator : parameter --evaluator (default MHS-R050; mis. MHS-R014 Gaddiel)
Jobs     : 221 lowongan real scraping (clean_jobs_dataset.csv) -> demo 15 + arsip 221
Prioritas BARU (beda dari v4): C1 > C2 > C3 > C4 > C5  (kategori-driven, cocok profil Education/Onsite)
File output: docs/spreadsheet/SPK_SMARTER_REAL_MHS-R050_v1-BARU.xlsx
"""
from pathlib import Path
import argparse
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import CellIsRule, ColorScaleRule
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.chart import BarChart, Reference
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parents[1]
JOBS_P = ROOT / "data" / "processed" / "cleaned-jobs" / "clean_jobs_dataset.csv"
STUD_P = ROOT / "data" / "processed" / "cleaned-real-students" / "clean_real_student.csv"
RAW_P  = ROOT / "data" / "raw" / "raw-real-students" / "raw_real_student_preferences.csv"

def out_path(eval_id):
    return ROOT / "docs" / "spreadsheet" / f"SPK_SMARTER_REAL_{eval_id}_v1-BARU.xlsx"
# Prioritas BARU: C1 rank1, C2 rank2, C3 rank3, C4 rank4, C5 rank5 (beda dari v4 yg C2>C4>C3>C1>C5)
RANKS = {"C1": 1, "C2": 2, "C3": 3, "C4": 4, "C5": 5}
W = {"C1": 0.4567, "C2": 0.2567, "C3": 0.1567, "C4": 0.09, "C5": 0.04}

def pick_demo_order(full):
    """15 demo: 10 top + 2 tengah + 3 bottom, diacak agar RANK bermakna. Deterministik."""
    top10 = full.iloc[0:10]["job_id"].tolist()
    mid2 = full.iloc[100:102]["job_id"].tolist()
    bot3 = full.iloc[-3:]["job_id"].tolist()
    pool_top, pool_mid, pool_bot = top10[:], mid2[:], bot3[:]
    # pola interleave: mid, top, bottom, top, ... (campur agar tidak urut skor)
    order, ti, mi, bi = [], 0, 0, 0
    pattern = ["mid","top","bot","top","mid","top","bot","top","top","top","bot","top","top","top","top"]
    for kind in pattern:
        if kind == "top" and ti < len(pool_top): order.append(pool_top[ti]); ti += 1
        elif kind == "mid" and mi < len(pool_mid): order.append(pool_mid[mi]); mi += 1
        elif kind == "bot" and bi < len(pool_bot): order.append(pool_bot[bi]); bi += 1
    for rest in pool_top[ti:] + pool_mid[mi:] + pool_bot[bi:]:
        order.append(rest)
    return order[:15]

# ---------- 1. hitung C1-C5 real untuk evaluator ----------
def calc_c3_row(row, stud_loc):
    sysm = str(row["work_system"]).strip().lower()
    jl = str(row["work_job_location"]).strip().lower()
    sl = str(stud_loc).strip().lower()
    if sysm == "remote" or jl == "remote" or jl == sl:
        return 1.0
    elif "jakarta" in jl and "jakarta" in sl:
        return 0.8
    return 0.4

def main(eval_id="MHS-R050"):
    jobs = pd.read_csv(JOBS_P)
    stud = pd.read_csv(STUD_P)
    raw = pd.read_csv(RAW_P)
    if eval_id not in set(stud["student_id"]):
        raise SystemExit(f"Evaluator {eval_id} tidak ada di clean_real_student.csv")
    s = stud[stud.student_id == eval_id].iloc[0]
    r = raw[raw.student_id == eval_id].iloc[0]
    print(f"Evaluator: {s['student_id']} | {s['student_name']} | {s['student_job_category']} | "
          f"Rp{s['min_expected_salary']}/jam | {s['student_location_clean']} | {s['student_expected_work_hour']} jam | {r['timestamp']}")

    c1 = np.where(jobs["job_category"] == s["student_job_category"], 1.0, 0.3)
    c2 = np.round(np.clip(jobs["work_salaryperhour"] / s["min_expected_salary"], 0.0, 2.0), 4)
    c3 = jobs.apply(lambda row: calc_c3_row(row, s["student_location_clean"]), axis=1)
    c4 = np.round(np.clip(1.0 - (np.abs(jobs["work_hours"] - s["student_expected_work_hour"]) / 20.0), 0.0, 1.0), 4)
    vec = TfidfVectorizer()
    jm = vec.fit_transform(jobs["clean_required_skills"].tolist())
    sm = vec.transform([s["clean_student_skills"]])
    c5 = np.round(cosine_similarity(sm, jm).flatten(), 4)

    # matriks X utk SEMUA 49 evaluator (dipakai sheet DATA_X_ALL agar dropdown B3 menggerakkan semua sheet)
    print("Hitung matriks X 49 evaluator x 221 lowongan...")
    allx_rows = []
    for srow in stud.itertuples():
        _c1 = np.where(jobs["job_category"] == srow.student_job_category, 1.0, 0.3)
        _c2 = np.round(np.clip(jobs["work_salaryperhour"] / srow.min_expected_salary, 0.0, 2.0), 4)
        _c3 = jobs.apply(lambda row, sl=srow.student_location_clean: calc_c3_row(row, sl), axis=1)
        _c4 = np.round(np.clip(1.0 - (np.abs(jobs["work_hours"] - srow.student_expected_work_hour) / 20.0), 0.0, 1.0), 4)
        _sm = vec.transform([srow.clean_student_skills])
        _c5 = np.round(cosine_similarity(_sm, jm).flatten(), 4)
        for jid, a, b, c_, d_, e_ in zip(jobs["job_id"], _c1, _c2, _c3, _c4, _c5):
            allx_rows.append((f"{srow.student_id}|{jid}", srow.student_id, jid,
                              float(a), float(b), float(c_), float(d_), float(e_)))
    allx = pd.DataFrame(allx_rows, columns=["key", "student_id", "job_id", "C1", "C2", "C3", "C4", "C5"])
    print(f"DATA_X_ALL: {len(allx)} baris (49 x 221)")

    full = pd.DataFrame({
        "job_id": jobs["job_id"], "job_title": jobs["job_title"], "company_name": jobs["company_name"],
        "job_category": jobs["job_category"], "work_salaryperhour": jobs["work_salaryperhour"],
        "work_job_location": jobs["work_job_location"], "work_hours": jobs["work_hours"],
        "work_system": jobs["work_system"], "clean_required_skills": jobs["clean_required_skills"],
        "C1": c1, "C2": c2, "C3": c3, "C4": c4, "C5": c5,
    })
    # skor global (MIN/MAX dari 221) dgn bobot BARU
    for c in ["C1","C2","C3","C4","C5"]:
        mn, mx = full[c].min(), full[c].max()
        full["u_"+c] = (full[c]-mn)/(mx-mn) if mx != mn else 1.0
    full["U"] = full["u_C1"]*W["C1"]+full["u_C2"]*W["C2"]+full["u_C3"]*W["C3"]+full["u_C4"]*W["C4"]+full["u_C5"]*W["C5"]
    # Urutan global IDENTIK dengan web (spk.ts computeSmarter G7):
    # U desc -> C2 desc -> C5 desc -> job_id asc (deterministik, bukan sort U saja).
    full = full.sort_values(["U","C2","C5","job_id"], ascending=[False,False,False,True]).reset_index(drop=True)
    full["rank_global"] = np.arange(1, len(full)+1)
    print("Top3 global:", full[["job_id","U"]].head(3).to_dict("records"))
    print("Bottom2:", full[["job_id","U"]].tail(2).to_dict("records"))

    demo_order = pick_demo_order(full)
    demo = full.set_index("job_id").loc[demo_order].reset_index()
    print("Demo15:", demo_order)
    # info evaluator utk cover/profil
    eval_info = {
        "id": s["student_id"], "nama": s["student_name"], "nim": str(int(float(r["student_nim"]))),
        "kategori": s["student_job_category"], "gaji": int(s["min_expected_salary"]),
        "lokasi": s["student_location"], "lokasi_clean": s["student_location_clean"],
        "jam": int(s["student_expected_work_hour"]), "sistem": s["preferred_work_system"],
        "skills": s["student_skills"], "clean_skills": s["clean_student_skills"],
        "timestamp": str(r["timestamp"]),
    }
    build_workbook(jobs, stud, raw, full, demo, eval_info, allx, out_path(eval_id))
    print(f"[OK] -> {out_path(eval_id)} ({out_path(eval_id).stat().st_size/1024:.1f} KB)")

# ---------- 2. styling helpers ----------
NAVY = "1F4E79"; TEAL = "2E75B6"; LIGHT = "D6E4F0"; YELLOW = "FFF2CC"
GREEN = "C6EFCE"; ORANGE = "FCE4D6"; GRAYB = "EDEDED"; GOLDF = "FFD966"
thin = Side(style="thin", color="8EA9DB")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)

def style_header(cell):
    cell.fill = PatternFill("solid", fgColor=NAVY)
    cell.font = Font(name="Calibri", bold=True, color="FFFFFF", size=11)
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    cell.border = BORDER

def style_input(cell):
    cell.fill = PatternFill("solid", fgColor=YELLOW)
    cell.font = Font(name="Calibri", size=11)
    cell.alignment = Alignment(horizontal="center", vertical="center")
    cell.border = BORDER

def style_body(cell, center=True, bold=False, num=None):
    cell.font = Font(name="Calibri", size=11, bold=bold)
    cell.alignment = Alignment(horizontal="center" if center else "left", vertical="center", wrap_text=True)
    cell.border = BORDER
    if num: cell.number_format = num

def title_block(ws, row, ncols, text, sub=None):
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=ncols)
    c = ws.cell(row=row, column=1, value=text)
    c.fill = PatternFill("solid", fgColor=NAVY)
    c.font = Font(name="Calibri", bold=True, color="FFFFFF", size=14)
    c.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[row].height = 28
    if sub:
        ws.merge_cells(start_row=row+1, start_column=1, end_row=row+1, end_column=ncols)
        c2 = ws.cell(row=row+1, column=1, value=sub)
        c2.fill = PatternFill("solid", fgColor=LIGHT)
        c2.font = Font(name="Calibri", size=10, italic=True, color="1F4E79")
        c2.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        ws.row_dimensions[row+1].height = 30

def section_head(ws, row, ncols, text):
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=ncols)
    c = ws.cell(row=row, column=1, value=text)
    c.fill = PatternFill("solid", fgColor=TEAL)
    c.font = Font(name="Calibri", bold=True, color="FFFFFF", size=11)
    c.alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[row].height = 22

# ---------- 3. workbook ----------
def build_workbook(jobs, stud, raw, full, demo, ev, allx, out_p):
    wb = openpyxl.Workbook()
    EID = ev["id"]
    NALLX = len(allx)
    gaji_str = f"Rp{ev['gaji']:,}".replace(",", ".")
    kat = ev["kategori"]; lok = ev["lokasi_clean"]; jam = ev["jam"]
    top1 = str(full.iloc[0]["job_id"]); top2 = str(full.iloc[1]["job_id"])
    bot1 = str(full.iloc[-1]["job_id"])
    if full["C5"].max() == full["C5"].min():
        c5note = "C5 NETRAL (semua 0 -> utility=1 via IFERROR cabang MAX=MIN; keputusan ditentukan C1-C4)."
    else:
        c5note = "C5 (bobot 4%) hanya tie-breaker halus."

    # ================= COVER =================
    ws = wb.active; ws.title = "00_COVER"; ws.sheet_properties.tabColor = NAVY
    widths = [22,30,30,22,22,22]; [ws.column_dimensions[get_column_letter(i+1)].__setattr__("width", w) for i,w in enumerate(widths)]
    title_block(ws, 1, 6, "SPK SMARTER — Rekomendasi Kerja Part-Time UKRIDA (DATA REAL 2026)",
                f"Evaluator default {EID} ({ev['nama']})  •  221 lowongan scraping real  •  49 responden GForm real  •  Prioritas BARU C1>C2>C3>C4>C5")
    ws.cell(row=2,column=1).value = '="Evaluator aktif: "&\'02_PROFIL\'!B3&" ("&VLOOKUP(\'02_PROFIL\'!B3,\'02_PROFIL\'!$A$16:$B$64,2,FALSE)&")  •  221 lowongan real  •  49 responden real  •  Prioritas C1>C2>C3>C4>C5  •  Ganti via dropdown di 02_PROFIL!B3"'
    section_head(ws, 4, 6, "IDENTITAS KELOMPOK")
    ws["A5"]="NIM"; ws["B5"]="Nama Mahasiswa"; ws.merge_cells("B5:C5")
    for c in ["A5","B5"]: style_header(ws[c])
    ws.row_dimensions[5].height=20
    anggota=[("412024022","Brandon Jeremiah Sutedja"),("412024043","Andrew Linardi"),
             ("412025014","Raffael Benediktus Lolaroh"),("412025021","Michael Aaron Sipahutar")]
    for i,(nim,nm) in enumerate(anggota, start=6):
        a=ws.cell(row=i,column=1,value=nim); style_body(a); b=ws.cell(row=i,column=2,value=nm); style_body(b,center=False); ws.merge_cells(start_row=i,start_column=2,end_row=i,end_column=3)
        ws.row_dimensions[i].height=18
    section_head(ws, 11, 6, "SUMBER DATA REAL (bukan mock — diverifikasi dari CSV codebase)")
    src_lines=[
        f"1) Lowongan : data/processed/cleaned-jobs/clean_jobs_dataset.csv — {len(jobs)} baris real scraping Glints (gaji Rp25–50rb/jam, 11 kategori).",
        f"2) Mahasiswa: data/processed/cleaned-real-students/clean_real_student.csv — {len(stud)} responden real (GForm 3–13 Okt 2026; 1 baris drop karena skill kosong).",
        f"3) Evaluator : {ev['id']} / {ev['nama']} / NIM {ev['nim']} — {ev['kategori']}, ekspektasi Rp{ev['gaji']:,}/jam, {ev['lokasi_clean']}, {ev['jam']} jam/mgg, {ev['sistem']} (diisi {ev['timestamp']}).",
        "4) C1–C5 dihitung untuk SEMUA 49 evaluator (49 x 221 = 10.829 baris, sheet DATA_X_ALL tersembunyi) — nilai X di sheet 03/05 diambil via INDEX-MATCH dari dropdown evaluator, bukan karangan.",
        "5) File ini BARU (8 sheet: 7 tampil + DATA_X_ALL, tema biru, SUMPRODUCT + RANK.EQ + INDEX-MATCH + XLOOKUP) — beda total dari v4 (2 sheet horizontal, tema merah, Σ manual + RANK + VLOOKUP saja).",
    ]
    for i,t in enumerate(src_lines, start=12):
        ws.merge_cells(start_row=i,start_column=1,end_row=i,end_column=6)
        c=ws.cell(row=i,column=1,value=t); c.font=Font(name="Calibri",size=10); c.alignment=Alignment(horizontal="left",vertical="center",wrap_text=True); c.border=BORDER
        ws.row_dimensions[i].height=28 if len(t)>110 else 20
    section_head(ws, 18, 6, "DAFTAR ISI — KLIK LINK (HYPERLINK)")
    links=[("01_KRITERIA","Kriteria, tipe Benefit/Cost, rank & bobot ROC (CHOOSE + VLOOKUP + HLOOKUP)"),
           ("02_PROFIL","Profil evaluator real + tabel 49 responden (VLOOKUP + AVERAGE + COUNTIF)"),
           ("03_ALTERNATIF","15 alternatif lowongan real + matriks X + MAX/MIN/RATA2 (link antar-sheet)"),
           ("04_SMARTER","Utility IF-Benefit/Cost + Nilai SUMPRODUCT + Rank RANK.EQ + kotak INDEX-MATCH/XLOOKUP"),
           ("05_ARSIP_221","Arsip penuh 221 lowongan (skor global + rank global, jadi acuan VLOOKUP)"),
           ("06_DASHBOARD","Top-5 otomatis (Rank Unik + INDEX-MATCH) + grafik + kesimpulan (&)")]
    for i,(sh,desc) in enumerate(links, start=19):
        ws.merge_cells(start_row=i,start_column=1,end_row=i,end_column=6)
        c=ws.cell(row=i,column=1); c.value=f'=HYPERLINK("#\'{sh}\'!A1","→ {sh} — {desc}")'
        c.font=Font(name="Calibri",size=10,color="0563C1",underline="single"); c.alignment=Alignment(horizontal="left",vertical="center"); c.border=BORDER
        ws.row_dimensions[i].height=20
    section_head(ws, 26, 6, "CARA PAKAI (semua angka turunan = RUMUS, silakan ubah sel kuning)")
    steps=["1) Sheet 02_PROFIL: pilih evaluator di DROPDOWN kuning B3 (49 ID) → SEMUA sheet ikut berubah: kartu profil (VLOOKUP), matriks X (INDEX-MATCH ke DATA_X_ALL), utility, Nilai, Rank, Top-5, grafik, kesimpulan.",
           "2) Sheet 01_KRITERIA: ubah Rank di kolom E (kuning, 1–5 unik) → bobot ROC & semua skor ikut berubah otomatis.",
           "3) Sheet 04_SMARTER: ketik Rank Unik 1–15 di sel kuning C23 → pemenang tampil via 3 metode (VLOOKUP / INDEX-MATCH / XLOOKUP).",
           "4) Sheet 06_DASHBOARD: Top-5 + grafik ter-update sendiri (Rank Unik + INDEX-MATCH + BarChart)."]
    for i,t in enumerate(steps, start=27):
        ws.merge_cells(start_row=i,start_column=1,end_row=i,end_column=6)
        c=ws.cell(row=i,column=1,value=t); c.font=Font(name="Calibri",size=10); c.alignment=Alignment(horizontal="left",vertical="center",wrap_text=True); c.border=BORDER; ws.row_dimensions[i].height=30
    ws.sheet_properties.pageSetUpPr = openpyxl.worksheet.properties.PageSetupProperties(fitToPage=True)
    ws.page_setup.fitToWidth=1; ws.page_setup.fitToHeight=1; ws.page_setup.orientation="landscape"
    ws.freeze_panes="A1"

    # ================= 01_KRITERIA =================
    k = wb.create_sheet("01_KRITERIA"); k.sheet_properties.tabColor = TEAL
    for col,w in zip("ABCDEFGH",[8,24,46,12,13,12,42,16]): k.column_dimensions[col].width=w
    for col,w in zip("JKL",["K","K","K"]): pass
    k.column_dimensions["J"].width=9; k.column_dimensions["K"].width=13; k.column_dimensions["L"].width=30
    title_block(k,1,8,"01 — KRITERIA, TIPE BENEFIT/COST & BOBOT ROC",f"Semua 5 kriteria = BENEFIT (makin besar makin baik)  •  Prioritas BARU: C1(1) > C2(2) > C3(3) > C4(4) > C5(5)  •  Evaluator {EID}  •  Bobot via CHOOSE dari tabel ROC (bukan ketikan)")
    hdr=["Kode","Nama Kriteria",f"Definisi / Satuan / Rumus Xij (relatif ke {EID})","Tipe","Rank (input)","Bobot ROC","Alasan Benefit (mengapa bukan Cost)","Cek"]
    for j,h in enumerate(hdr, start=1):
        c=k.cell(row=3,column=j,value=h); style_header(c)
    k.row_dimensions[3].height=38
    rows=[("C1","Kesesuaian Kategori",'="1,0 jika kategori = "&VLOOKUP(\'02_PROFIL\'!$B$3,\'02_PROFIL\'!$A$16:$C$64,3,FALSE)&" (minat evaluator); 0,3 jika beda. Satuan: skor."',RANKS["C1"],"Cocok minat → makin baik; tidak ada penalti cost."),
          ("C2","Rasio Penawaran Gaji",'="gaji/jam ÷ Rp"&TEXT(VLOOKUP(\'02_PROFIL\'!$B$3,\'02_PROFIL\'!$A$16:$D$64,4,FALSE),"#,##0")&" (ekspektasi evaluator), di-cap 2,0."',RANKS["C2"],"Gaji lebih tinggi selalu lebih baik bagi mahasiswa (benefit)."),
          ("C3","Aksesibilitas Lokasi",'="1,0 Remote/se-"&VLOOKUP(\'02_PROFIL\'!$B$3,\'02_PROFIL\'!$A$16:$E$64,5,FALSE)&"; 0,8 sesama Jakarta; 0,4 lainnya (aturan calc_c3)."',RANKS["C3"],"Lokasi mudah dijangkau → makin baik (benefit)."),
          ("C4","Kesesuaian Jam Kerja",'="1 − |jam − "&VLOOKUP(\'02_PROFIL\'!$B$3,\'02_PROFIL\'!$A$16:$F$64,6,FALSE)&"|/20 (jam ideal evaluator). Dekat ideal → ~1."',RANKS["C4"],"Jam dekat ideal → makin baik (benefit)."),
          ("C5","Kemiripan Keahlian","Cosine TF-IDF skill mhs vs lowongan [0–1]. 0,75 = sangat cocok.",RANKS["C5"],"Skill cocok → makin baik (benefit).")]
    for i,(kd,nm,defs,rk,als) in enumerate(rows, start=4):
        k.cell(row=i,column=1,value=kd); k.cell(row=i,column=2,value=nm); k.cell(row=i,column=3,value=defs)
        k.cell(row=i,column=4,value="Benefit"); k.cell(row=i,column=5,value=rk)
        k.cell(row=i,column=7,value=als); k.cell(row=i,column=8,value="✓")
        for col in [1,2,3,4,7,8]:
            style_body(k.cell(row=i,column=col), center=(col in [1,4,8]), bold=(col==1))
            if col==3 or col==7: k.cell(row=i,column=col).alignment=Alignment(horizontal="left",vertical="center",wrap_text=True)
        style_input(k.cell(row=i,column=5))
        f=k.cell(row=i,column=6); f.value=f"=CHOOSE($E{i},$K$5,$K$6,$K$7,$K$8,$K$9)"; f.number_format="0.00%"; style_body(f,bold=True)
        k.row_dimensions[i].height=36
    k["A9"]="TOTAL"; style_body(k["A9"],bold=True)
    k.merge_cells("A9:E9")
    t=k.cell(row=9,column=6,value="=SUM(F4:F8)"); t.number_format="0.00%"; style_body(t,bold=True); t.fill=PatternFill("solid",fgColor=GRAYB)
    g=k.cell(row=9,column=7,value='=IF(ABS(F9-1)<0.0005,"✔ Jumlah bobot = 1 (OK)","✘ Jumlah ≠ 1 (ERROR)")'); style_body(g,center=False,bold=True)
    k.merge_cells("G9:H9"); k.row_dimensions[9].height=22
    k.merge_cells("A10:E10"); k.cell(row=10,column=1,value="Rank harus unik 1–5:").font=Font(name="Calibri",size=10,italic=True)
    k.merge_cells("F10:H10")
    ck=k.cell(row=10,column=6,value='=IF(AND(COUNTIF(E4:E8,1)=1,COUNTIF(E4:E8,2)=1,COUNTIF(E4:E8,3)=1,COUNTIF(E4:E8,4)=1,COUNTIF(E4:E8,5)=1),"✔ Rank unik 1–5 (OK)","✘ Rank ganda/kosong")')
    ck.font=Font(name="Calibri",size=10,bold=True); ck.alignment=Alignment(horizontal="left",vertical="center"); ck.border=BORDER
    # tabel ROC acuan
    k.merge_cells("J3:L3"); c=k.cell(row=3,column=10,value="TABEL ACUAN ROC (K=5)"); style_header(c)
    for j,h in enumerate(["Rank","Bobot ROC","Rumus"], start=10):
        c=k.cell(row=4,column=j,value=h); style_header(c)
    rocs=[(1,"(1+1/2+1/3+1/4+1/5)/5"),(2,"(1/2+1/3+1/4+1/5)/5"),(3,"(1/3+1/4+1/5)/5"),(4,"(1/4+1/5)/5"),(5,"(1/5)/5")]
    for i,(r,frm) in enumerate(rocs, start=5):
        a=k.cell(row=i,column=10,value=r); style_body(a,bold=True)
        b=k.cell(row=i,column=11,value="="+frm); b.number_format="0.00%"; style_body(b,bold=True); b.fill=PatternFill("solid",fgColor=GRAYB)
        c=k.cell(row=i,column=12,value="="+frm); style_body(c,center=False)
        k.row_dimensions[i].height=20
    # demo lookup
    k.merge_cells("J11:L11"); c=k.cell(row=11,column=10,value="DEMO LOOKUP (coba ganti sel kuning)"); style_header(c)
    k.cell(row=12,column=10,value="Input Kode:"); style_body(k.cell(row=12,column=10),bold=True)
    k.cell(row=12,column=11,value="C3"); style_input(k.cell(row=12,column=11))
    k.cell(row=13,column=10,value="Nama (VLOOKUP):"); style_body(k.cell(row=13,column=10))
    k.merge_cells("K13:L13"); k.cell(row=13,column=11,value="=VLOOKUP($K$12,$A$4:$B$8,2,FALSE)"); style_body(k.cell(row=13,column=11),center=False)
    k.cell(row=14,column=10,value="Bobot (VLOOKUP):"); style_body(k.cell(row=14,column=10))
    k.merge_cells("K14:L14"); v=k.cell(row=14,column=11,value="=VLOOKUP($K$12,$A$4:$F$8,6,FALSE)"); v.number_format="0.00%"; style_body(v)
    k.merge_cells("J15:L15"); c=k.cell(row=15,column=10,value='Bobot (HLOOKUP): =HLOOKUP($K$12,$J$17:$N$18,2,FALSE) →'); style_body(c,center=False)
    k.cell(row=16,column=10,value="HLOOKUP →"); style_body(k.cell(row=16,column=10),bold=True)
    h=k.cell(row=16,column=11,value='=HLOOKUP($K$12,$J$17:$N$18,2,FALSE)'); h.number_format="0.00%"; style_body(h,bold=True); h.fill=PatternFill("solid",fgColor=YELLOW)
    # tabel horizontal utk HLOOKUP
    kodes=["C1","C2","C3","C4","C5"]
    for j,kd in enumerate(kodes, start=10):
        c=k.cell(row=17,column=j,value=kd); style_body(c,bold=True); c.fill=PatternFill("solid",fgColor=LIGHT)
        # bobot horizontal link ke F4:F8 (urutan C1..C5)
        b=k.cell(row=18,column=j,value=f"={chr(70)}{4+(j-10)}"); b.number_format="0.00%"; style_body(b); b.fill=PatternFill("solid",fgColor=GRAYB)
    # catatan
    k.merge_cells("A20:H20"); k.cell(row=20,column=1,value="CATATAN TIPE: tidak ada kriteria Cost pada data ini — semua makin-besar-makin-baik sehingga rumus utility memakai cabang Benefit.").font=Font(name="Calibri",size=10,italic=True)
    k.merge_cells("A21:H21"); k.cell(row=21,column=1,value="Rumus utility di sheet 04_SMARTER tetap memakai IF(Tipe=\"Benefit\", ..., cabang Cost ...) + IFERROR(MAX=MIN → 1) agar siap jika suatu saat ada kriteria Cost.").font=Font(name="Calibri",size=10,italic=True)
    k.merge_cells("A22:H22"); k.cell(row=22,column=1,value="BEDA vs v4: v4 bobot diketik per kolom (=...)/5; file ini bobot = CHOOSE(Rank, tabel ROC) + validasi SUM=1 + cek rank unik + demo VLOOKUP/HLOOKUP.").font=Font(name="Calibri",size=10,bold=True,color=NAVY)
    dv=DataValidation(type="whole", operator="between", formula1=1, formula2=5, allow_blank=False, showErrorMessage=True, errorTitle="Rank salah", error="Isi 1–5 unik")
    k.add_data_validation(dv); dv.add("E4:E8")
    k.freeze_panes="A4"; k.sheet_properties.pageSetUpPr=openpyxl.worksheet.properties.PageSetupProperties(fitToPage=True)
    k.page_setup.fitToWidth=1; k.page_setup.fitToHeight=1; k.page_setup.orientation="landscape"

    # ================= 02_PROFIL =================
    p = wb.create_sheet("02_PROFIL"); p.sheet_properties.tabColor = TEAL
    p.column_dimensions["A"].width=26; p.column_dimensions["B"].width=52; p.column_dimensions["C"].width=16
    p.column_dimensions["D"].width=22; p.column_dimensions["E"].width=26; p.column_dimensions["F"].width=16
    p.column_dimensions["G"].width=20; p.column_dimensions["H"].width=30; p.column_dimensions["I"].width=14
    title_block(p,1,9,"02 — PROFIL EVALUATOR REAL + TABEL 49 RESPONDEN","Kartu atas = VLOOKUP dari tabel 49 di bawah  •  Pilih evaluator di DROPDOWN kuning B3 → kartu + SEMUA sheet ikut berubah")
    p["A3"]="ID Evaluator (dropdown):"; style_body(p["A3"],bold=True)
    p["B3"]=EID; style_input(p["B3"])
    dvp=DataValidation(type="list", formula1="'02_PROFIL'!$A$16:$A$64", allow_blank=False, showErrorMessage=True, errorTitle="ID salah", error="Pilih dari dropdown 49 ID")
    p.add_data_validation(dvp); dvp.add("B3")
    p["C3"]="=HYPERLINK(\"#'00_COVER'!A1\",\"← Cover\")"; p["C3"].font=Font(color="0563C1",underline="single")
    card=[("Nama",2,"VLOOKUP nama"),("NIM (dari GForm)",9,"ikut dropdown"),
          ("Minat / Kategori",3,"→ C1"),("Gaji min /jam (Rp)",4,"→ C2 = gaji ÷ sel ini"),
          ("Domisili bersih",5,"→ C3"),("Jam ideal /mgg",6,"→ C4 = 1−|jam−sel|/20"),
          ("Sistem favorit",7,"konteks C3"),("Skill (mentah)",8,"→ C5 cosine")]
    for i,(lbl,col,ket) in enumerate(card, start=4):
        a=p.cell(row=i,column=1,value=lbl); style_body(a,bold=True)
        b=p.cell(row=i,column=2)
        if lbl.startswith("Skill"): b.value=f"=VLOOKUP($B$3,$A$16:$H$64,{col},FALSE)"
        else: b.value=f"=VLOOKUP($B$3,$A$16:$I$64,{col},FALSE)"
        style_body(b,center=False)
        if col==4: b.number_format='"Rp" #,##0'
        c=p.cell(row=i,column=3,value=ket); c.font=Font(name="Calibri",size=9,italic=True); c.alignment=Alignment(horizontal="left",vertical="center"); c.border=BORDER
        p.row_dimensions[i].height=22
    p.merge_cells("A12:I12"); c=p.cell(row=12,column=1,value=f"Default file: diisi {ev['timestamp']}  •  Domisili asli: {ev['lokasi']}  •  Skill bersih (NLP): {ev['clean_skills']}  •  (Pilih dropdown B3 → profil lain tampil di kartu & semua sheet)"); c.font=Font(name="Calibri",size=9,italic=True); c.alignment=Alignment(horizontal="left",vertical="center",wrap_text=True); p.row_dimensions[12].height=36
    section_head(p,14,9,"TABEL 49 RESPONDEN REAL (clean_real_student.csv) — ringkasan bawah memakai AVERAGE/COUNTIF/MIN/MAX")
    hdr2=["ID","Nama","Kategori Minat","Gaji Min/jam","Domisili","Jam/mgg","Sistem","Skill (ringkas)","NIM"]
    for j,h in enumerate(hdr2, start=1):
        c=p.cell(row=15,column=j,value=h); style_header(c)
    p.row_dimensions[15].height=30
    stud_sorted = stud.sort_values("student_id").reset_index(drop=True)
    def _nim(x):
        try:
            return str(int(float(x))) if pd.notna(x) else "-"
        except (ValueError, TypeError):
            return str(x) if pd.notna(x) else "-"
    nim_map = dict(zip(raw["student_id"].astype(str), raw["student_nim"].apply(_nim)))
    for i,row in enumerate(stud_sorted.itertuples(), start=16):
        vals=[row.student_id,row.student_name,row.student_job_category,row.min_expected_salary,
              row.student_location_clean,row.student_expected_work_hour,row.preferred_work_system,
              (str(row.student_skills)[:60]), nim_map.get(str(row.student_id),"-")]
        for j,v in enumerate(vals, start=1):
            c=p.cell(row=i,column=j,value=v); style_body(c,center=(j in [1,4,5,6,7,9]),bold=(j==1))
            if j==4: c.number_format='"Rp" #,##0'
            if j==2 or j==8: c.alignment=Alignment(horizontal="left",vertical="center",wrap_text=True)
        p.row_dimensions[i].height=18
    # baris 65-66: ringkasan (16..64 = 49 baris)
    p.cell(row=65,column=1,value="RATA2"); style_body(p.cell(row=65,column=1),bold=True)
    p.merge_cells("A65:C65")
    for col,frm in [(4,"=AVERAGE(D16:D64)"),(6,"=AVERAGE(F16:F64)")]:
        c=p.cell(row=65,column=col,value=frm); style_body(c,bold=True); c.fill=PatternFill("solid",fgColor=GRAYB)
        if col==4: c.number_format='"Rp" #,##0.0'
        else: c.number_format='0.0'
    p.cell(row=65,column=8,value='=COUNTIF(C16:C64,"IT & Software")&" dari 49 minat IT"'); style_body(p.cell(row=65,column=8),center=False)
    p.cell(row=66,column=1,value="MIN / MAX"); style_body(p.cell(row=66,column=1),bold=True); p.merge_cells("A66:C66")
    p.cell(row=66,column=4,value="=MIN(D16:D64)&\" – \"&MAX(D16:D64)"); style_body(p.cell(row=66,column=4))
    p.cell(row=66,column=6,value="=MIN(F16:F64)&\" – \"&MAX(F16:F64)"); style_body(p.cell(row=66,column=6))
    p.cell(row=66,column=8,value=f'=COUNTIF(C16:C64,"{kat}")&" minat {kat.split(chr(32))[0]}"'); style_body(p.cell(row=66,column=8),center=False)
    p.conditional_formatting.add(f"A16:I64", openpyxl.formatting.rule.FormulaRule(formula=['$A16=$B$3'], fill=PatternFill("solid",fgColor=GOLDF)))
    p.freeze_panes="A16"; p.auto_filter.ref="A15:I64"
    p.sheet_properties.pageSetUpPr=openpyxl.worksheet.properties.PageSetupProperties(fitToPage=True)
    p.page_setup.fitToWidth=1; p.page_setup.fitToHeight=0; p.page_setup.orientation="landscape"

    # ================= DATA_X_ALL (tersembunyi: 49 evaluator x 221 job) =================
    dx = wb.create_sheet("DATA_X_ALL"); dx.sheet_properties.tabColor = "808080"
    dx.column_dimensions["A"].width=22; dx.column_dimensions["B"].width=12; dx.column_dimensions["C"].width=12
    for col in "DEFGH": dx.column_dimensions[col].width=9
    for j,h in enumerate(["key (mhs|job)","student_id","job_id","C1","C2","C3","C4","C5"], start=1):
        c=dx.cell(row=1,column=j,value=h); style_header(c)
    for i,row in enumerate(allx.itertuples(), start=2):
        dx.cell(row=i,column=1,value=row.key); dx.cell(row=i,column=2,value=row.student_id); dx.cell(row=i,column=3,value=row.job_id)
        for j,v in zip([4,5,6,7,8],[row.C1,row.C2,row.C3,row.C4,row.C5]):
            c=dx.cell(row=i,column=j,value=float(v)); c.number_format="0.00"
    dx.freeze_panes="A2"; dx.sheet_state="hidden"
    LASTDX = len(allx) + 1  # baris terakhir data

    # ================= 03_ALTERNATIF =================
    a = wb.create_sheet("03_ALTERNATIF"); a.sheet_properties.tabColor = TEAL
    widths3={"A":8,"B":12,"C":44,"D":26,"E":20,"F":13,"G":17,"H":10,"I":11,"J":9,"K":9,"L":9,"M":9,"N":9}
    for col,w in widths3.items(): a.column_dimensions[col].width=w
    title_block(a,1,14,"03 — 15 ALTERNATIF REAL + MATRIKS KEPUTUSAN X (C1–C5)","Panel 15 tetap • C1–C5 MENGIKUTI dropdown evaluator di 02_PROFIL!B3 via INDEX-MATCH ke DATA_X_ALL • Tipe+Bobot di-link dari 01_KRITERIA")
    hdr3=["Kode","Job ID","Judul Lowongan (real)","Perusahaan (real)","Kategori","Gaji/jam","Lokasi","Jam","Sistem","C1 (ikut dropdown)","C2 (ikut dropdown)","C3 (ikut dropdown)","C4 (ikut dropdown)","C5 (ikut dropdown)"]
    for j,h in enumerate(hdr3, start=1):
        c=a.cell(row=3,column=j,value=h); style_header(c)
    a.row_dimensions[3].height=40
    DXCOLS = ["D","E","F","G","H"]  # C1..C5 di DATA_X_ALL
    for i,job_id in enumerate(demo["job_id"].tolist(), start=4):
        jr = full[full.job_id==job_id].iloc[0]
        kode=f"A{i-3}"
        vals=[kode,job_id,jr["job_title"],jr["company_name"],jr["job_category"],jr["work_salaryperhour"],
              jr["work_job_location"],jr["work_hours"],jr["work_system"]]
        for j,v in enumerate(vals, start=1):
            c=a.cell(row=i,column=j,value=v)
            if j<=2: style_body(c,bold=True)
            elif j<=5: style_body(c,center=False)
            elif j==6: style_body(c); c.number_format='"Rp" #,##0'
            elif j in [7,9]: style_body(c)
            elif j==8: style_body(c); c.number_format='0'
        for j,dxcol in zip(range(10,15), DXCOLS):
            c=a.cell(row=i,column=j,value=f"=INDEX('DATA_X_ALL'!${dxcol}$2:${dxcol}${LASTDX},MATCH('02_PROFIL'!$B$3&\"|\"&$B{i},'DATA_X_ALL'!$A$2:$A${LASTDX},0))")
            style_body(c); c.number_format="0.00"; c.fill=PatternFill("solid",fgColor=YELLOW)
        a.row_dimensions[i].height=30
    # baris turunan
    R_TIPE=19; R_BOBOT=20; R_MAX=21; R_MIN=22; R_AVG=23; R_RNG=24; R_CEK=25
    a.cell(row=R_TIPE,column=1,value="Tipe ⇐ 01_KRITERIA"); style_body(a.cell(row=R_TIPE,column=1),bold=True)
    a.merge_cells(start_row=R_TIPE,start_column=1,end_row=R_TIPE,end_column=9)
    for j,code in enumerate(["C1","C2","C3","C4","C5"], start=10):
        r_ref={"C1":4,"C2":5,"C3":6,"C4":7,"C5":8}[code]
        c=a.cell(row=R_TIPE,column=j,value=f"='01_KRITERIA'!D{r_ref}"); style_body(c,bold=True); c.fill=PatternFill("solid",fgColor=LIGHT)
    a.cell(row=R_BOBOT,column=1,value="Bobot ⇐ 01_KRITERIA"); style_body(a.cell(row=R_BOBOT,column=1),bold=True)
    a.merge_cells(start_row=R_BOBOT,start_column=1,end_row=R_BOBOT,end_column=9)
    for j,code in enumerate(["C1","C2","C3","C4","C5"], start=10):
        r_ref={"C1":4,"C2":5,"C3":6,"C4":7,"C5":8}[code]
        c=a.cell(row=R_BOBOT,column=j,value=f"='01_KRITERIA'!F{r_ref}"); c.number_format="0.00%"; style_body(c,bold=True); c.fill=PatternFill("solid",fgColor=GRAYB)
    for lbl,row,frm in [("MAX",R_MAX,"MAX"),("MIN",R_MIN,"MIN"),("RATA2",R_AVG,"AVERAGE")]:
        a.cell(row=row,column=1,value=lbl); style_body(a.cell(row=row,column=1),bold=True)
        a.merge_cells(start_row=row,start_column=1,end_row=row,end_column=9)
        for j in range(10,15):
            col=get_column_letter(j)
            c=a.cell(row=row,column=j,value=f"={frm}({col}4:{col}18)"); style_body(c,bold=True); c.number_format="0.00"
            if lbl=="MAX": c.fill=PatternFill("solid",fgColor=GREEN)
            elif lbl=="MIN": c.fill=PatternFill("solid",fgColor=ORANGE)
    a.cell(row=R_RNG,column=1,value="RANGE (MAX−MIN)"); style_body(a.cell(row=R_RNG,column=1),bold=True)
    a.merge_cells(start_row=R_RNG,start_column=1,end_row=R_RNG,end_column=9)
    for j in range(10,15):
        col=get_column_letter(j)
        c=a.cell(row=row,column=j,value=f"={col}{R_MAX}-{col}{R_MIN}") if False else a.cell(row=R_RNG,column=j,value=f"={col}{R_MAX}-{col}{R_MIN}")
        style_body(c); c.number_format="0.00"
    a.cell(row=R_CEK,column=1,value="Cek range nol?"); style_body(a.cell(row=R_CEK,column=1))
    a.merge_cells(start_row=R_CEK,start_column=1,end_row=R_CEK,end_column=9)
    for j in range(10,15):
        col=get_column_letter(j)
        c=a.cell(row=R_CEK,column=j,value=f'=IF({col}{R_RNG}=0,"MAX=MIN→u=1","OK")'); style_body(c)
    a.cell(row=26,column=1,value="Evaluator aktif (link dropdown 02_PROFIL!B3):"); style_body(a.cell(row=26,column=1),bold=True)
    a.merge_cells(start_row=26,start_column=1,end_row=26,end_column=9)
    a.cell(row=26,column=10,value="='02_PROFIL'!B3"); style_body(a.cell(row=26,column=10),bold=True)
    a.merge_cells(start_row=26,start_column=10,end_row=26,end_column=14)
    a.freeze_panes="C4"; a.auto_filter.ref="A3:N18"
    a.sheet_properties.pageSetUpPr=openpyxl.worksheet.properties.PageSetupProperties(fitToPage=True)
    a.page_setup.fitToWidth=1; a.page_setup.fitToHeight=1; a.page_setup.orientation="landscape"
    # color scale utk X
    a.conditional_formatting.add("J4:N18", ColorScaleRule(start_type="min",start_color="F8696B",mid_type="percentile",mid_value=50,mid_color="FFEB84",end_type="max",end_color="63BE7B"))

    # ================= 04_SMARTER =================
    s4 = wb.create_sheet("04_SMARTER"); s4.sheet_properties.tabColor = "C00000"
    wc={"A":8,"B":12,"C":40,"D":24,"E":9,"F":9,"G":9,"H":9,"I":9,"J":11,"K":10,"L":10,"M":11,"N":14,"O":8,"P":10,"Q":40,"R":11}
    for col,w in wc.items(): s4.column_dimensions[col].width=w
    title_block(s4,1,18,"04 — UTILITY + NILAI SMARTER + RANKING (semua rumus live)","Utility GLOBAL (MIN/MAX 221, sama dgn web) = IF(Tipe Benefit/Cost) + IFERROR  •  Nilai = SUMPRODUCT  •  Rank = RANK.EQ  •  Judul = VLOOKUP, Perusahaan = INDEX-MATCH")
    hdr4=["Kode","Job ID","Judul (VLOOKUP ⤵)","Perusahaan (INDEX-MATCH ⤵)","u_C1","u_C2","u_C3","u_C4","u_C5","Nilai SMARTER","Rank","Rank Unik","Rank Global","Status"]
    for j,h in enumerate(hdr4, start=1):
        c=s4.cell(row=3,column=j,value=h); style_header(c)
    s4.row_dimensions[3].height=40
    # helper header P-R (berbasis Rank Unik agar tiap rank 1–15 tepat satu baris)
    for j,h in enumerate(["Rank Unik (bantu)","Judul (bantu)","Nilai (bantu)"], start=16):
        c=s4.cell(row=3,column=j,value=h); c.fill=PatternFill("solid",fgColor=GRAYB); c.font=Font(name="Calibri",bold=True,size=9); c.alignment=Alignment(horizontal="center",vertical="center",wrap_text=True); c.border=BORDER
    for i in range(4,19):
        r=i  # baris 4..18
        s4.cell(row=r,column=1,value=f"='03_ALTERNATIF'!A{r}"); style_body(s4.cell(row=r,column=1),bold=True)
        s4.cell(row=r,column=2,value=f"='03_ALTERNATIF'!B{r}"); style_body(s4.cell(row=r,column=2),bold=True)
        c=s4.cell(row=r,column=3,value=f"=VLOOKUP($B{r},'03_ALTERNATIF'!$B$4:$C$18,2,FALSE)"); style_body(c,center=False)
        c=s4.cell(row=r,column=4,value=f"=INDEX('03_ALTERNATIF'!$D$4:$D$18,MATCH($B{r},'03_ALTERNATIF'!$B$4:$B$18,0))"); style_body(c,center=False)
        # utility GLOBAL (sama dgn web computeSmarter): X demo (03!J..N) dinormalisasi
        # dgn MIN/MAX GLOBAL 221 di 05_ARSIP_221 (C..G baris 226/227), BUKAN min/max lokal 15.
        # Pemetaan: 03!J(C1)->05!C, 03!K(C2)->05!D, 03!L(C3)->05!E, 03!M(C4)->05!F, 03!N(C5)->05!G.
        # Tipe tetap dari 03_ALTERNATIF baris 19 (link 01_KRITERIA).
        gmap={"J":"C","K":"D","L":"E","M":"F","N":"G"}
        for j,colA in zip([5,6,7,8,9],["J","K","L","M","N"]):
            gcol=gmap[colA]
            f=(f"=IFERROR(IF('03_ALTERNATIF'!${colA}$19=\"Benefit\","
               f"('03_ALTERNATIF'!{colA}{r}-'05_ARSIP_221'!${gcol}$227)/('05_ARSIP_221'!${gcol}$226-'05_ARSIP_221'!${gcol}$227),"
               f"('05_ARSIP_221'!${gcol}$226-'03_ALTERNATIF'!{colA}{r})/('05_ARSIP_221'!${gcol}$226-'05_ARSIP_221'!${gcol}$227)),1)")
            c=s4.cell(row=r,column=j,value=f); style_body(c); c.number_format="0.00"
        jv=s4.cell(row=r,column=10,value=f"=SUMPRODUCT($E{r}:$I{r},'03_ALTERNATIF'!$J$20:$N$20)"); style_body(jv,bold=True); jv.number_format="0.0000"; jv.fill=PatternFill("solid",fgColor=LIGHT)
        k=s4.cell(row=r,column=11,value=f"=RANK.EQ($J{r},$J$4:$J$18,0)"); style_body(k,bold=True)
        u=s4.cell(row=r,column=12,value=f"=K{r}+COUNTIF($J$4:$J{r},$J{r})-1"); style_body(u)
        g=s4.cell(row=r,column=13,value=f"=VLOOKUP($B{r},'05_ARSIP_221'!$A$4:$N$224,14,FALSE)"); style_body(g)
        st=s4.cell(row=r,column=14,value=f'=IF($K{r}<=3,"★ Rekomendasi",IF($K{r}<=5,"○ Cadangan","—"))'); style_body(st,center=False)
        # helper P-R
        s4.cell(row=r,column=16,value=f"=L{r}"); style_body(s4.cell(row=r,column=16))
        s4.cell(row=r,column=17,value=f"=C{r}"); style_body(s4.cell(row=r,column=17),center=False)
        s4.cell(row=r,column=18,value=f"=J{r}"); style_body(s4.cell(row=r,column=18)); s4.cell(row=r,column=18).number_format="0.0000"
        s4.row_dimensions[r].height=30
    # statistik nilai
    s4.cell(row=19,column=1,value="STAT"); style_body(s4.cell(row=19,column=1),bold=True); s4.merge_cells("A19:D19")
    for col,frm,lbl in [(10,"=MAX(J4:J18)","MAX"),(10,"","")]:
        pass
    s4.cell(row=19,column=9,value="RATA2:"); style_body(s4.cell(row=19,column=9),bold=True)
    c=s4.cell(row=19,column=10,value="=AVERAGE(J4:J18)"); style_body(c,bold=True); c.number_format="0.0000"; c.fill=PatternFill("solid",fgColor=GRAYB)
    s4.cell(row=20,column=9,value="STDEV:"); style_body(s4.cell(row=20,column=9))
    c=s4.cell(row=20,column=10,value="=STDEV(J4:J18)"); style_body(c); c.number_format="0.0000"
    s4.cell(row=20,column=11,value='=COUNTIF(K4:K18,"<=3")&" top-3"'); style_body(s4.cell(row=20,column=11),center=False)
    s4.cell(row=21,column=2,value="Evaluator aktif:"); style_body(s4.cell(row=21,column=2))
    s4.cell(row=21,column=3,value="='02_PROFIL'!B3"); style_body(s4.cell(row=21,column=3),bold=True)
    # kotak lookup
    s4.merge_cells("A22:R22"); c=s4.cell(row=22,column=1,value="KOTAK LOOKUP PEMENANG — ketik Rank Unik 1–15 di sel kuning C23 (dibuktikan 3 metode: VLOOKUP vs INDEX-MATCH vs XLOOKUP)"); style_header(c)
    s4.cell(row=23,column=2,value="Input Rank:"); style_body(s4.cell(row=23,column=2),bold=True)
    s4.cell(row=23,column=3,value=1); style_input(s4.cell(row=23,column=3))
    s4.cell(row=24,column=2,value="Judul (VLOOKUP):"); style_body(s4.cell(row=24,column=2))
    s4.merge_cells("C24:R24"); s4.cell(row=24,column=3,value="=VLOOKUP($C$23,$P$4:$Q$18,2,FALSE)"); style_body(s4.cell(row=24,column=3),center=False,bold=True)
    s4.cell(row=25,column=2,value="Nilai (VLOOKUP):"); style_body(s4.cell(row=25,column=2))
    s4.cell(row=25,column=3,value="=VLOOKUP($C$23,$P$4:$R$18,3,FALSE)"); style_body(s4.cell(row=25,column=3),bold=True); s4.cell(row=25,column=3).number_format="0.0000"
    s4.cell(row=26,column=2,value="Judul (INDEX-MATCH):"); style_body(s4.cell(row=26,column=2))
    s4.merge_cells("C26:R26"); s4.cell(row=26,column=3,value="=INDEX($C$4:$C$18,MATCH($C$23,$L$4:$L$18,0))"); style_body(s4.cell(row=26,column=3),center=False)
    s4.cell(row=27,column=2,value="Nilai (INDEX-MATCH):"); style_body(s4.cell(row=27,column=2))
    s4.cell(row=27,column=3,value="=INDEX($J$4:$J$18,MATCH($C$23,$L$4:$L$18,0))"); style_body(s4.cell(row=27,column=3)); s4.cell(row=27,column=3).number_format="0.0000"
    s4.cell(row=28,column=2,value="Judul (XLOOKUP):"); style_body(s4.cell(row=28,column=2))
    s4.merge_cells("C28:R28"); s4.cell(row=28,column=3,value="=IFERROR(XLOOKUP($C$23,$L$4:$L$18,$C$4:$C$18,\"tidak ada\"),INDEX($C$4:$C$18,MATCH($C$23,$L$4:$L$18,0)))"); style_body(s4.cell(row=28,column=3),center=False)
    s4.merge_cells("A30:R30")
    ks=s4.cell(row=30,column=1); ks.value='="KESIMPULAN: Rank "&C23&" = "&C24&" (Nilai "&TEXT(C25,"0.0000")&") — diverifikasi sama via INDEX-MATCH ("&C26&")"'
    ks.fill=PatternFill("solid",fgColor=GOLDF); ks.font=Font(name="Calibri",bold=True,size=11); ks.alignment=Alignment(horizontal="center",vertical="center",wrap_text=True); ks.border=BORDER
    s4.row_dimensions[30].height=36
    s4.merge_cells("A31:R32")
    nt=s4.cell(row=31,column=1,value="CATATAN: Nilai demo memakai MIN/MAX GLOBAL 221 (05_ARSIP_221 baris 226/227) sehingga IDENTIK dgn nilai global & ranking web (computeSmarter global). Kolom M (Rank Global via VLOOKUP ke 05_ARSIP_221) harus konsisten dgn kolom K. BEDA vs v4: v4 Nilai = (B19*$B$5)+... manual & Rank=RANK; file ini Nilai=SUMPRODUCT & Rank=RANK.EQ+Rank Unik (COUNTIF) + 3 metode lookup + helper P:R. Urutan global memakai tie-breaker web: U>C2>C5>job_id.")
    nt.font=Font(name="Calibri",size=9,italic=True); nt.alignment=Alignment(horizontal="left",vertical="center",wrap_text=True)
    dv2=DataValidation(type="whole",operator="between",formula1=1,formula2=15,showErrorMessage=True,errorTitle="Rank salah",error="Isi 1–15"); s4.add_data_validation(dv2); dv2.add("C23")
    s4.conditional_formatting.add("K4:K18", openpyxl.formatting.rule.CellIsRule(operator="lessThanOrEqual",formula=["3"],fill=PatternFill("solid",fgColor=GREEN)))
    s4.conditional_formatting.add("J4:J18", ColorScaleRule(start_type="min",start_color="F8696B",mid_type="percentile",mid_value=50,mid_color="FFEB84",end_type="max",end_color="63BE7B"))
    s4.freeze_panes="E4"; s4.auto_filter.ref="A3:N18"
    s4.sheet_properties.pageSetUpPr=openpyxl.worksheet.properties.PageSetupProperties(fitToPage=True)
    s4.page_setup.fitToWidth=1; s4.page_setup.fitToHeight=1; s4.page_setup.orientation="landscape"

    # ================= 05_ARSIP_221 =================
    ar = wb.create_sheet("05_ARSIP_221"); ar.sheet_properties.tabColor = NAVY
    ar.column_dimensions["A"].width=12; ar.column_dimensions["B"].width=42
    for col in "CDEFG": ar.column_dimensions[col].width=9
    for col in "HIJKL": ar.column_dimensions[col].width=9
    ar.column_dimensions["M"].width=11; ar.column_dimensions["N"].width=10
    title_block(ar,1,14,"05 — ARSIP 221 LOWONGAN (skor & rank GLOBAL, MIN/MAX dari 221)","X MENGIKUTI dropdown evaluator di 02_PROFIL!B3 via INDEX-MATCH ke DATA_X_ALL  •  Urutan baris = rank evaluator default (boleh di-sort; juara evaluator aktif lihat 06_DASHBOARD)  •  Kolom N jadi acuan VLOOKUP sheet 04")
    hdrA=["Job ID","Judul","C1","C2","C3","C4","C5","u_C1","u_C2","u_C3","u_C4","u_C5","Nilai Global","Rank Global"]
    for j,h in enumerate(hdrA, start=1):
        c=ar.cell(row=3,column=j,value=h); style_header(c)
    ar.row_dimensions[3].height=36
    # bobot global di baris 1? pakai link KRITERIA di baris 227; utility refs itu
    RMAX=226; RMIN=227; RBOB=228
    for i,row in enumerate(full.itertuples(), start=4):
        # full sudah urut rank global 1..221 -> tulis berurutan di baris 4..224
        r = i  # baris excel = 4..224
        ar.cell(row=r,column=1,value=row.job_id); style_body(ar.cell(row=r,column=1),bold=True)
        ar.cell(row=r,column=2,value=row.job_title); style_body(ar.cell(row=r,column=2),center=False)
        for j,dxcol in zip([3,4,5,6,7],["D","E","F","G","H"]):
            c=ar.cell(row=r,column=j,value=f"=INDEX('DATA_X_ALL'!${dxcol}$2:${dxcol}${LASTDX},MATCH('02_PROFIL'!$B$3&\"|\"&$A{r},'DATA_X_ALL'!$A$2:$A${LASTDX},0))")
            style_body(c); c.number_format="0.00"; c.fill=PatternFill("solid",fgColor=YELLOW)
        # utility live thd global max/min
        for j,colX in zip([8,9,10,11,12],["C","D","E","F","G"]):
            f=(f"=IFERROR(IF('03_ALTERNATIF'!${colX}$19=\"Benefit\","
               f"({colX}{r}-${colX}${RMIN})/(${colX}${RMAX}-${colX}${RMIN}),"
               f"(${colX}${RMAX}-{colX}{r})/(${colX}${RMAX}-${colX}${RMIN})),1)")
            # NOTE: tipe diambil dari 03_ALTERNATIF J19:N19 (urutan C1..C5 = J..N) — mapping: C->J, D->K, E->L, F->M, G->N
            mp={"C":"J","D":"K","E":"L","F":"M","G":"N"}[colX]
            f=(f"=IFERROR(IF('03_ALTERNATIF'!${mp}$19=\"Benefit\","
               f"({colX}{r}-${colX}${RMIN})/(${colX}${RMAX}-${colX}${RMIN}),"
               f"(${colX}${RMAX}-{colX}{r})/(${colX}${RMAX}-${colX}${RMIN})),1)")
            c=ar.cell(row=r,column=j,value=f); style_body(c); c.number_format="0.00"
        # nilai global: bobot horizontal H228:L228 (link KRITERIA) agar SUMPRODUCT se-orientasi (baris×baris)
        c=ar.cell(row=r,column=13,value=f"=SUMPRODUCT($H{r}:$L{r},$H$228:$L$228)"); style_body(c,bold=True); c.number_format="0.0000"
        c=ar.cell(row=r,column=14,value=f"=RANK.EQ($M{r},$M$4:$M$224,0)"); style_body(c,bold=True)
        ar.row_dimensions[r].height=15
    # MAX/MIN/BOBOT global
    ar.cell(row=RMAX,column=1,value="MAX"); style_body(ar.cell(row=RMAX,column=1),bold=True); ar.merge_cells(start_row=RMAX,start_column=1,end_row=RMAX,end_column=2)
    ar.cell(row=RMIN,column=1,value="MIN"); style_body(ar.cell(row=RMIN,column=1),bold=True); ar.merge_cells(start_row=RMIN,start_column=1,end_row=RMIN,end_column=2)
    for j in range(3,8):
        col=get_column_letter(j)
        a1=ar.cell(row=RMAX,column=j,value=f"=MAX({col}4:{col}224)"); style_body(a1,bold=True); a1.fill=PatternFill("solid",fgColor=GREEN); a1.number_format="0.00"
        a2=ar.cell(row=RMIN,column=j,value=f"=MIN({col}4:{col}224)"); style_body(a2,bold=True); a2.fill=PatternFill("solid",fgColor=ORANGE); a2.number_format="0.00"
    ar.cell(row=RBOB,column=1,value="BOBOT ⇐ 01_KRITERIA"); style_body(ar.cell(row=RBOB,column=1),bold=True); ar.merge_cells(start_row=RBOB,start_column=1,end_row=RBOB,end_column=7)
    # bobot utk H..L (C1..C5) — tulis sbg link agar SUMPRODUCT di atas ikut berubah
    # (nilai bobot tidak ditampilkan per kolom di arsip; cukup dipakai di rumus M. tampilkan di H228:L228 sbg info)
    for j,code in enumerate(["C1","C2","C3","C4","C5"], start=8):
        r_ref={"C1":4,"C2":5,"C3":6,"C4":7,"C5":8}[code]
        c=ar.cell(row=RBOB,column=j,value=f"='01_KRITERIA'!F{r_ref}"); c.number_format="0.00%"; style_body(c,bold=True); c.fill=PatternFill("solid",fgColor=GRAYB)
    ar.cell(row=229,column=1,value="Evaluator aktif (link dropdown 02_PROFIL!B3):"); style_body(ar.cell(row=229,column=1),bold=True); ar.merge_cells(start_row=229,start_column=1,end_row=229,end_column=2)
    ar.cell(row=229,column=3,value="='02_PROFIL'!B3"); style_body(ar.cell(row=229,column=3),bold=True)
    ar.freeze_panes="C4"; ar.auto_filter.ref="A3:N224"
    ar.sheet_properties.pageSetUpPr=openpyxl.worksheet.properties.PageSetupProperties(fitToPage=True)
    ar.page_setup.fitToWidth=1; ar.page_setup.fitToHeight=0; ar.page_setup.orientation="landscape"

    # ================= 06_DASHBOARD =================
    d = wb.create_sheet("06_DASHBOARD"); d.sheet_properties.tabColor = GOLDF
    for col,w in zip("ABCDEF",[9,13,46,12,14,16]): d.column_dimensions[col].width=w
    title_block(d,1,6,"06 — DASHBOARD KEPUTUSAN (otomatis)","Top-5 via Rank Unik + INDEX-MATCH dari 04_SMARTER  •  Grafik Nilai 15 alternatif  •  Kesimpulan via &")
    section_head(d,3,6,"TOP-5 DEMO 15 ALTERNATIF (live — ganti dropdown evaluator / ubah bobot lalu lihat berubah)")
    for j,h in enumerate(["Rank Unik","Job ID (INDEX-MATCH)","Judul (INDEX-MATCH)","Nilai (INDEX-MATCH)","Status (IF)","Rank Global (VLOOKUP)"], start=1):
        c=d.cell(row=4,column=j,value=h); style_header(c)
    d.row_dimensions[4].height=36
    for i in range(1,6):
        r=4+i
        d.cell(row=r,column=1,value=i); style_body(d.cell(row=r,column=1),bold=True)
        d.cell(row=r,column=2,value=f"=INDEX('04_SMARTER'!$B$4:$B$18,MATCH($A{r},'04_SMARTER'!$L$4:$L$18,0))"); style_body(d.cell(row=r,column=2),bold=True)
        d.cell(row=r,column=3,value=f"=INDEX('04_SMARTER'!$C$4:$C$18,MATCH($A{r},'04_SMARTER'!$L$4:$L$18,0))"); style_body(d.cell(row=r,column=3),center=False)
        c=d.cell(row=r,column=4,value=f"=INDEX('04_SMARTER'!$J$4:$J$18,MATCH($A{r},'04_SMARTER'!$L$4:$L$18,0))"); style_body(c,bold=True); c.number_format="0.0000"; c.fill=PatternFill("solid",fgColor=LIGHT)
        d.cell(row=r,column=5,value=f'=IF($A{r}<=3,"★ Rekomendasi",IF($A{r}<=5,"○ Cadangan","—"))'); style_body(d.cell(row=r,column=5),center=False)
        d.cell(row=r,column=6,value=f"=VLOOKUP($B{r},'05_ARSIP_221'!$A$4:$N$224,14,FALSE)"); style_body(d.cell(row=r,column=6))
        d.row_dimensions[r].height=30
    d.cell(row=10,column=1,value="Evaluator aktif:"); style_body(d.cell(row=10,column=1),bold=True); d.merge_cells("A10:B10")
    d.cell(row=10,column=3,value="='02_PROFIL'!B3"); style_body(d.cell(row=10,column=3),bold=True)
    d.cell(row=10,column=4,value="=VLOOKUP(C10,'02_PROFIL'!$A$16:$B$64,2,FALSE)"); style_body(d.cell(row=10,column=4),center=False); d.merge_cells("D10:F10")
    section_head(d,11,6,"STATISTIK & INTERPRETASI (live)")
    stats=[("Rata2 Nilai 15", "=AVERAGE('04_SMARTER'!J4:J18)"),("Nilai tertinggi", "=MAX('04_SMARTER'!J4:J18)"),
           ("Nilai terendah", "=MIN('04_SMARTER'!J4:J18)"),("Simpangan (STDEV)", "=STDEV('04_SMARTER'!J4:J18)"),
           ("Jml ★ Rekomendasi", "=COUNTIF('04_SMARTER'!N4:N18,\"★*\")")]
    for i,(lbl,frm) in enumerate(stats, start=12):
        d.cell(row=i,column=1,value=lbl); style_body(d.cell(row=i,column=1),bold=True); d.merge_cells(start_row=i,start_column=1,end_row=i,end_column=2)
        c=d.cell(row=i,column=3,value=frm); style_body(c,bold=True); c.number_format="0.0000"; c.fill=PatternFill("solid",fgColor=GRAYB); d.merge_cells(start_row=i,start_column=3,end_row=i,end_column=3)
    d.merge_cells("D12:F16")
    c=d.cell(row=12,column=4); c.value='="Pemenang demo: "&B5&" ("&C5&") & "&B6&" ("&C6&"). Bawah demo: "&B9&". Bila kolom C5 seragam, C5 netral (utility=1 via IFERROR) dan keputusan ditentukan C1-C4. Ganti dropdown 02_PROFIL!B3 atau Rank di 01_KRITERIA untuk uji sensitivitas."'; c.font=Font(name="Calibri",size=10); c.alignment=Alignment(horizontal="left",vertical="center",wrap_text=True); c.border=BORDER
    d.merge_cells("A17:F17"); c=d.cell(row=17,column=1); c.value='="KESIMPULAN OTOMATIS: Juara 1 = "&B5&" — "&C5&" ("&TEXT(D5,"0.0000")&") | Juara 2 = "&B6&" — "&C6&" ("&TEXT(D6,"0.0000")&") | Lihat detail di 04_SMARTER."'
    c.fill=PatternFill("solid",fgColor=GOLDF); c.font=Font(name="Calibri",bold=True,size=11); c.alignment=Alignment(horizontal="center",vertical="center",wrap_text=True); c.border=BORDER
    d.row_dimensions[17].height=40
    d.merge_cells("A18:F20"); c=d.cell(row=18,column=1); c.value='="VALIDASI: file v4 (mock MHS-101) juaranya JOB-1174/JOB-1260; file ini evaluator "&\'02_PROFIL\'!B3&" juaranya "&B5&"/"&B6&" (real, bukan copy). Top-5 demo mengikuti dropdown; juara 221 sejati lihat 05_ARSIP_221 kolom N."'
    c.font=Font(name="Calibri",size=9,italic=True); c.alignment=Alignment(horizontal="left",vertical="center",wrap_text=True)
    # chart nilai 15 alternatif
    ch = BarChart(); ch.type="col"; ch.style=10; ch.title="Nilai SMARTER — 15 Alternatif Demo (mengikuti dropdown evaluator)"; ch.y_axis.title="Nilai"; ch.height=7.5; ch.width=15
    data = Reference(s4, min_col=10, min_row=3, max_row=18)  # termasuk header utk title
    cats = Reference(s4, min_col=2, min_row=4, max_row=18)
    ch.add_data(data, titles_from_data=True); ch.set_categories(cats)
    ch.shape=4; d.add_chart(ch, "A22")
    d.sheet_properties.pageSetUpPr=openpyxl.worksheet.properties.PageSetupProperties(fitToPage=True)
    d.page_setup.fitToWidth=1; d.page_setup.fitToHeight=1; d.page_setup.orientation="landscape"

    # urutan sheet + proteksi ringan (tanpa password) + print
    wb.active = wb["00_COVER"]
    out_p.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out_p)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Build SPK SMARTER Excel BARU dari data real")
    ap.add_argument("--evaluator", default="MHS-R050", help="ID mahasiswa real, mis. MHS-R014")
    args = ap.parse_args()
    main(args.evaluator)
