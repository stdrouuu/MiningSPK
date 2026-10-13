// Port 1:1 dari src/nlp.py — WAJIB identik agar C5 web = C5 pipeline (G1).
// Aturan: lowercase → ganti non-huruf jadi spasi → buang stopwords ID+EN → buang token ≤1 huruf.

export const STOPWORDS_ID_EN: ReadonlySet<string> = new Set([
  // Indonesian stopwords
  'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'adalah', 'sebagai', 'yang',
  'atau', 'ini', 'itu', 'dalam', 'bisa', 'akan', 'dapat', 'kami', 'anda', 'saya',
  'secara', 'karena', 'oleh', 'tentang', 'setiap', 'serta', 'juga', 'bagi', 'agar',
  'supaya', 'kalian', 'mereka', 'kita', 'yaitu', 'yakni', 'baik', 'antara', 'saat',
  'bila', 'jika', 'kalau', 'namun', 'tetapi', 'melalui', 'terhadap', 'tanpa', 'dasar',
  // English stopwords
  'and', 'in', 'to', 'for', 'with', 'is', 'as', 'the', 'or', 'this', 'that', 'at',
  'from', 'by', 'an', 'be', 'on', 'are', 'of', 'all', 'any', 'our', 'you', 'your',
  'we', 'will', 'can', 'their', 'into', 'through', 'about', 'such',
])

/** Sama persis dengan clean_text_nlp() di src/nlp.py. */
export function cleanTextNlp(text: string | null | undefined): string {
  if (text == null || String(text).trim() === '') return ''
  // 1. Lowercase
  let t = String(text).toLowerCase()
  // 2. Hapus simbol/tanda baca/angka -> spasi (bukan hapus mentah, batas kata terjaga)
  t = t.replace(/[^a-zA-Z\s]/g, ' ')
  // 3. Tokenisasi + buang stopword + token ≤1 huruf
  return t
    .split(/\s+/)
    .filter((tok) => tok.length > 1 && !STOPWORDS_ID_EN.has(tok))
    .join(' ')
}
