import type { CriterionKey, RankGroup, Ranks, Stars } from '../types/priority'

export interface CriterionMeta {
  key: CriterionKey
  title: string
  desc: string
  example: string
}

export const CRITERIA: CriterionMeta[] = [
  {
    key: 'C1_kategori',
    title: 'Kesesuaian Bidang',
    desc: 'Seberapa penting lowongan sesuai minat bidangmu?',
    example: 'Contoh: kamu minat Tutor, lowongan Tutor dinilai cocok.',
  },
  {
    key: 'C2_gaji',
    title: 'Upah per Jam',
    desc: 'Seberapa penting upah tinggi per jam?',
    example: 'Contoh: Rp 50rb/jam lebih menarik dari Rp 25rb/jam.',
  },
  {
    key: 'C3_lokasi',
    title: 'Lokasi & Moda Kerja',
    desc: 'Seberapa penting dekat domisili / bisa remote?',
    example: 'Contoh: Remote atau Jakarta Barat kalau kamu di sana.',
  },
  {
    key: 'C4_jam_kerja',
    title: 'Cocok Jam Kuliah',
    desc: 'Seberapa penting jam kerja pas dengan jam idealmu?',
    example: 'Contoh: ideal 18 jam/mgg → lowongan 18 jam paling cocok.',
  },
  {
    key: 'C5_skill',
    title: 'Kecocokan Skill',
    desc: 'Seberapa penting sesuai keahlianmu?',
    example: 'Contoh: bisa Canva → lowongan butuh Canva lebih cocok.',
  },
]

export const ALL_KEYS: CriterionKey[] = CRITERIA.map((c) => c.key)

export const DEFAULT_STARS: Stars = {
  C1_kategori: 3,
  C2_gaji: 3,
  C3_lokasi: 3,
  C4_jam_kerja: 3,
  C5_skill: 3,
}

/**
 * Bintang 1–5 → rank kompetisi (skor sama = rank sama).
 * Mis. bintang {5,5,3,3,1} → rank {1,1,3,3,5}.
 */
export function starsToRanks(stars: Stars): { ranks: Ranks; groups: RankGroup[] } {
  const keys = ALL_KEYS.slice().sort((a, b) => stars[b] - stars[a])
  const ranks = {} as Ranks
  const groups: RankGroup[] = []
  let pos = 1
  let i = 0
  while (i < keys.length) {
    let j = i
    while (j + 1 < keys.length && stars[keys[j + 1]] === stars[keys[i]]) j++
    const groupKeys = keys.slice(i, j + 1)
    const rank = pos
    groupKeys.forEach((k) => {
      ranks[k] = rank
    })
    groups.push({ rank, keys: groupKeys })
    pos += groupKeys.length
    i = j + 1
  }
  return { ranks, groups }
}

/** Poin pairwise (tiap menang = 1) → rank kompetisi. Poin sama = seri. */
export function pointsToRanks(points: Record<CriterionKey, number>): { ranks: Ranks; groups: RankGroup[] } {
  const stars = {} as Stars
  ALL_KEYS.forEach((k) => {
    stars[k] = points[k] ?? 0
  })
  return starsToRanks(stars)
}

/** 10 pasangan kriteria untuk kuis "Saya bingung" (C(5,2) = 10). */
export const PAIRWISE_PAIRS: Array<[CriterionKey, CriterionKey]> = [  ['C1_kategori', 'C2_gaji'],
  ['C1_kategori', 'C3_lokasi'],
  ['C1_kategori', 'C4_jam_kerja'],
  ['C1_kategori', 'C5_skill'],
  ['C2_gaji', 'C3_lokasi'],
  ['C2_gaji', 'C4_jam_kerja'],
  ['C2_gaji', 'C5_skill'],
  ['C3_lokasi', 'C4_jam_kerja'],
  ['C3_lokasi', 'C5_skill'],
  ['C4_jam_kerja', 'C5_skill'],
]

export function metaOf(key: CriterionKey): CriterionMeta {
  return CRITERIA.find((c) => c.key === key)!
}

/**
 * Skor → rank UNIK 1–5 (SMARTER murni, tanpa seri).
 * Seri dipecah deterministik pakai urutan tetap:
 * Upah > Lokasi > Bidang > Jam > Skill.
 */
export const TIEBREAK_PRECEDENCE: CriterionKey[] = [
  'C2_gaji',
  'C3_lokasi',
  'C1_kategori',
  'C4_jam_kerja',
  'C5_skill',
]

export function strictRanks(scores: Record<CriterionKey, number>): Ranks {
  const keys = ALL_KEYS.slice().sort(
    (a, b) =>
      scores[b] - scores[a] ||
      TIEBREAK_PRECEDENCE.indexOf(a) - TIEBREAK_PRECEDENCE.indexOf(b)
  )
  const ranks = {} as Ranks
  keys.forEach((k, i) => {
    ranks[k] = i + 1
  })
  return ranks
}

/** Kelompokkan rank map menjadi grup untuk tampilan "Rank sama". */
export function groupRanks(ranks: Ranks): RankGroup[] {  const keys = ALL_KEYS.slice().sort((a, b) => ranks[a] - ranks[b])
  const groups: RankGroup[] = []
  let i = 0
  while (i < keys.length) {
    let j = i
    while (j + 1 < keys.length && ranks[keys[j + 1]] === ranks[keys[i]]) j++
    groups.push({ rank: ranks[keys[i]], keys: keys.slice(i, j + 1) })
    i = j + 1
  }
  return groups
}
