import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
ARCH = ROOT / "docs" / "assets_laporan" / "arsitektur_spk.png"
GANTT = ROOT / "docs" / "assets_laporan" / "gantt_jadwal.png"

# arch clean serpentine
fig, ax = plt.subplots(figsize=(10, 4.8))
ax.set_xlim(0, 10); ax.set_ylim(0, 6); ax.axis("off")
top = [
    (0.2, 3.5, 2.1, 1.2, "Profil\nMahasiswa\nminat, gaji min,\ndomisili, jam, skill", "#DBEAFE"),
    (2.7, 3.5, 2.1, 1.2, "Rank Kriteria\nC1-C5 unik 1-5\n+ kuis pairwise", "#FEF3C7"),
    (5.2, 3.5, 2.0, 1.2, "Bobot ROC\nw = (1/K) sum 1/k\nK=5", "#E0E7FF"),
    (7.6, 3.5, 2.1, 1.2, "Matriks X\n221 x 5, C1-C5\nrelatif profil", "#DCFCE7"),
]
bot = [
    (7.6, 1.4, 2.1, 1.2, "Utilitas linear\nu=(X-min)/(max-min)", "#FCE7F3"),
    (5.2, 1.4, 2.0, 1.2, "Skor U = sum w*u\n+ Ranking 1-221", "#E0F2FE"),
    (2.7, 1.4, 2.1, 1.2, "Sensitivitas\n5 skenario leader\ntop-3", "#FFEDD5"),
    (0.2, 1.4, 2.1, 1.2, "Verifikasi\nSetuju / Atur\nsendiri", "#DCFCE7"),
]
for x, y, w, h, txt, col in top + bot:
    r = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.03", facecolor=col, edgecolor="#334155", linewidth=1.2)
    ax.add_patch(r)
    ax.text(x+w/2, y+h/2, txt, ha="center", va="center", fontsize=7.5, weight="bold", color="#0F172A", linespacing=1.35)
def arr(x1, y1, x2, y2):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle="->", color="#0F172A", lw=1.5))
# top left->right
arr(2.3, 4.1, 2.7, 4.1); arr(4.8, 4.1, 5.2, 4.1); arr(7.2, 4.1, 7.6, 4.1)
# down right
arr(8.65, 3.5, 8.65, 2.6)
# bottom right->left
arr(7.6, 2.0, 7.2, 2.0); arr(5.2, 2.0, 4.8, 2.0); arr(2.7, 2.0, 2.3, 2.0)
ax.text(5, 5.4, "Arsitektur SPK SMARTER: Input -> Model -> Output -> Rekomendasi", ha="center", fontsize=9.5, weight="bold")
ax.text(5, 0.75, "221 lowongan dinilai personal per mahasiswa; min-max atas full-set; tie-breaker skor > C2 > C5 > job_id", ha="center", fontsize=7, color="#475569")
plt.tight_layout(); fig.savefig(ARCH, dpi=220, bbox_inches="tight"); plt.close()
print("arch ok", ARCH)

# gantt chronological, task1 at top
tasks = [
    ("1. Diskusi topik & konsep", 0.0, 1.0, "#1D4ED8"),
    ("2. Sumber data & atribut", 1.0, 1.0, "#1D4ED8"),
    ("3. Scraping 4 portal (535)", 2.0, 1.5, "#1D4ED8"),
    ("4. Cleaning 6 lapis (->221)", 3.0, 1.5, "#1D4ED8"),
    ("5. Kuesioner mock (55->52)", 2.5, 1.2, "#64748B"),
    ("6. GForm riil (50->49)", 4.2, 2.0, "#059669"),
    ("7. Matriks C1-C5 + TF-IDF", 5.5, 1.5, "#059669"),
    ("8. Spreadsheet v4+R008/R050", 6.5, 1.2, "#059669"),
    ("9. Portal web ROC+ranking", 6.8, 1.5, "#7C3AED"),
    ("10. Evaluasi & Laporan UTS", 7.8, 1.0, "#DC2626"),
]
fig, ax = plt.subplots(figsize=(10, 4.8))
n = len(tasks)
for i, (label, s, d, c) in enumerate(tasks):
    y = n-1-i
    ax.barh(y, d, left=s, height=0.55, color=c, edgecolor="white")
    ax.text(s+d/2, y, f"{d:.1f} mg", ha="center", va="center", fontsize=6.5, color="white", weight="bold")
ax.set_yticks(list(range(n)))
ax.set_yticklabels([t[0] for t in reversed(tasks)], fontsize=8)
ax.set_xticks(list(range(0, 10)))
ax.set_xticklabels(["9 Sep\nMg1","17 Sep\nMg2","24 Sep\nMg3","1 Okt\nMg4","4 Okt\nMg5","7 Okt\nMg6","10 Okt\nMg7","12 Okt\nMg8","13 Okt\nMg9","14 Okt\nMg10"], fontsize=7)
ax.set_xlabel("Waktu (9 Sep - 14 Okt 2026)", fontsize=8)
ax.set_title("Jadwal Kegiatan SPK Part-Time SMARTER (9 Sep - 14 Okt 2026)", fontsize=10, weight="bold", pad=10)
ax.grid(axis="x", linestyle="--", alpha=0.4)
ax.set_xlim(0, 9); ax.set_ylim(-0.7, n-0.3)
plt.tight_layout(); fig.savefig(GANTT, dpi=220, bbox_inches="tight"); plt.close()
print("gantt ok", GANTT)
