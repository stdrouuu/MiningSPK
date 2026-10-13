import Papa from 'papaparse'
import type { CleanJob, StudentProfile, DecisionMatrixRow, RankedJobResult } from '../types/data'
import type { CriterionKey } from '../types/priority'
import { cleanTextNlp } from './nlp'
import { weightsWithTies } from './roc'

/** Cap rasio gaji sebelum normalisasi (samakan src/config.py C2_RATIO_CAP). */
export const C2_RATIO_CAP = 2.0

/** Artefak TF-IDF dari pipeline (data/processed/matrix/tfidf_skills.json). */
export interface TfidfArtifact {
  vocabulary: Record<string, number>
  idf: number[]
  ngram_range?: [number, number]
}

export function calculateRocWeights(ranks: { [key: string]: number }): { [key: string]: number } {
  const K = 5
  const weights: { [key: string]: number } = {}

  Object.entries(ranks).forEach(([key, rank]) => {
    let sum = 0
    for (let i = rank; i <= K; i++) {
      sum += 1 / i
    }
    weights[key] = sum / K
  })

  return weights
}

// Tokenize and calculate simple cosine similarity for skills on the fly
// (LEGACY fallback bila artefak TF-IDF belum termuat — hasilnya TIDAK sama
// dengan pipeline; jangan pakai untuk perbandingan resmi.)
export function computeSkillSimilarity(studentSkills: string, jobSkills: string): number {
  if (!studentSkills || !jobSkills) return 0

  const tokenize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)

  const sTokens = tokenize(studentSkills)
  const jTokens = tokenize(jobSkills)

  if (sTokens.length === 0 || jTokens.length === 0) return 0

  const sFreq = new Map<string, number>()
  const jFreq = new Map<string, number>()
  const allTerms = new Set<string>()

  sTokens.forEach((t) => {
    sFreq.set(t, (sFreq.get(t) || 0) + 1)
    allTerms.add(t)
  })
  jTokens.forEach((t) => {
    jFreq.set(t, (jFreq.get(t) || 0) + 1)
    allTerms.add(t)
  })

  let dotProduct = 0
  let normS = 0
  let normJ = 0

  allTerms.forEach((term) => {
    const s = sFreq.get(term) || 0
    const j = jFreq.get(term) || 0
    dotProduct += s * j
    normS += s * s
    normJ += j * j
  })

  if (normS === 0 || normJ === 0) return 0
  return dotProduct / (Math.sqrt(normS) * Math.sqrt(normJ))
}

/**
 * Cosine similarity TF-IDF yang IDENTIK dengan pipeline (G1).
 * Tokenizer + stopwords = cleanTextNlp (port src/nlp.py); token <2 huruf
 * dibuang mengikuti token_pattern sklearn (?u)\b\w\w+\b; tf = count mentah,
 * idf dari artefak (smooth_idf sklearn), normalisasi L2.
 */
export function computeTfidfSimilarity(
  studentSkills: string,
  jobSkills: string,
  artifact: TfidfArtifact | null | undefined
): number {
  if (!artifact) return computeSkillSimilarity(studentSkills, jobSkills)

  const toVector = (text: string): Map<number, number> => {
    const counts = new Map<number, number>()
    for (const tok of cleanTextNlp(text).split(/\s+/)) {
      if (tok.length < 2) continue
      const idx = artifact.vocabulary[tok]
      if (idx === undefined) continue
      counts.set(idx, (counts.get(idx) || 0) + 1)
    }
    const vec = new Map<number, number>()
    let norm = 0
    counts.forEach((tf, idx) => {
      const v = tf * (artifact.idf[idx] ?? 0)
      vec.set(idx, v)
      norm += v * v
    })
    norm = Math.sqrt(norm)
    if (norm === 0) return new Map()
    vec.forEach((v, idx) => vec.set(idx, v / norm))
    return vec
  }

  const sVec = toVector(studentSkills || '')
  const jVec = toVector(jobSkills || '')
  if (sVec.size === 0 || jVec.size === 0) return 0

  let dot = 0
  const [small, big] = sVec.size <= jVec.size ? [sVec, jVec] : [jVec, sVec]
  small.forEach((v, idx) => {
    const w = big.get(idx)
    if (w !== undefined) dot += v * w
  })
  return dot
}

