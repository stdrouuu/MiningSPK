# Scripts (sekali jalan / utilitas)

| File | Tugas |
|---|---|
| `generate_raw_data.py` | Scraping 4 portal + bangun `data/raw/raw-jobs/` + `data/raw/raw-mock-students/` |
| `refresh_job_candidates.py` | Kumpulkan kandidat part-time terbaru, validasi halaman detail, dan ekspor CSV untuk ditinjau |
| `process_gform.py` | Export GForm → `data/raw/raw-real-students/raw_real_student_preferences.csv` |
| `eval_spk.py` | Evaluasi stabilitas ranking + eksperimen n-gram + sensitivitas C1 (`--source mock\|real`) |
| `build_notebook.py` | Generate `notebooks/phase_3_data_preparation.ipynb` |
| `enrich_company_logos.py` | Tambah kolom `company_logo` dari JSON-LD portal |
| `sync_web_data.py` | Salin `data/processed/` → `web/public/data/` (`--source mock\|real`) |

## Refresh lowongan

Dari root repo, jalankan `python -m scripts.refresh_job_candidates --target 1000`.
Default-nya mengambil kandidat maksimal berusia 30 hari dan menulis
`data/raw/raw-jobs/refresh_candidates.csv`. Gunakan `--output` untuk nama
file lain. Jalur ini memakai halaman detail untuk memeriksa tipe pekerjaan,
lokasi, tanggal posting, dan sinyal lamaran aktif. Gaji per jam dan jam
mingguan yang tidak tercantum dibiarkan kosong.

Periksa ringkasan kategori, alasan penolakan, serta kelengkapan gaji dan jam
sebelum memakai CSV sebagai input pipeline Fase 3. Pipeline lama mengimputasi
nilai kosong dan menyinkronkan hasil ke web. Refresh ini hanya membuat
CSV kandidat.
