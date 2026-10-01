"""Text preprocessing NLP untuk keahlian (Section 4.2 / Tahap Text Mining)."""

import re

import pandas as pd

STOPWORDS_ID_EN = {
    # Indonesian stopwords
    "dan", "di", "ke", "dari", "untuk", "pada", "dengan", "adalah", "sebagai", "yang",
    "atau", "ini", "itu", "dalam", "bisa", "akan", "dapat", "kami", "anda", "saya",
    "secara", "karena", "oleh", "tentang", "setiap", "serta", "juga", "bagi", "agar",
    "supaya", "kalian", "mereka", "kita", "yaitu", "yakni", "baik", "antara", "saat",
    "bila", "jika", "kalau", "namun", "tetapi", "melalui", "terhadap", "tanpa", "dasar",

    # English stopwords
    "and", "in", "to", "for", "with", "is", "as", "the", "or", "this", "that", "at",
    "from", "by", "an", "be", "on", "are", "of", "all", "any", "our", "you", "your",
    "we", "will", "can", "their", "into", "through", "about", "such",
}


def clean_text_nlp(text):
    """
    NLP Preprocessing:
    1. Case Folding (lowercase)
    2. Punctuation & Symbol Removal
    3. Tokenization & Whitespace Normalization
    4. Stopword Removal (ID & EN)
    """
    if pd.isna(text) or not str(text).strip():
        return ""

    # 1. Lowercase
    text = str(text).lower()

    # 2. Hapus simbol, tanda baca, bullet point, dan angka
    text = re.sub(r'[^a-zA-Z\s]', ' ', text)

    # 3. Tokenisasi sederhana & buang stopword
    tokens = text.split()
    filtered_tokens = [tok for tok in tokens if tok not in STOPWORDS_ID_EN and len(tok) > 1]

    return " ".join(filtered_tokens)
