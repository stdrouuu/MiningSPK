import { useState, useMemo } from 'react'
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
    link.setAttribute('download', `SPK_SMARTER_Calculation_${studentPrefs.nim || 'Mahasiswa'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#0C52EE]">
            TRANSPARANSI KEPUTUSAN MULTI-KRITERIA
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 mt-0.5">
            Matriks Keputusan &amp; Komputasi SMARTER
          </h1>
          {isProfileEmpty ? (
            <p className="text-xs text-slate-500 font-light mt-1">
              Perhitungan versimu akan muncul di sini setelah kuesioner terisi.
            </p>
          ) : (
            <p className="text-xs text-slate-500 font-light mt-1">
              Representasi lengkap perhitungan matematis multi-kriteria untuk profil mahasiswa{' '}
              <span className="font-medium text-slate-800">{studentPrefs.name} ({studentPrefs.nim})</span>.
            </p>
          )}
        </div>

        {isProfileEmpty ? (
          <Button size="sm" onClick={onFillQuestionnaire} className="text-xs gap-1.5 bg-[#0C52EE] hover:bg-[#0942c4] shrink-0">
            Mulai kuesioner
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onOpenPreferences} className="text-xs gap-1.5">
              <RiEqualizerLine className="h-3.5 w-3.5" /> Atur Prioritas ROC
            </Button>
            <Button variant="default" size="sm" onClick={handleExportCsv} className="text-xs gap-1.5 bg-[#0C52EE] hover:bg-[#0942c4]">
              <RiDownloadLine className="h-3.5 w-3.5" /> Unduh CSV Lengkap
            </Button>
          </div>
        )}
      </div>

      {isProfileEmpty ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center space-y-3 shadow-2xs">
          <h2 className="text-base font-medium text-slate-900">Matriks ini menunggumu</h2>
          <p className="text-xs text-slate-500 font-light max-w-md mx-auto">
            Skor U(Ai), utilitas, dan peringkat dihitung dari upah, jam, lokasi & skill-mu.
            Isi kuesioner singkat (±3 menit) — tabel 221 lowongan langsung terisi sesuai kebutuhanmu.
          </p>
          <div>
            <Button size="sm" onClick={onFillQuestionnaire} className="text-xs bg-[#0C52EE] hover:bg-[#0942c4]">
              Mulai kuesioner
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div role="tablist" aria-label="Mode tampilan matriks" className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
          <button role="tab" aria-selected={matrixDisplayMode === 'ranking'} onClick={() => handleMode('ranking')} className={`px-3 py-1.5 rounded-md transition-all ${matrixDisplayMode === 'ranking' ? 'font-medium bg-white text-[#0C52EE] shadow-2xs' : 'font-normal text-slate-600 hover:text-slate-900'}`}>
            Mode 1: Peringkat &amp; Skor
          </button>
          <button role="tab" aria-selected={matrixDisplayMode === 'utility'} onClick={() => handleMode('utility')} className={`px-3 py-1.5 rounded-md transition-all ${matrixDisplayMode === 'utility' ? 'font-medium bg-white text-[#0C52EE] shadow-2xs' : 'font-normal text-slate-600 hover:text-slate-900'}`}>
            Mode 2: Utilitas (uⱼ)
          </button>
          <button role="tab" aria-selected={matrixDisplayMode === 'raw'} onClick={() => handleMode('raw')} className={`px-3 py-1.5 rounded-md transition-all ${matrixDisplayMode === 'raw' ? 'font-medium bg-white text-[#0C52EE] shadow-2xs' : 'font-normal text-slate-600 hover:text-slate-900'}`}>
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
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0C52EE]"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-slate-200 rounded-xl bg-white overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-medium text-slate-600 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 w-14 text-center">Rank</th>
              <th className="py-3 px-4 w-28">ID Loker</th>
              <th className="py-3 px-4 min-w-[200px]">Posisi & Perusahaan</th>
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
                  <th className="py-3 px-4 font-medium text-slate-900">
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
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {pagedJobs.map((job) => (
              <tr
                key={job.job_id}
                className="hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => onSelectJobForDetail(job)}
              >
                <td className="py-3 px-4 text-center font-medium text-[#0C52EE]">
                  #{job.rank}
                </td>

                <td className="py-3 px-4 font-medium">
                  {job.job_id}
                </td>

                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <CompanyLogo companyName={job.company_name} logoUrl={job.company_logo} size="sm" />
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate max-w-xs">
                        {job.job_title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
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
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-slate-900">
                          {job.finalScore.toFixed(4)}
                        </span>
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#0C52EE] h-full rounded-full"
                            style={{ width: `${Math.min(100, job.finalScore * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-slate-600">
                      {job.C1_kategori}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-slate-600">
                      {job.C2_rasio_gaji}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-slate-600">
                      {job.C3_lokasi}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-slate-600">
                      {job.C4_jam_kerja}
                    </td>
                    <td className="py-3 px-4 font-mono text-center font-medium text-slate-900">
                      {job.C5_kemiripan_skill}
                    </td>
                  </>
                )}

                {matrixDisplayMode === 'utility' && (
                  <>
                    <td className="py-3 px-4 font-mono text-center text-slate-600">
                      {job.u1}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-slate-600">
                      {job.u2}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-slate-600">
                      {job.u3}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-slate-600">
                      {job.u4}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-slate-600">
                      {job.u5}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {job.finalScore}
                    </td>
                  </>
                )}

                {matrixDisplayMode === 'raw' && (
                  <>
                    <td className="py-3 px-4 font-mono text-center text-slate-600">
                      {job.C1_kategori}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-slate-600">
                      {job.C2_rasio_gaji}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-slate-600">
                      {job.C3_lokasi}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-slate-600">
                      {job.C4_jam_kerja}
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-slate-600">
                      {job.C5_kemiripan_skill}
                    </td>
                  </>
                )}

                <td className="py-3 px-4 text-right">
                  <button
                    className="px-2.5 py-1 bg-[#0C52EE] hover:bg-[#0942c4] text-white rounded text-[10px] font-medium transition-colors"
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
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
        </>
      )}
    </div>
  )
}
