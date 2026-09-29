import {
  ExternalLink,
  MapPin,
  Building2,
  Calendar,
  CheckCircle2,
  Bookmark,
  ShieldCheck,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { CompanyLogo } from './CompanyLogo'
import type { RankedJobResult } from '../types/data'
import type { StudentPreferences } from '../types/portal'
import { formatRupiah } from '../lib/utils'

interface JobDetailPaneProps {
  job: RankedJobResult | null
  studentPrefs: StudentPreferences
  isSaved: boolean
  onToggleSave: () => void
  onOpenPreferences: () => void
}

export function JobDetailPane({
  job,
  studentPrefs,
  isSaved,
  onToggleSave,
  onOpenPreferences,
}: JobDetailPaneProps) {
  if (!job) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500">
        <Building2 className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-3" />
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
          Pilih lowongan untuk melihat detail
        </h3>
        <p className="text-xs max-w-xs">
          Klik salah satu lowongan di sebelah kiri untuk melihat rincian pekerjaan dan analisis kecocokan SPK SMARTER.
        </p>
      </div>
    )
  }

  const matchPct = Math.min(99, Math.max(35, Math.round(job.finalScore * 100)))

  // Evaluasi kriteria individual
  const isCategoryMatch =
    job.job_category.trim().toLowerCase() === studentPrefs.preferredCategory.trim().toLowerCase()
  const salaryRatio = (job.work_salaryperhour / studentPrefs.minSalary).toFixed(2)
  const isLocationMatch =
    job.work_system?.toLowerCase() === 'remote' ||
    (job.work_job_location || '').toLowerCase().includes(studentPrefs.location.toLowerCase())

  return (
    <div className="h-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-y-auto">
      {/* Detail Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <CompanyLogo companyName={job.company_name} logoUrl={job.company_logo} />
            <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-[11px]">
                {job.job_id}
              </Badge>
              <Badge variant={job.rank === 1 ? 'warning' : 'secondary'} className="text-[11px]">
                Rekomendasi #{job.rank}
              </Badge>
              <Badge variant="outline">{job.job_category}</Badge>
            </div>

            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {job.job_title}
            </h2>

            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                <Building2 className="h-4 w-4 text-zinc-500" />
                {job.company_name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                {job.work_job_location} ({job.work_system})
              </span>
            </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleSave}
              title={isSaved ? 'Hapus Simpan' : 'Simpan Loker'}
              className="h-9 w-9 text-zinc-700 dark:text-zinc-300"
            >
              <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
            </Button>

            {job.url && (
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                <Button variant="default" size="sm" className="gap-1.5 text-xs">
                  Lamar Pekerjaan <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Quick Specs Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <span className="text-[11px] text-zinc-500 block mb-0.5">Tawaran Upah / Jam</span>
            <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-50">
              {formatRupiah(job.work_salaryperhour)}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <span className="text-[11px] text-zinc-500 block mb-0.5">Beban Jam Kerja</span>
            <span className="font-mono font-semibold text-sm text-zinc-900 dark:text-zinc-50">
              {job.work_hours} jam / minggu
            </span>
          </div>

          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <span className="text-[11px] text-zinc-500 block mb-0.5">Sistem Kehadiran</span>
            <span className="font-medium text-sm text-zinc-900 dark:text-zinc-50">
              {job.work_system}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <span className="text-[11px] text-zinc-500 block mb-0.5">Portal Sumber</span>
            <span className="font-medium text-sm text-zinc-900 dark:text-zinc-50">
              {job.source_portal || 'Resmi'}
            </span>
          </div>
        </div>
      </div>

      {/* SPK Match Breakdown Box */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Analisis Kesesuaian SPK (SMARTER & ROC)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Skor Total U(Ai):</span>
            <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-50">
              {job.finalScore.toFixed(4)} ({matchPct}% Match)
            </span>
          </div>
        </div>

        {/* Progress Bar Match */}
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-zinc-900 dark:bg-zinc-100 h-full rounded-full transition-all duration-500"
            style={{ width: `${matchPct}%` }}
          />
        </div>

        {/* 5 Criteria Evaluated */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
          {/* C1 */}
          <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-start gap-2">
            <CheckCircle2
              className={`h-4 w-4 mt-0.5 shrink-0 ${
                isCategoryMatch
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-400'
              }`}
            />
            <div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                C1: Kategori Pekerjaan
              </span>
              <p className="text-[11px] text-zinc-500">
                {isCategoryMatch
                  ? `Sesuai minat Anda (${job.job_category})`
                  : `Bidang berbeda dari minat Anda (${studentPrefs.preferredCategory})`}
              </p>
            </div>
          </div>

          {/* C2 */}
          <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-start gap-2">
            <CheckCircle2
              className={`h-4 w-4 mt-0.5 shrink-0 ${
                job.work_salaryperhour >= studentPrefs.minSalary
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-400'
              }`}
            />
            <div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                C2: Rasio Upah ({salaryRatio}x target)
              </span>
              <p className="text-[11px] text-zinc-500">
                Tawaran {formatRupiah(job.work_salaryperhour)} vs target Anda{' '}
                {formatRupiah(studentPrefs.minSalary)}
              </p>
            </div>
          </div>

          {/* C3 */}
          <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-start gap-2">
            <CheckCircle2
              className={`h-4 w-4 mt-0.5 shrink-0 ${
                isLocationMatch
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-400'
              }`}
            />
            <div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                C3: Lokasi & Moda Kerja
              </span>
              <p className="text-[11px] text-zinc-500">
                {job.work_system?.toLowerCase() === 'remote'
                  ? 'Pekerjaan Remote WFH (Fleksibilitas maksimal)'
                  : isLocationMatch
                  ? `Berada di wilayah domisili Anda (${job.work_job_location})`
                  : `Lokasi di ${job.work_job_location} (Di luar domisili Anda)`}
              </p>
            </div>
          </div>

          {/* C4 */}
          <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                C4: Beban Jam Kerja ({job.work_hours} jam)
              </span>
              <p className="text-[11px] text-zinc-500">
                Target waktu Anda: {studentPrefs.maxHours} jam/minggu (Beban wajar mahasiswa)
              </p>
            </div>
          </div>

          {/* C5 */}
          <div className="sm:col-span-2 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-zinc-700 dark:text-zinc-300" />
            <div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                C5: Derajat Kesesuaian Keahlian (Cosine Similarity: {job.C5_kemiripan_skill})
              </span>
              <p className="text-[11px] text-zinc-500">
                Dihitung dari irisan kata kunci keahlian mahasiswa dengan deskripsi lowongan via NLP TF-IDF.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
          <span>Formula: U(Ai) = Σ (w_j × u_j(X_ij)) pembobotan ROC</span>
          <button
            onClick={onOpenPreferences}
            className="text-zinc-900 dark:text-zinc-100 font-semibold underline hover:no-underline cursor-pointer"
          >
            Ubah Prioritas Bobot
          </button>
        </div>
      </div>

      {/* Skills Required Section */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Keahlian & Persyaratan (Skills)
        </h4>

        <div className="flex flex-wrap gap-1.5">
          {(job.work_required_skills || '').split(',').map((skill: string, idx: number) => (
            <Badge key={idx} variant="secondary" className="text-xs py-1 px-2.5">
              {skill.trim()}
            </Badge>
          ))}
        </div>
      </div>

      {/* Company Verification Note */}
      <div className="p-6 space-y-4">
        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Lowongan Lolos Seleksi 6-Lapisan CRISP-DM
          </div>
          <p className="leading-relaxed">
            Pekerjaan ini telah diverifikasi bebas dari kata kunci magang/freelance bersyarat, memiliki rentang gaji wajar, beban jam kerja di bawah 30 jam, dan tautan pendaftaran aktif (HTTP 200).
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Posting: {job.date_posted || '2026'}
          </span>

          {job.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              <Button variant="default" size="sm" className="gap-1.5 text-xs">
                Kunjungi Portal {job.source_portal || 'Resmi'} <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