export function buildDecisionMatrixForStudent(
  jobs: CleanJob[],
  student: StudentProfile,
  tfidf?: TfidfArtifact | null
): DecisionMatrixRow[] {
  return jobs.map((job) => {
    // C1: Kategori
    const c1 = job.job_category.trim().toLowerCase() === student.preferred_category.trim().toLowerCase() ? 1.0 : 0.3

    // C2: Rasio Gaji (di-cap seperti pipeline)
    const expectedSalary = student.min_expected_salary || 35000
    const c2 = Number(Math.min(job.work_salaryperhour / expectedSalary, C2_RATIO_CAP).toFixed(4))

    // C3: Lokasi & Moda Kerja
    let c3 = 0.4
    const jobLoc = job.work_job_location.toLowerCase()
    const studentLoc = (student.student_location_clean || student.student_location).toLowerCase()

    if (job.work_system.toLowerCase() === 'remote' || jobLoc === studentLoc || jobLoc.includes(studentLoc)) {
      c3 = 1.0
    } else if (jobLoc.includes('jakarta') && studentLoc.includes('jakarta')) {
      c3 = 0.8
    } else {
      c3 = 0.4
    }

    // C4: Kesesuaian Jam Kerja
    const expectedHours = student.student_expected_work_hour || 18
    const diffHours = Math.abs(job.work_hours - expectedHours)
    const c4 = Number(Math.max(0.0, 1.0 - diffHours / 20.0).toFixed(4))

    // C5: Kemiripan Skill (TF-IDF pipeline bila artefak tersedia)
    const c5 = Number(
      computeTfidfSimilarity(
        student.clean_student_skills || student.student_skills,
        job.clean_required_skills || job.work_required_skills,
        tfidf
      ).toFixed(4)
    )

    return {
      job_id: job.job_id,
      job_title: job.job_title,
      company_name: job.company_name,
      company_logo: job.company_logo,
      job_category: job.job_category,
      work_job_location: job.work_job_location,
      work_system: job.work_system,
      work_salaryperhour: job.work_salaryperhour,
      work_hours: job.work_hours,
      C1_kategori: c1,
      C2_rasio_gaji: c2,
      C3_lokasi: c3,
      C4_jam_kerja: c4,
      C5_kemiripan_skill: c5,
      url: job.url,
      source_portal: job.source_portal,
      date_posted: job.date_posted,
      work_required_skills: job.work_required_skills,
      clean_required_skills: job.clean_required_skills,
    }
  })
}

export function computeSmarter(
  matrix: DecisionMatrixRow[],
  weights: { [key: string]: number }
): RankedJobResult[] {
  if (!matrix.length) return []

  // Hitung Min dan Max untuk setiap kriteria
  const c1Vals = matrix.map((m) => m.C1_kategori)
  const c2Vals = matrix.map((m) => m.C2_rasio_gaji)
  const c3Vals = matrix.map((m) => m.C3_lokasi)
  const c4Vals = matrix.map((m) => m.C4_jam_kerja)
  const c5Vals = matrix.map((m) => m.C5_kemiripan_skill)

  const min1 = Math.min(...c1Vals), max1 = Math.max(...c1Vals)
  const min2 = Math.min(...c2Vals), max2 = Math.max(...c2Vals)
  const min3 = Math.min(...c3Vals), max3 = Math.max(...c3Vals)
  const min4 = Math.min(...c4Vals), max4 = Math.max(...c4Vals)
  const min5 = Math.min(...c5Vals), max5 = Math.max(...c5Vals)

  const normalize = (val: number, min: number, max: number) => {
    if (max === min) return 1.0
    return (val - min) / (max - min)
  }

  const results: RankedJobResult[] = matrix.map((row) => {
    const u1 = normalize(row.C1_kategori, min1, max1)
    const u2 = normalize(row.C2_rasio_gaji, min2, max2)
    const u3 = normalize(row.C3_lokasi, min3, max3)
    const u4 = normalize(row.C4_jam_kerja, min4, max4)
    const u5 = normalize(row.C5_kemiripan_skill, min5, max5)

    const finalScore =
      u1 * (weights['C1'] || 0) +
      u2 * (weights['C2'] || 0) +
      u3 * (weights['C3'] || 0) +
      u4 * (weights['C4'] || 0) +
      u5 * (weights['C5'] || 0)

    return {
      ...row,
      u1: Number(u1.toFixed(4)),
      u2: Number(u2.toFixed(4)),
      u3: Number(u3.toFixed(4)),
      u4: Number(u4.toFixed(4)),
      u5: Number(u5.toFixed(4)),
      finalScore: Number(finalScore.toFixed(4)),
      rank: 0,
    }
  })

  // Urutkan berdasarkan skor tertinggi (Rank 1 .. 221).
  // Tie-breaker deterministik (G7): finalScore -> C2 -> C5 -> job_id.
  results.sort((a, b) =>
    b.finalScore - a.finalScore ||
    b.C2_rasio_gaji - a.C2_rasio_gaji ||
    b.C5_kemiripan_skill - a.C5_kemiripan_skill ||
    String(a.job_id).localeCompare(String(b.job_id))
  )

  results.forEach((item, idx) => {
    item.rank = idx + 1
  })

  return results
}

