import React from 'react'
import { CompanyLogo } from './CompanyLogo'
import type { RankedJobResult } from '../types/data'
import type { StudentPreferences } from '../types/portal'

interface JobCardItemProps {
  job: RankedJobResult
  isSelected: boolean
  onSelect: () => void
  studentPrefs: StudentPreferences
  isSaved: boolean
  onToggleSave: (e: React.MouseEvent) => void
  index?: number
}

export function JobCardItem({
  job,
  isSelected,
  onSelect,
  studentPrefs,
  isSaved,
  onToggleSave,
  index = 0,
}: JobCardItemProps) {
  const matchPct = Math.round(Math.min(100, Math.max(0, job.finalScore * 100)))

  const isCategoryMatch =
    job.job_category?.trim().toLowerCase() === studentPrefs.preferredCategory.trim().toLowerCase()
  const isSalaryGood = job.work_salaryperhour >= studentPrefs.minSalary
  const isLocationGood =
    job.work_system?.toLowerCase() === 'remote' ||
    (job.work_job_location || '').toLowerCase().includes(studentPrefs.location.toLowerCase())

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if ((e.target as HTMLElement).closest('[data-save-btn]')) return
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <article
      id={`job-${job.job_id}`}
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      style={{ '--enter-delay': `${Math.min(index, 8) * 40}ms` } as React.CSSProperties}
      className={`p-4 rounded-xl bg-white border ${isSelected ? 'border-slate-400 ring-1 ring-slate-400 shadow-sm' : 'border-slate-200 hover:border-slate-300 shadow-2xs'} transition-all cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <CompanyLogo companyName={job.company_name} logoUrl={job.company_logo} />
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-medium text-slate-900 truncate">{job.job_title}</h3>
            <p className="text-[11px] text-slate-500 font-light truncate">{job.company_name} {"\u2022"} {job.work_job_location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${job.rank === 1 ? 'bg-pink-50 border border-pink-200 text-[#ED1E79]' : 'bg-blue-50 border border-blue-200 text-[#0C52EE]'}`}>
            {job.rank === 1 ? `#1 • ${matchPct}%` : `${matchPct}%`}
          </span>
          <button
            data-save-btn
            onClick={onToggleSave}
            aria-pressed={isSaved}
            title={isSaved ? 'Hapus simpanan' : 'Simpan lowongan'}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <svg className={`w-4 h-4 ${isSaved ? 'text-[#ED1E79] fill-current' : ''}`} fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-light">
        <span className="font-medium text-slate-900">Rp {job.work_salaryperhour.toLocaleString('id-ID')}/jam</span>
        <span>{job.work_hours} jam/mgg</span>
        <span className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-normal">{job.work_system}</span>
      </div>

      {(isSalaryGood || isLocationGood || isCategoryMatch) && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {isSalaryGood && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-normal"><span className="text-emerald-600 font-medium">&#10003;</span> Upah sesuai</span>
          )}
          {isLocationGood && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-normal"><span className="text-[#0C52EE] font-medium">&#10003;</span> Lokasi cocok</span>
          )}
          {isCategoryMatch && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-normal"><span className="text-[#ED1E79] font-medium">&#10003;</span> Minat kategori</span>
          )}
        </div>
      )}
    </article>
  )
}
