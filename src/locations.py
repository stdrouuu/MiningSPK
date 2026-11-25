"""Standardisasi teks lokasi Jabodetabek & Remote (Section 3.2)."""

import pandas as pd


def standardize_location(loc_str, work_system=""):
    """Standardisasi Format Teks Lokasi Jabodetabek & Remote."""
    if str(work_system).strip().lower() == "remote":
        return "Remote"
    if pd.isna(loc_str):
        return "Remote"

    loc_clean = str(loc_str).strip().lower()
    if "remote" in loc_clean:
        return "Remote"

    if any(k in loc_clean for k in ["jakbar", "jkt barat", "tanjung duren", "grogol", "kebon jeruk", "jakarta barat", "west jakarta"]):
        return "Jakarta Barat"
    elif any(k in loc_clean for k in ["jaksel", "jkt selatan", "jakarta selatan", "south jakarta"]):
        return "Jakarta Selatan"
    elif any(k in loc_clean for k in ["jakpus", "jkt pusat", "jakarta pusat", "central jakarta"]):
        return "Jakarta Pusat"
    elif any(k in loc_clean for k in ["jaktim", "jkt timur", "jakarta timur", "east jakarta"]):
        return "Jakarta Timur"
    elif any(k in loc_clean for k in ["jakut", "jkt utara", "jakarta utara", "north jakarta"]):
        return "Jakarta Utara"
    elif any(k in loc_clean for k in ["tangsel", "tangerang selatan", "south tangerang"]):
        return "Tangerang Selatan"
    elif "tangerang" in loc_clean:
        return "Tangerang"
    elif "depok" in loc_clean:
        return "Depok"
    elif "bekasi" in loc_clean:
        return "Bekasi"
    elif "bogor" in loc_clean:
        return "Bogor"
    else:
        return "Non-Jabodetabek"
