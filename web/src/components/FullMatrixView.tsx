import { useState, useMemo, type MouseEvent, type FocusEvent } from 'react'
import { RiDownloadLine, RiEqualizerLine } from 'react-icons/ri'
import { Button } from './ui/Button'
import { CompanyLogo } from './CompanyLogo'
import type { RankedJobResult } from '../types/data'
import type { StudentPreferences } from '../types/portal'
import { formatRupiah } from '../lib/utils'

interface FullMatrixViewProps {
  rankedJobs: RankedJobResult[]
  studentPrefs: StudentPreferences
  onOpenPreferences: () => void
  onSelectJobForDetail: (job: RankedJobResult) => void
  /** Profil belum terisi -> tabel skor diganti ajakan kuesioner. */
  isProfileEmpty?: boolean
  onFillQuestionnaire?: () => void
}

export function FullMatrixView({
  rankedJobs,
  studentPrefs,
  onOpenPreferences,
  onSelectJobForDetail,
  isProfileEmpty = false,
  onFillQuestionnaire,
}: FullMatrixViewProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10
  const [matrixDisplayMode, setMatrixDisplayMode] = useState<'ranking' | 'utility' | 'raw'>(
    'ranking'
  )
  const [hoveredTip, setHoveredTip] = useState<{
    title: string
    value: string
    meaning: string
    left: number
    top: number
    bottom: number
  } | null>(null)

  const showTip = (
    e: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>,
    title: string,
    value: string,
    meaning: string
  ) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clampedLeft = Math.min(Math.max(rect.left + rect.width / 2, 160), window.innerWidth - 160)
    setHoveredTip({
      title,
      value,
      meaning,
      left: clampedLeft,
      top: rect.top,
      bottom: rect.bottom,
    })
  }

  const hideTip = () => setHoveredTip(null)

  const getCriterionTooltip = (
    criterion: 'final' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'u1' | 'u2' | 'u3' | 'u4' | 'u5',
    job: RankedJobResult
  ): { title: string; value: string; meaning: string } => {
    switch (criterion) {
      case 'final':
        return {
          title: 'Skor Utilitas Akhir U(Ai)',
          value: job.finalScore.toFixed(4),
          meaning: `Total skor SMARTER dari jumlah bobot ROC × utilitas seluruh kriteria (setara ${(job.finalScore * 100).toFixed(0)}% cocok). Makin mendekati 1, makin direkomendasikan.`,
        }
      case 'C1':
        return {
          title: 'Skor Kategori (C1)',
          value: String(job.C1_kategori),
          meaning:
            job.C1_kategori >= 1
              ? `Nilai 1 berarti kategori "${job.job_category}" sesuai penuh dengan minat bidangmu.`
              : `Nilai ${job.C1_kategori} berarti kategori "${job.job_category}" di luar minat bidang utamamu (skor dasar 0.3).`,
        }
      case 'C2':
        return {
          title: 'Rasio Gaji (C2)',
          value: String(job.C2_rasio_gaji),
          meaning: `Perbandingan upah ${formatRupiah(job.work_salaryperhour)}/jam terhadap targetmu ${formatRupiah(studentPrefs.minSalary)}/jam (maks 2.0). Nilai ≥ 1 berarti upah memenuhi atau melampaui target.`,
        }
      case 'C3':
        return {
          title: 'Skor Lokasi & Sistem Kerja (C3)',
          value: String(job.C3_lokasi),
          meaning:
            job.C3_lokasi >= 1
              ? `Nilai 1 berarti lowongan ini Remote atau berlokasi di ${job.work_job_location} (sama dengan domisilimu).`
              : job.C3_lokasi >= 0.7
                ? `Nilai ${job.C3_lokasi} berarti lokasi (${job.work_job_location}) berdekatan dengan domisilimu.`
                : `Nilai ${job.C3_lokasi} berarti lokasi (${job.work_job_location}) di luar domisilimu dan tidak Remote.`,
        }
      case 'C4':
        return {
          title: 'Skor Kecocokan Jam Kuliah (C4)',
          value: String(job.C4_jam_kerja),
          meaning: `Mengukur kecocokan ${job.work_hours} jam/minggu dengan batas idealmu (${studentPrefs.maxHours} jam/minggu). Nilai mendekati 1 berarti beban jam aman untuk kuliah.`,
        }
      case 'C5':
        return {
          title: 'Skor Kemiripan Skill (C5)',
          value: String(job.C5_kemiripan_skill),
          meaning:
            job.C5_kemiripan_skill === 0
              ? 'Nilai 0 berarti belum ada irisan kata kunci skill di profilmu dengan kebutuhan skill lowongan ini.'
              : `Skor TF-IDF Cosine (${job.C5_kemiripan_skill}) menunjukkan tingkat kecocokan skill-mu dengan deskripsi lowongan (skala 0–1).`,
        }
      case 'u1':
      case 'u2':
      case 'u3':
      case 'u4':
      case 'u5': {
        const labelMap = {
          u1: 'Utilitas Kategori (u₁)',
          u2: 'Utilitas Gaji (u₂)',
          u3: 'Utilitas Lokasi & Sistem (u₃)',
          u4: 'Utilitas Jam Kuliah (u₄)',
          u5: 'Utilitas Skill (u₅)',
        }
        const val = job[criterion]
        return {
          title: labelMap[criterion],
          value: String(val),
          meaning: `Nilai normalisasi skala 0–1 terhadap seluruh lowongan. 1 = terbaik di dataset untuk kriteria ini, 0 = terendah, sebelum dikalikan bobot ROC.`,
        }
      }
    }
  }

  const tipProps = (
    criterion: 'final' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'u1' | 'u2' | 'u3' | 'u4' | 'u5',
    job: RankedJobResult
  ) => {
    const { title, value, meaning } = getCriterionTooltip(criterion, job)
    return {
      tabIndex: 0,
      onMouseEnter: (e: MouseEvent<HTMLElement>) => showTip(e, title, value, meaning),
      onMouseLeave: hideTip,
      onFocus: (e: FocusEvent<HTMLElement>) => showTip(e, title, value, meaning),
      onBlur: hideTip,
    }
  }

  const filteredJobs = useMemo(() => {
    if (!search) return rankedJobs
    const q = search.toLowerCase()
    return rankedJobs.filter(
      (j) =>
        j.job_title?.toLowerCase().includes(q) ||
        j.company_name?.toLowerCase().includes(q) ||
        j.job_id?.toLowerCase().includes(q) ||
        j.job_category?.toLowerCase().includes(q)
    )
  }, [rankedJobs, search])

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pagedJobs = filteredJobs.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const handleSearch = (v: string) => {
    setSearch(v)
    setPage(0)
  }

  const handleMode = (m: 'ranking' | 'utility' | 'raw') => {
    setMatrixDisplayMode(m)
    setPage(0)
  }

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Rank',
      'Job ID',
      'Title',
      'Company',
      'Category',
      'Salary/Hour',
      'Hours',
      'System',
      'Location',
      'Final Score U(Ai)',
      'C1 (Category)',
      'C2 (Salary Ratio)',
      'C3 (Location)',
      'C4 (Work Hours)',
      'C5 (Skill Cosine)',
      'u1',
      'u2',
      'u3',
      'u4',
      'u5',
    ]

    const rows = rankedJobs.map((r) => [
      r.rank,
      r.job_id,
      `"${(r.job_title || '').replace(/"/g, '""')}"`,
      `"${(r.company_name || '').replace(/"/g, '""')}"`,
      `"${(r.job_category || '').replace(/"/g, '""')}"`,
      r.work_salaryperhour,
      r.work_hours,
      r.work_system,
      `"${r.work_job_location}"`,
      r.finalScore,
      r.C1_kategori,
      r.C2_rasio_gaji,
      r.C3_lokasi,
      r.C4_jam_kerja,
      r.C5_kemiripan_skill,
      r.u1,
      r.u2,
      r.u3,
      r.u4,
      r.u5,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `SPK_SMARTER_Calculation_${studentPrefs.nim || studentPrefs.name.trim() || 'Mahasiswa'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div
        data-tour="matrix-header"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white mt-0.5">
            Matriks Keputusan &amp; Komputasi SMARTER
          </h1>
          {isProfileEmpty ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-1">
              Perhitungan versimu akan muncul di sini setelah kuesioner terisi.
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-1">
              Representasi lengkap perhitungan matematis multi-kriteria untuk profil mahasiswa{' '}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {studentPrefs.name.trim() || 'Mahasiswa'}
                {studentPrefs.nim.trim() ? ` (${studentPrefs.nim})` : ''}
              </span>.
            </p>
          )}
        </div>

        {isProfileEmpty ? (
          <Button size="sm" onClick={onFillQuestionnaire} className="text-xs gap-1.5 bg-[#0C52EE] hover:bg-[#0942c4] shrink-0">
            Mulai kuesioner
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onOpenPreferences} className="text-xs gap-1.5 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <RiEqualizerLine className="h-3.5 w-3.5" /> Atur Prioritas ROC
            </Button>
            <Button variant="default" size="sm" onClick={handleExportCsv} className="text-xs gap-1.5 bg-[#0C52EE] hover:bg-[#0942c4] dark:bg-blue-600 dark:hover:bg-blue-500">
              <RiDownloadLine className="h-3.5 w-3.5" /> Unduh CSV Lengkap
            </Button>
          </div>
        )}
      </div>

      {isProfileEmpty ? (
        <div
          data-tour="matrix-content"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 sm:p-12 text-center space-y-3 shadow-2xs"
        >
          <h2 className="text-base font-medium text-slate-900 dark:text-white">Matriks ini menunggumu</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-light max-w-md mx-auto">
            Skor U(Ai), utilitas, dan peringkat dihitung dari upah, jam, lokasi &amp; skill-mu.
            Isi kuesioner singkat (±3 menit) — tabel 221 lowongan langsung terisi sesuai kebutuhanmu.
          </p>
          <div>
            <Button size="sm" onClick={onFillQuestionnaire} className="text-xs bg-[#0C52EE] hover:bg-[#0942c4] dark:bg-blue-600 dark:hover:bg-blue-500">
              Mulai kuesioner
            </Button>
          </div>
        </div>
      ) : (
        <div data-tour="matrix-content" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div role="tablist" aria-label="Mode tampilan matriks" className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
              <button role="tab" aria-selected={matrixDisplayMode === 'ranking'} onClick={() => handleMode('ranking')} className={`px-3 py-1.5 rounded-md transition-all ${matrixDisplayMode === 'ranking' ? 'font-medium bg-white dark:bg-slate-900 text-[#0C52EE] dark:text-blue-400 shadow-2xs' : 'font-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                Mode 1: Peringkat &amp; Skor
              </button>
              <button role="tab" aria-selected={matrixDisplayMode === 'utility'} onClick={() => handleMode('utility')} className={`px-3 py-1.5 rounded-md transition-all ${matrixDisplayMode === 'utility' ? 'font-medium bg-white dark:bg-slate-900 text-[#0C52EE] dark:text-blue-400 shadow-2xs' : 'font-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                Mode 2: Utilitas (uⱼ)
              </button>
              <button role="tab" aria-selected={matrixDisplayMode === 'raw'} onClick={() => handleMode('raw')} className={`px-3 py-1.5 rounded-md transition-all ${matrixDisplayMode === 'raw' ? 'font-medium bg-white dark:bg-slate-900 text-[#0C52EE] dark:text-blue-400 shadow-2xs' : 'font-normal text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                Mode 3: Matriks awal (Xᵢⱼ)
              </button>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Cari dalam matriks…"
                aria-label="Cari dalam matriks"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#0C52EE] dark:focus:border-blue-400"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-14 text-center">Rank</th>
                  <th className="py-3 px-4 w-28">ID Loker</th>
                  <th className="py-3 px-4 min-w-[200px]">Posisi &amp; Perusahaan</th>
                  <th className="py-3 px-4">Upah / Jam</th>
                  <th className="py-3 px-4">Jam</th>

                  {matrixDisplayMode === 'ranking' && (
                    <>
                      <th className="py-3 px-4 min-w-[140px]">Skor Utilitas U(Ai)</th>
                      <th className="py-3 px-4 text-center">Kategori</th>
                      <th className="py-3 px-4 text-center">Gaji</th>
                      <th className="py-3 px-4 text-center">Lokasi</th>
                      <th className="py-3 px-4 text-center">Jam</th>
                      <th className="py-3 px-4 text-center">Skill</th>
                    </>
                  )}

                  {matrixDisplayMode === 'utility' && (
                    <>
                      <th className="py-3 px-4 text-center">Utilitas Kategori</th>
                      <th className="py-3 px-4 text-center">Utilitas Gaji</th>
                      <th className="py-3 px-4 text-center">Utilitas Lokasi</th>
                      <th className="py-3 px-4 text-center">Utilitas Jam</th>
                      <th className="py-3 px-4 text-center">Utilitas Skill</th>
                      <th className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        Total U(Ai)
                      </th>
                    </>
                  )}

                  {matrixDisplayMode === 'raw' && (
                    <>
                      <th className="py-3 px-4 text-center">Kategori</th>
                      <th className="py-3 px-4 text-center">Rasio Gaji</th>
                      <th className="py-3 px-4 text-center">Lokasi</th>
                      <th className="py-3 px-4 text-center">Jam Kerja</th>
                      <th className="py-3 px-4 text-center">Skill Cosine</th>
                    </>
                  )}

                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300">
                {pagedJobs.map((job) => (
                  <tr
                    key={job.job_id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => onSelectJobForDetail(job)}
                  >
                    <td className="py-3 px-4 text-center font-medium text-[#0C52EE] dark:text-blue-400">
                      #{job.rank}
                    </td>

                    <td className="py-3 px-4 font-medium">
                      {job.job_id}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <CompanyLogo companyName={job.company_name} logoUrl={job.company_logo} size="sm" />
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 dark:text-white truncate max-w-xs">
                            {job.job_title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            {job.company_name} • {job.work_job_location}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {formatRupiah(job.work_salaryperhour)}
                    </td>

                    <td className="py-3 px-4">
                      {job.work_hours} jam
                    </td>

                    {matrixDisplayMode === 'ranking' && (
                      <>
                        <td className="py-3 px-4">
                          <div
                            {...tipProps('final', job)}
                            className="inline-flex items-center gap-2 cursor-help rounded px-1 -mx-1 hover:bg-blue-50 dark:hover:bg-blue-950/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            <span className="font-mono font-medium text-slate-900 dark:text-white underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4">
                              {job.finalScore.toFixed(4)}
                            </span>
                            <div className="w-16 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#0C52EE] dark:bg-blue-500 h-full rounded-full"
                                style={{ width: `${Math.min(100, job.finalScore * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-center text-slate-600 dark:text-slate-400">
                          <span
                            {...tipProps('C1', job)}
                            className="inline-block cursor-help rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            {job.C1_kategori}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-center text-slate-600 dark:text-slate-400">
                          <span
                            {...tipProps('C2', job)}
                            className="inline-block cursor-help rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            {job.C2_rasio_gaji}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-center text-slate-600 dark:text-slate-400">
                          <span
                            {...tipProps('C3', job)}
                            className="inline-block cursor-help rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            {job.C3_lokasi}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-center text-slate-600 dark:text-slate-400">
                          <span
                            {...tipProps('C4', job)}
                            className="inline-block cursor-help rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            {job.C4_jam_kerja}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-center font-medium text-slate-900 dark:text-white">
                          <span
                            {...tipProps('C5', job)}
                            className="inline-block cursor-help rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            {job.C5_kemiripan_skill}
                          </span>
                        </td>
                      </>
                    )}

                    {matrixDisplayMode === 'utility' && (
                      <>
                        <td className="py-3 px-4 font-mono text-center text-slate-600 dark:text-slate-400">
                          <span
                            {...tipProps('u1', job)}
                            className="inline-block cursor-help rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            {job.u1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-center text-slate-600 dark:text-slate-400">
                          <span
                            {...tipProps('u2', job)}
                            className="inline-block cursor-help rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            {job.u2}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-center text-slate-600 dark:text-slate-400">
                          <span
                            {...tipProps('u3', job)}
                            className="inline-block cursor-help rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            {job.u3}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-center text-slate-600 dark:text-slate-400">
                          <span
                            {...tipProps('u4', job)}
                            className="inline-block cursor-help rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            {job.u4}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-center text-slate-600 dark:text-slate-400">
                          <span
                            {...tipProps('u5', job)}
                            className="inline-block cursor-help rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            {job.u5}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white">
                          <span
                            {...tipProps('final', job)}
                            className="inline-block cursor-help rounded px-1.5 py-0.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            {job.finalScore}
                          </span>
                        </td>
                      </>
                    )}

                    {matrixDisplayMode === 'raw' && (
                      <>
                        <td className="py-3 px-4 font-mono text-center text-slate-600 dark:text-slate-400">
                          <span
                            {...tipProps('C1', job)}
                            className="inline-block cursor-help rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            {job.C1_kategori}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-center text-slate-600 dark:text-slate-400">
                          <span
                            {...tipProps('C2', job)}
                            className="inline-block cursor-help rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            {job.C2_rasio_gaji}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-center text-slate-600 dark:text-slate-400">
                          <span
                            {...tipProps('C3', job)}
                            className="inline-block cursor-help rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            {job.C3_lokasi}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-center text-slate-600 dark:text-slate-400">
                          <span
                            {...tipProps('C4', job)}
                            className="inline-block cursor-help rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            {job.C4_jam_kerja}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-center text-slate-600 dark:text-slate-400">
                          <span
                            {...tipProps('C5', job)}
                            className="inline-block cursor-help rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C52EE]"
                          >
                            {job.C5_kemiripan_skill}
                          </span>
                        </td>
                      </>
                    )}

                    <td className="py-3 px-4 text-right">
                      <button
                        className="px-2.5 py-1 bg-[#0C52EE] hover:bg-[#0942c4] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded text-[10px] font-medium transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectJobForDetail(job)
                        }}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span aria-live="polite">Menampilkan {pagedJobs.length} dari {filteredJobs.length} baris • halaman {safePage + 1}/{pageCount} • U(Ai) = Σ (wⱼ × uⱼ)</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                Sebelumnya
              </Button>
              <span className="font-mono text-slate-700 dark:text-slate-300">{safePage + 1} / {pageCount}</span>
              <Button variant="outline" size="sm" className="h-7 text-xs dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
                Berikutnya
              </Button>
            </div>
          </div>
        </div>
      )}

      {hoveredTip && (
        <div
          role="tooltip"
          style={{
            left: `${hoveredTip.left}px`,
            top: hoveredTip.top < 150 ? `${hoveredTip.bottom + 8}px` : `${hoveredTip.top - 8}px`,
            transform: hoveredTip.top < 150 ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
          }}
          className="fixed z-50 w-72 max-w-[90vw] pointer-events-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-left shadow-lg text-slate-800 dark:text-slate-100"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-semibold text-[#0C52EE] dark:text-blue-300">
              {hoveredTip.title}
            </span>
            <span className="font-mono text-[11px] font-semibold bg-blue-50 text-[#0C52EE] dark:bg-white/15 dark:text-white px-1.5 py-0.5 rounded">
              {hoveredTip.value}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-200">
            {hoveredTip.meaning}
          </p>
        </div>
      )}
    </div>
  )
}
