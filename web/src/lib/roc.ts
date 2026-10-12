import type { CriterionKey } from '../types/priority'

export type RankMap = Record<CriterionKey, number>

/** Bobot ROC posisi p untuk K kriteria: ROC(p) = (1/K) * Σ_{k=p..K} 1/k */
export function rocPositionWeight(p: number, K = 5): number {
  let sum = 0
  for (let k = p; k <= K; k++) sum += 1 / k
  return sum / K
}

/** Daftar bobot posisi 1..K (default K=5 → 0.4567 / 0.2567 / 0.1567 / 0.09 / 0.04). */
export function rocWeights(K = 5): number[] {
  return Array.from({ length: K }, (_, i) => rocPositionWeight(i + 1, K))
}

/**
 * Bobot ROC dengan rank sama (seri).
 * Kriteria yang berbagi nilai rank yang sama menempati posisi berurutan
 * lalu berbagi rata-rata bobot posisi tersebut. Total bobot tetap 1.
 *
 * Contoh: Gaji & Jam rank 1 (posisi 1–2) → (0.4567+0.2567)/2 = 0.3567 masing-masing.
 */
export function weightsWithTies(ranks: RankMap, K = 5): Record<CriterionKey, number> {
  const keys = Object.keys(ranks) as CriterionKey[]
  const sorted = [...keys].sort((a, b) => ranks[a] - ranks[b])

  const out = {} as Record<CriterionKey, number>
  let pos = 1
  let i = 0
  while (i < sorted.length) {
    let j = i
    while (j + 1 < sorted.length && ranks[sorted[j + 1]] === ranks[sorted[i]]) j++
    const groupSize = j - i + 1
    const positions: number[] = []
    for (let t = 0; t < groupSize && pos <= K; t++, pos++) positions.push(pos)
    const avg = positions.reduce((s, p) => s + rocPositionWeight(p, K), 0) / Math.max(1, positions.length)
    for (let t = i; t <= j; t++) out[sorted[t]] = Number(avg.toFixed(4))
    i = j + 1
  }
  return out
}

/** Bobot dalam persen string, mis. 0.4567 → "45.7%". */
export function weightPct(w: number): string {
  return `${(w * 100).toFixed(1)}%`
}
