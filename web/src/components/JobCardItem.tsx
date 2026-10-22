import React, { useState } from 'react'
import { CompanyLogo } from './CompanyLogo'
import type { RankedJobResult } from '../types/data'
import type { StudentPreferences } from '../types/portal'
import { jobProximity } from '../lib/geo'

/** Komp util badge: jobProximity lalu ambil labelnya. */
const proximityLabel = (job: RankedJobResult, location: string) =>
  jobProximity(job, location).label

interface JobCardItemProps {
  job: RankedJobResult
  isSelected: boolean
  onSelect: () => void
  studentPrefs: StudentPreferences
  /** Profil belum terisi -> badge % & chip kecocokan disembunyikan. */
  hideMatch?: boolean
  isSaved: boolean
  onToggleSave: (e: React.MouseEvent) => void
  index?: number
}

/** Format "Diposting x hari yang lalu" dari date_posted (fallback: teks mentah). */
export function relativePosting(dateStr?: string): string {
  if (!dateStr) return 'Diposting baru'
  const t = new Date(dateStr).getTime()
  if (Number.isNaN(t)) return `Diposting ${dateStr}`
  const days = Math.floor((Date.now() - t) / 86_400_000)
  if (days <= 0) return 'Diposting hari ini'
  if (days === 1) return 'Diposting 1 hari yang lalu'
  if (days >= 60) return `Diposting ${Math.floor(days / 30)} bulan yang lalu`
  return `Diposting ${days} hari yang lalu`
}

export function JobCardItem({
  job,
  isSelected,
  onSelect,
  studentPrefs,
  hideMatch = false,
  isSaved,
  onToggleSave,
  index = 0,
}: JobCardItemProps) {
  const [expanded, setExpanded] = useState(false)
  const matchPct = Math.round(Math.min(100, Math.max(0, job.finalScore * 100)))

  const isCategoryMatch =
    job.job_category?.trim().toLowerCase() === studentPrefs.preferredCategory.trim().toLowerCase()
  const isSalaryGood = job.work_salaryperhour >= studentPrefs.minSalary
  const isLocationGood =
    job.work_system?.toLowerCase() === 'remote' ||
    (job.work_job_location || '').toLowerCase().includes(studentPrefs.location.toLowerCase())

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if ((e.target as HTMLElement).closest('[data-save-btn], [data-expand-btn]')) return
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <article
      id={`job-${job.job_id}`}
      role="option"
      aria-selected={isSelected}
      aria-label={`${job.job_title} di ${job.company_name}`}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      style={{ '--enter-delay': `${Math.min(index, 8) * 40}ms` } as React.CSSProperties}
      className={`group p-4 sm:p-5 rounded-xl bg-white border ${
        isSelected
          ? 'border-[#0C52EE] ring-1 ring-[#0C52EE] shadow-sm'
          : 'border-slate-200 hover:border-slate-300 shadow-2xs'
      } transition-all cursor-pointer`}
    >
      {/* Layout ala JobStreet: teks kiri, logo perusahaan besar di kanan */}
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] sm:text-base font-medium text-[#2b1560] leading-snug line-clamp-2 underline underline-offset-2 decoration-1 group-hover:text-[#0942c4] group-hover:decoration-[#0942c4] transition-colors">
            {job.job_title}
          </h3>
          <p className="text-[15px] text-slate-800 mt-1 truncate">{job.company_name}</p>
          <div className="mt-1.5">
            <span className="inline-flex items-center px-3 py-1 rounded-md bg-pink-100/70 text-pink-600 text-xs font-medium">
              {job.job_category}
            </span>
          </div>
          <p className="text-sm text-slate-500 font-light mt-1.5 truncate">
            {job.work_job_location}
            {proximityLabel(job, studentPrefs.location) &&
              (job.work_job_location || '').toLowerCase() !== 'remote' && (
                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-normal text-slate-500 align-middle">
                  {proximityLabel(job, studentPrefs.location)}
                </span>
              )}
          </p>
        </div>
        <CompanyLogo companyName={job.company_name} logoUrl={job.company_logo} size="xl" />
      </div>

      {/* Footer: waktu posting + skor SPK, chevron expand & bookmark */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-light min-w-0">
          <span className="truncate">{relativePosting(job.date_posted)}</span>
          {!hideMatch && (
            <span className="shrink-0">
              {"\u2022"} <span className="font-medium text-slate-700">SPK {matchPct}%</span>
            </span>
          )}
        </div>
        <div className="flex items-center shrink-0">
          <button
            data-expand-btn
            onClick={(e) => {
              e.stopPropagation()
              setExpanded((v) => !v)
            }}
            aria-expanded={expanded}
            title={expanded ? 'Tutup detail kecocokan' : 'Lihat kecocokan & detail'}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            data-save-btn
            onClick={onToggleSave}
            aria-pressed={isSaved}
            title={isSaved ? 'Hapus simpanan' : 'Simpan lowongan'}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <svg className={`w-4 h-4 ${isSaved ? 'text-[#ED1E79] fill-current' : ''}`} fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chevron expand: chip kecocokan SPK + beban jam */}
      {expanded && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-xs font-normal">
            {job.work_hours} jam/mgg {"\u2022"} {job.work_system}
          </span>
          {isSalaryGood && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-xs font-normal"><span className="text-emerald-600 font-medium">&#10003;</span> Upah sesuai</span>
          )}
          {isLocationGood && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-xs font-normal"><span className="text-[#0C52EE] font-medium">&#10003;</span> Lokasi cocok</span>
          )}
          {isCategoryMatch && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-xs font-normal"><span className="text-[#ED1E79] font-medium">&#10003;</span> Minat kategori</span>
          )}
        </div>
      )}
    </article>
  )
}
