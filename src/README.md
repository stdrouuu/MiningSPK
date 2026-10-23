# src (pipeline data preparation)

| File | Tugas (mapping ke laporan) |
|---|---|
| `config.py` | Konstanta & path terpusat |
| `filtering.py` | 6 lapisan filtering (§2.3) |
| `imputation.py` | Missing values (§3.1) |
| `standardization.py` | Outlier & standardisasi (§3.2) |
| `encoding.py` | Encoding sistem kerja (§4.1) |
| `nlp.py` + `skill_similarity.py` | Text mining TF-IDF & cosine (§4.2) |
| `locations.py` | Standardisasi lokasi |
| `decision_matrix.py` | Matriks C1–C5 (§5) |
| `pipeline.py` | Orkestrasi `run_phase_3_pipeline()` |

Jalankan: `python -m src.pipeline` dari root.

## Posisi `src/` dalam CRISP-DM

Folder ini mencakup **Fase 3 (Data Preparation)**. Tahap selanjutnya diimplementasikan di luar `src/`:

| Fase | Implementasi |
|---|---|
| 4 — Modeling (bobot ROC + rank) | `web/src/lib/roc.ts`, `web/src/lib/priority.ts` |
| 4 — Modeling (matriks, normalisasi, skor SMARTER) | `web/src/lib/spk.ts` |
| 4 — Sensitivitas | `web/src/lib/sensitivity.ts` |
| 5 — Evaluation | `scripts/eval_spk.py` |