export function computeSPKForCustomStudent(
  jobs: CleanJob[],
  prefs: {
    minSalary: number
    maxHours: number
    location: string
    workSystem: string
    preferredCategory: string
    skills: string
    priorityRank: {
      C1_kategori: number
      C2_gaji: number
      C3_lokasi: number
      C4_jam_kerja: number
      C5_skill: number
    }
  },
  tfidf?: TfidfArtifact | null
): RankedJobResult[] {
  if (!jobs.length) return []

  // 1. Bangun Matriks Keputusan Dinamis
  const matrix: DecisionMatrixRow[] = jobs.map((job) => {
    const c1 =
      job.job_category.trim().toLowerCase() === prefs.preferredCategory.trim().toLowerCase()
        ? 1.0
        : 0.3

    const minSal = prefs.minSalary > 0 ? prefs.minSalary : 35000
    const c2 = Number(Math.min(job.work_salaryperhour / minSal, C2_RATIO_CAP).toFixed(4))

    let c3 = 0.4
    const jobLoc = (job.work_job_location || '').toLowerCase()
    const studentLoc = (prefs.location || '').toLowerCase()

    if (
      job.work_system?.toLowerCase() === 'remote' ||
      jobLoc === studentLoc ||
      (studentLoc && jobLoc.includes(studentLoc))
    ) {
      c3 = 1.0
    } else if (jobLoc.includes('jakarta') && studentLoc.includes('jakarta')) {
      c3 = 0.8
    } else {
      c3 = 0.4
    }

    const targetHours = prefs.maxHours > 0 ? prefs.maxHours : 18
    const diffHours = Math.abs((job.work_hours || 18) - targetHours)
    const c4 = Number(Math.max(0.0, 1.0 - diffHours / 20.0).toFixed(4))

    const c5 = Number(
      computeTfidfSimilarity(
        prefs.skills,
        job.clean_required_skills || job.work_required_skills || '',
        tfidf
      ).toFixed(4)
    )

    return {
      job_id: job.job_id,
      job_title: job.job_title,
      company_name: job.company_name,
      company_logo: job.company_logo,
      job_category: job.job_category,
      work_job_location: job.work_job_location,
      work_system: job.work_system,
      work_salaryperhour: job.work_salaryperhour,
      work_hours: job.work_hours,
      C1_kategori: c1,
      C2_rasio_gaji: c2,
      C3_lokasi: c3,
      C4_jam_kerja: c4,
      C5_kemiripan_skill: c5,
      url: job.url,
      source_portal: job.source_portal,
      date_posted: job.date_posted,
      work_required_skills: job.work_required_skills,
      clean_required_skills: job.clean_required_skills,
    }
  })

  // 2. Hitung Bobot ROC (dengan ties — sama seperti yang ditampilkan di UI, G6)
  const tied = weightsWithTies(prefs.priorityRank as Record<CriterionKey, number>)
  const weights = {
    C1: tied.C1_kategori,
    C2: tied.C2_gaji,
    C3: tied.C3_lokasi,
    C4: tied.C4_jam_kerja,
    C5: tied.C5_skill,
  }

  // 3. Hitung SMARTER
  const ranked = computeSmarter(matrix, weights)

  // 4. SENGAJA tidak ada hard-filter moda di level SPK (global 221) agar
  // ranking web sama dengan Excel 05_ARSIP_221. prefs.workSystem hanya info
  // preferensi dari clean dataset (ditampilkan di UI per mahasiswa);
  // penyaringan feed ada di lapisan tampilan (filterWorkSystem), bukan ranking.
  return ranked
}

export async function fetchCsvData<T>(url: string): Promise<T[]> {
  const response = await fetch(url)
  const csvText = await response.text()
  return new Promise((resolve, reject) => {
    Papa.parse<T>(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data)
      },
      error: (error: Error) => {
        reject(error)
      },
    })
  })
}
