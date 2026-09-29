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
}

export function JobCardItem({
  job,
  isSelected,
  onSelect,
  studentPrefs,
  isSaved,
  onToggleSave,
}: JobCardItemProps) {
  // Hitung persentase kecocokan
  const matchPct = Math.min(99, Math.max(35, Math.round(job.finalScore * 100)))

  const isCategoryMatch =
    job.job_category.trim().toLowerCase() === studentPrefs.preferredCategory.trim().toLowerCase()
  const isSalaryGood = job.work_salaryperhour >= studentPrefs.minSalary
  const isLocationGood =
    job.work_system?.toLowerCase() === 'remote' ||
    (job.work_job_location || '').toLowerCase().includes(studentPrefs.location.toLowerCase())

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
        isSelected
          ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900/90 shadow-xs'
          : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Avatar & Title */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <CompanyLogo companyName={job.company_name} logoUrl={job.company_logo} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate leading-snug">
                {job.job_title}
              </h3>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3 shrink-0" />
              {job.company_name}
            </p>
          </div>
        </div>

        {/* Right: Match Score & Save Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant={job.rank === 1 ? 'warning' : matchPct >= 70 ? 'success' : 'secondary'}
            className="font-mono text-[11px] font-bold"
          >
            {job.rank === 1 ? `#1 • ${matchPct}%` : `${matchPct}% Match`}
          </Badge>

          <button
            onClick={onToggleSave}
            className={`p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
              isSaved
                ? 'text-amber-500 dark:text-amber-400'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
            title={isSaved ? 'Hapus Simpan' : 'Simpan Loker'}
          >
            <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Meta Specs Row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
        <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
          <Coins className="h-3.5 w-3.5 text-zinc-500" />
          {formatRupiah(job.work_salaryperhour)}/jam
        </span>

        <span>•</span>

        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-zinc-500" />
          {job.work_hours} jam/mgg
        </span>

        <span>•</span>

        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-zinc-500" />
          {job.work_job_location} ({job.work_system})
        </span>
      </div>

      {/* Matching Chips Highlights */}
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {isSalaryGood && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" /> Upah Sesuai
          </span>
        )}
        {isLocationGood && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" /> Lokasi Cocok
          </span>
        )}
        {isCategoryMatch && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" /> Minat Kategori
          </span>
        )}
      </div>
    </div>
  )
}
