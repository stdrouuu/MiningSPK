# Scripts (sekali jalan / utilitas)

| File | Tugas |
|---|---|
| `generate_raw_data.py` | Scraping 4 portal + bangun `data/raw/raw-jobs/` + `data/raw/raw-mock-students/` |
| `process_gform.py` | Export GForm → `data/raw/raw-real-students/raw_real_student_preferences.csv` |
| `eval_spk.py` | Evaluasi stabilitas ranking + eksperimen n-gram + sensitivitas C1 (`--source mock\|real`) |
| `build_notebook.py` | Generate `notebooks/phase_3_data_preparation.ipynb` |
| `enrich_company_logos.py` | Tambah kolom `company_logo` dari JSON-LD portal |
| `sync_web_data.py` | Salin `data/processed/` → `web/public/data/` (`--source mock\|real`) |
