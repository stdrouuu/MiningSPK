import type { CleanJob, RankedJobResult } from '../types/data'
import type { StudentPreferences } from '../types/portal'
import type { CriterionKey, Ranks } from '../types/priority'
import { ALL_KEYS, metaOf } from './priority'
import { computeSPKForCustomStudent } from './spk'
import type { TfidfArtifact } from './spk'

export interface LeaderScenario {
  leader: CriterionKey
  leaderTitle: string
  ranks: Ranks
  top3: RankedJobResult[]
}

/**
 * 5 skenario "pemimpin tunggal": tiap kriteria sekali jadi rank 1,
 * sisanya mengikuti urutan pengguna (rank unik 2..5).
 */
export function leaderRanks(userRanks: Ranks, leader: CriterionKey): Ranks {
  const rest = ALL_KEYS.filter((k) => k !== leader).sort(
    (a, b) => userRanks[a] - userRanks[b]
  )
  const out = {} as Ranks
  out[leader] = 1
  rest.forEach((k, i) => {
    out[k] = i + 2
  })
  return out
}

function toSpkRank(r: Ranks): StudentPreferences['priorityRank'] {
  return {
    C1_kategori: r.C1_kategori,
    C2_gaji: r.C2_gaji,
    C3_lokasi: r.C3_lokasi,
    C4_jam_kerja: r.C4_jam_kerja,
    C5_skill: r.C5_skill,
  }
}

export function computeLeaderScenarios(
  jobs: CleanJob[],
  prefs: StudentPreferences,
  userRanks: Ranks,
  tfidf?: TfidfArtifact | null
): LeaderScenario[] {
  return ALL_KEYS.map((leader) => {
    const ranks = leaderRanks(userRanks, leader)
    const ranked = computeSPKForCustomStudent(jobs, {
      ...prefs,
      priorityRank: toSpkRank(ranks),
    }, tfidf)
    return {
      leader,
      leaderTitle: metaOf(leader).title,
      ranks,
      top3: ranked.slice(0, 3),
    }
  })
}

/**
 * Pesan narasi ringan, mis:
 * "Lowongan B unggul bila Anda mengutamakan lokasi; A unggul bila mengutamakan gaji."
 */
export function sensitivityMessage(scenarios: LeaderScenario[]): string {
  if (!scenarios.length) return ''
  const winners = new Map<string, string[]>()
  scenarios.forEach((s) => {
    const w = s.top3[0]
    if (!w) return
    const list = winners.get(w.job_id) ?? []
    list.push(s.leaderTitle)
    winners.set(w.job_id, list)
  })
  if (winners.size <= 1) {
    const only = scenarios[0]?.top3[0]
    return only
      ? `Rekomendasi stabil: ${only.job_title} tetap juara di semua skenario prioritas.`
      : 'Belum ada hasil untuk dianalisis.'
  }
  const parts: string[] = []
  scenarios.forEach((s) => {
    const w = s.top3[0]
    if (w) parts.push(`${w.job_title} unggul bila ${s.leaderTitle.toLowerCase()} diutamakan`)
  })
  // ringkas: ambil 2 contoh berbeda
  const seen = new Set<string>()
  const uniq: string[] = []
  parts.forEach((p) => {
    const key = p.split(' unggul')[0]
    if (!seen.has(key)) {
      seen.add(key)
      uniq.push(p)
    }
  })
  return uniq.slice(0, 3).join('; ') + '.'
}
