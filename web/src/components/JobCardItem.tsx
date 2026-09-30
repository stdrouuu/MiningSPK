import React from 'react'
import { MapPin, Coins, Clock, Building2, Check, Bookmark } from 'lucide-react'
import { Badge } from './ui/Badge'
import { CompanyLogo } from './CompanyLogo'
import type { RankedJobResult } from '../types/data'
import type { StudentPreferences } from '../types/portal'
import { formatRupiah } from '../lib/utils'

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
    job.job_category.trim().toLowerCase() === studentPrefs.preferredCategory.trim().toLowerCase()
  const isSalaryGood = job.work_salaryperhour >= studentPrefs.minSalary
  const isLocationGood =
    job.work_system?.toLowerCase() === 'remote' ||
    (job.work_job_location || '').toLowerCase().includes(studentPrefs.location.toLowerCase())

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      // Avoid double-activation when focus is on the save button
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
      aria-label={`${job.job_title} di ${job.company_name}, kecocokan ${matchPct} persen, peringkat ${job.rank}`}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      style={{ '--enter-delay': `${Math.min(index, 8) * 40}ms` } as React.CSSProperties}
      className={`emil-card-enter emil-press emil-hover-lift p-4 rounded-xl border cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 ${
        isSelected
          ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <CompanyLogo companyName={job.company_name} logoUrl={job.company_logo} />

          <div className="min-w-0 flex-1">
            <h3
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate leading-snug"
              title={job.job_title}
            >
              {job.job_title}
            </h3>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{job.company_name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant={job.rank === 1 ? 'success' : matchPct >= 50 ? 'warning' : 'secondary'}
            className="font-mono text-[11px] font-bold"
            aria-label={`Peringkat ${job.rank}, kecocokan ${matchPct} persen`}
          >
            {job.rank === 1 ? `#1 • ${matchPct}%` : `${matchPct}%`}
          </Badge>

          <button
            data-save-btn
            onClick={onToggleSave}
            aria-pressed={isSaved}
            aria-label={isSaved ? `Hapus ${job.job_title} dari simpanan` : `Simpan ${job.job_title}`}
            title={isSaved ? 'Hapus simpanan' : 'Simpan lowongan'}
            className={`emil-press p-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 ${
              isSaved
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
        </div>
      </div>

      <dl className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
        <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
          <Coins className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
          {formatRupiah(job.work_salaryperhour)}/jam
        </span>

        <span aria-hidden="true">•</span>

        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
          {job.work_hours} jam/mgg
        </span>

        <span aria-hidden="true">•</span>

        <span className="flex items-center gap-1 min-w-0">
          <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
          <span className="truncate">{job.work_job_location} ({job.work_system})</span>
        </span>
      </dl>

      {(isSalaryGood || isLocationGood || isCategoryMatch) && (
        <ul className="flex flex-wrap gap-1.5 mt-2.5" aria-label="Alasan kecocokan">
          {isSalaryGood && (
            <li className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Upah sesuai
            </li>
          )}
          {isLocationGood && (
            <li className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Lokasi cocok
            </li>
          )}
          {isCategoryMatch && (
            <li className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Minat kategori
            </li>
          )}
        </ul>
      )}
    </article>
  )
}
