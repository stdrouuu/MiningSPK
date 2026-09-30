import { useState, useMemo } from 'react'
import {
  RiDownloadLine,
  RiSearchLine,
  RiEqualizerLine,
} from 'react-icons/ri'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Badge } from './ui/Badge'
import type { RankedJobResult } from '../types/data'
import type { StudentPreferences } from '../types/portal'
import { formatRupiah } from '../lib/utils'

interface FullMatrixViewProps {
  rankedJobs: RankedJobResult[]
  studentPrefs: StudentPreferences
  onOpenPreferences: () => void
  onSelectJobForDetail: (job: RankedJobResult) => void
}

export function FullMatrixView({
  rankedJobs,
  studentPrefs,
  onOpenPreferences,
  onSelectJobForDetail,
}: FullMatrixViewProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 25
  const [matrixDisplayMode, setMatrixDisplayMode] = useState<'ranking' | 'utility' | 'raw'>(
    'ranking'
  )

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
    link.setAttribute('download', `SPK_SMARTER_Calculation_${studentPrefs.nim || 'UKRIDA'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Matriks Keputusan & Komputasi SMARTER
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Representasi lengkap perhitungan matematis multi-kriteria untuk profil mahasiswa{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">{studentPrefs.name}</strong> ({studentPrefs.nim}).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPreferences}
              className="text-xs gap-1.5"
            >
              <RiEqualizerLine className="h-3.5 w-3.5" /> Atur Prioritas ROC
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleExportCsv}
              className="text-xs gap-1.5"
            >
              <RiDownloadLine className="h-3.5 w-3.5" /> Unduh CSV Lengkap
            </Button>
          </div>
        </div>

        {/* View Switcher & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div role="tablist" aria-label="Mode tampilan matriks" className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-1 text-xs">
            <button
              role="tab"
              aria-selected={matrixDisplayMode === 'ranking'}
              onClick={() => handleMode('ranking')}
              className={`px-3 py-1 rounded-md emil-press cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 ${
                matrixDisplayMode === 'ranking'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Peringkat & Skor
            </button>
            <button
              role="tab"
              aria-selected={matrixDisplayMode === 'utility'}
              onClick={() => handleMode('utility')}
              className={`px-3 py-1 rounded-md emil-press cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 ${
                matrixDisplayMode === 'utility'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Utilitas (uⱼ)
            </button>
            <button
              role="tab"
              aria-selected={matrixDisplayMode === 'raw'}
              onClick={() => handleMode('raw')}
              className={`px-3 py-1 rounded-md emil-press cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 ${
                matrixDisplayMode === 'raw'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Matriks awal (Xᵢⱼ)
            </button>
          </div>

          <div className="max-w-xs w-full">
            <Input
              type="search"
              placeholder="Cari dalam matriks…"
              aria-label="Cari dalam matriks"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              icon={<RiSearchLine className="h-3.5 w-3.5" />}
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-auto max-h-[70vh] shadow-xs">
        <table className="w-full text-left text-xs border-collapse min-w-[880px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 uppercase font-semibold text-[11px] tracking-wider">
              <th className="py-3 px-4 w-14 text-center">Rank</th>
              <th className="py-3 px-4 w-28">ID Loker</th>
              <th className="py-3 px-4 min-w-[200px]">Posisi & Perusahaan</th>
              <th className="py-3 px-4">Upah / Jam</th>
              <th className="py-3 px-4">Jam</th>

              {matrixDisplayMode === 'ranking' && (
                <>
                  <th className="py-3 px-4 min-w-[140px]">Skor Utilitas U(Ai)</th>
                  <th className="py-3 px-4 font-mono text-center">C1</th>
                  <th className="py-3 px-4 font-mono text-center">C2</th>
                  <th className="py-3 px-4 font-mono text-center">C3</th>
                  <th className="py-3 px-4 font-mono text-center">C4</th>
                  <th className="py-3 px-4 font-mono text-center">C5</th>
                </>
              )}

              {matrixDisplayMode === 'utility' && (
                <>
                  <th className="py-3 px-4 font-mono text-center">u1 (Kategori)</th>
                  <th className="py-3 px-4 font-mono text-center">u2 (Gaji)</th>
                  <th className="py-3 px-4 font-mono text-center">u3 (Lokasi)</th>
                  <th className="py-3 px-4 font-mono text-center">u4 (Jam)</th>
                  <th className="py-3 px-4 font-mono text-center">u5 (Skill)</th>
                  <th className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    Total U(Ai)
                  </th>
                </>
              )}

              {matrixDisplayMode === 'raw' && (
                <>
                  <th className="py-3 px-4 font-mono text-center">X1 (Kategori)</th>
                  <th className="py-3 px-4 font-mono text-center">X2 (Rasio Gaji)</th>
                  <th className="py-3 px-4 font-mono text-center">X3 (Lokasi)</th>
                  <th className="py-3 px-4 font-mono text-center">X4 (Jam Kerja)</th>
                  <th className="py-3 px-4 font-mono text-center">X5 (Skill Cosine)</th>
                </>
              )}

              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-900 dark:text-zinc-100">
            {pagedJobs.map((job) => (
              <tr
                key={job.job_id}
                className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-[background-color] duration-150 ease-out cursor-pointer ${
                  job.rank === 1
                    ? 'bg-amber-50/50 dark:bg-amber-950/10'
                    : job.rank <= 3
                    ? 'bg-zinc-50/40 dark:bg-zinc-900/30'
                    : ''
                }`}
                onClick={() => onSelectJobForDetail(job)}
              >
                <td className="py-3 px-4 text-center font-bold">
                  {job.rank === 1 ? (
                    <Badge variant="success" className="px-1.5 py-0">
                      #1
                    </Badge>
                  ) : (
                    <span className="font-mono text-zinc-500">#{job.rank}</span>
                  )}
                </td>

                <td className="py-3 px-4 font-mono font-medium text-zinc-700 dark:text-zinc-300">
                  {job.job_id}
                </td>

                <td className="py-3 px-4">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-xs">
                    {job.job_title}
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate max-w-xs">
                    {job.company_name} • {job.work_job_location}
                  </div>
                </td>

                <td className="py-3 px-4 font-mono font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  {formatRupiah(job.work_salaryperhour)}
                </td>

                <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                  {job.work_hours}j
                </td>

                {matrixDisplayMode === 'ranking' && (
                  <>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {job.finalScore.toFixed(4)}
                        </span>
                        <div className="w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-zinc-900 dark:bg-zinc-100 h-full rounded-full"
                            style={{ width: `${Math.min(100, job.finalScore * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-zinc-600 dark:text-zinc-400">
                      {job.C1_kategori}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-zinc-600 dark:text-zinc-400">
                      {job.C2_rasio_gaji}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-zinc-600 dark:text-zinc-400">
                      {job.C3_lokasi}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-zinc-600 dark:text-zinc-400">
                      {job.C4_jam_kerja}
                    </td>
                    <td className="py-3 px-4 font-mono text-center font-semibold text-zinc-900 dark:text-zinc-100">
                      {job.C5_kemiripan_skill}
                    </td>
                  </>
                )}

                {matrixDisplayMode === 'utility' && (
                  <>
                    <td className="py-3 px-4 font-mono text-center text-zinc-600 dark:text-zinc-400">
                      {job.u1}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-zinc-600 dark:text-zinc-400">
                      {job.u2}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-zinc-600 dark:text-zinc-400">
                      {job.u3}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-zinc-600 dark:text-zinc-400">
                      {job.u4}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-zinc-600 dark:text-zinc-400">
                      {job.u5}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {job.finalScore}
                    </td>
                  </>
                )}

                {matrixDisplayMode === 'raw' && (
                  <>
                    <td className="py-3 px-4 font-mono text-center text-zinc-600 dark:text-zinc-400">
                      {job.C1_kategori}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-zinc-600 dark:text-zinc-400">
                      {job.C2_rasio_gaji}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-zinc-600 dark:text-zinc-400">
                      {job.C3_lokasi}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-zinc-600 dark:text-zinc-400">
                      {job.C4_jam_kerja}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-zinc-600 dark:text-zinc-400">
                      {job.C5_kemiripan_skill}
                    </td>
                  </>
                )}

                <td className="py-3 px-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectJobForDetail(job)
                    }}
                  >
                    Detail
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500">
        <span aria-live="polite">Menampilkan {pagedJobs.length} dari {filteredJobs.length} baris • halaman {safePage + 1}/{pageCount} • U(Ai) = Σ (wⱼ × uⱼ)</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Sebelumnya
          </Button>
          <span className="font-mono">{safePage + 1} / {pageCount}</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  )
}
