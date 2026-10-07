// ─── DiceBear avatar helper (https://github.com/dicebear/dicebear) ───────────
// Menggunakan DiceBear HTTP API v9 (https://api.dicebear.com/9.x) untuk
// menghasilkan avatar SVG deterministik per mahasiswa.
// Tidak perlu dependensi tambahan — cukup URL gambar.

export const AVATAR_STYLES = [
  'adventurer',
  'avataaars',
  'big-ears',
  'big-smile',
  'bottts',
  'croodles',
  'fun-emoji',
  'lorelei',
  'micah',
  'miniavs',
  'notionists',
  'open-peeps',
  'personas',
  'pixel-art',
  'thumbs',
] as const

export type AvatarStyle = (typeof AVATAR_STYLES)[number]

// Palet background DiceBear (tanpa '#')
export const AVATAR_BACKGROUNDS = [
  'b6e3f4',
  'c0aede',
  'd1d4f9',
  'ffd5dc',
  'ffdfbf',
  'c7f2c7',
  'fff3b0',
  'e6e6e6',
  'ffcabf',
  'bde3c3',
] as const

function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** Pilih style + background deterministik dari sebuah key (mis. NIM). */
export function pickAvatarForKey(key: string): { style: AvatarStyle; background: string } {
  const h = hashString(key || 'mahasiswa')
  return {
    style: AVATAR_STYLES[h % AVATAR_STYLES.length],
    background: AVATAR_BACKGROUNDS[Math.floor(h / AVATAR_STYLES.length) % AVATAR_BACKGROUNDS.length],
  }
}

/** Bangun URL DiceBear dari style + seed. */
export function diceBearUrl(style: string, seed: string, background?: string): string {
  const s = (style || 'adventurer').trim() || 'adventurer'
  const params = new URLSearchParams()
  params.set('seed', seed || 'mahasiswa')
  if (background) params.set('backgroundColor', background)
  return `https://api.dicebear.com/9.x/${encodeURIComponent(s)}/svg?${params.toString()}`
}

/** Avatar deterministik untuk profil contoh mahasiswa (beda-beda tiap mahasiswa). */
export function avatarForStudent(studentId: string, studentName: string): string {
  const { style, background } = pickAvatarForKey(studentId || studentName)
  return diceBearUrl(style, studentId || studentName, background)
}

/**
 * Style avatar acak. Dipakai sekali saat profil dibuat manual agar hasilnya
 * terkunci di state (tidak berganti-ganti tiap render).
 */
export function randomAvatarStyle(): AvatarStyle {
  return AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)]
}

/** Avatar untuk preferensi aktif — hormati pilihan custom, fallback deterministik. */
export function avatarForPrefs(prefs: {
  nim?: string
  name?: string
  avatarStyle?: string
  avatarSeed?: string
}): string {
  const seed = prefs.avatarSeed || prefs.nim || prefs.name || 'mahasiswa'
  if (prefs.avatarStyle) {
    const { background } = pickAvatarForKey(seed)
    return diceBearUrl(prefs.avatarStyle, seed, background)
  }
  return avatarForStudent(prefs.nim || '', prefs.name || seed)
}
