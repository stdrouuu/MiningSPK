export type CriterionKey =
  | 'C1_kategori'
  | 'C2_gaji'
  | 'C3_lokasi'
  | 'C4_jam_kerja'
  | 'C5_skill'

export type Stars = Record<CriterionKey, number>
export type Ranks = Record<CriterionKey, number>

export type VerificationStatus = 'accepted_initial' | 'edited' | 'pending'

export interface RankGroup {
  rank: number
  keys: CriterionKey[]
}

export interface SessionRecord {
  timestamp: string
  profile: {
    minSalary: number
    maxHours: number
    location: string
    preferredCategory: string
    skills: string
  }
  initialRanks: Ranks
  finalRanks: Ranks
  status: VerificationStatus
  editCount: number
  top3: string[]
}

const SESSION_KEY = 'upmatch-kuesioner-sessions'

export function loadSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSession(rec: SessionRecord): SessionRecord[] {
  const all = [...loadSessions(), rec]
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(all))
  } catch {
    /* abaikan kuota penuh */
  }
  return all
}

export function acceptanceRate(sessions: SessionRecord[]): number | null {
  if (!sessions.length) return null
  const ok = sessions.filter((s) => s.status === 'accepted_initial').length
  return ok / sessions.length
}
