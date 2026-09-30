import {
  RiExternalLinkLine,
  RiMapPinLine,
  RiBuilding2Line,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiBookmarkLine,
  RiBookmarkFill,
  RiShieldCheckLine,
} from 'react-icons/ri'
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

function CriterionRow({
  ok,
  title,
  body,
}: {
  ok: boolean | null
  title: string
  body: string
}) {
  return (
    <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-start gap-2">
      {ok === null ? (
        <RiCheckboxCircleLine className="h-4 w-4 mt-0.5 shrink-0 text-zinc-500" aria-hidden="true" />
      ) : ok ? (
        <RiCheckboxCircleLine className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      ) : (
        <RiCloseCircleLine className="h-4 w-4 mt-0.5 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
      )}
      <div className="min-w-0">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100 block text-xs">
          {title}
        </span>
        <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 mt-0.5">
          {body}
        </p>
      </div>
    </div>
  )
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
      <div className="min-h-[320px] flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950">
        <RiBuilding2Line className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-3" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
          Pilih lowongan untuk melihat detail
        </h3>
        <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
          Klik salah satu lowongan di daftar untuk melihat rincian pekerjaan dan analisis kecocokan SPK.
        </p>
      </div>
    )
  }

  const matchPct = Math.round(Math.min(100, Math.max(0, job.finalScore * 100)))

  const isCategoryMatch =
    job.job_category.trim().toLowerCase() === studentPrefs.preferredCategory.trim().toLowerCase()
  const salaryRatio = job.work_salaryperhour / Math.max(1, studentPrefs.minSalary)
  const isSalaryGood = salaryRatio >= 1
  const isLocationMatch =
    job.work_system?.toLowerCase() === 'remote' ||
    (job.work_job_location || '').toLowerCase().includes(studentPrefs.location.toLowerCase())
  const isHoursGood = job.work_hours <= studentPrefs.maxHours

  const skillCosine = parseFloat(String(job.C5_kemiripan_skill)) || 0
  const skillPct = Math.round(Math.min(1, Math.max(0, skillCosine)) * 100)

  const skills = (job.work_required_skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12)

  const barColor =
    job.rank === 1
      ? 'bg-emerald-600 dark:bg-emerald-500'
      : matchPct >= 50
        ? 'bg-amber-500 dark:bg-amber-400'
        : 'bg-zinc-400 dark:bg-zinc-500'

  return (
    <section
      key={job.job_id}
      aria-label={`Detail ${job.job_title}`}
      className="emil-detail-swap rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden"
    >
      {/* Detail Header */}
      <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <CompanyLogo companyName={job.company_name} logoUrl={job.company_logo} />
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className="font-mono text-[11px]">
                  {job.job_id}
                </Badge>
                <Badge variant={job.rank === 1 ? 'success' : job.rank <= 3 ? 'warning' : 'secondary'} className="text-[11px]">
                  Rekomendasi #{job.rank}
                </Badge>
                <Badge variant="outline">{job.job_category}</Badge>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight text-balance leading-tight">
                {job.job_title}
              </h2>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 inline-flex items-center gap-1">
                  <RiBuilding2Line className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                  {job.company_name}
                </span>
                <span aria-hidden="true">•</span>
                <span className="inline-flex items-center gap-1 text-[13px]">
                  <RiMapPinLine className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
                  {job.work_job_location} ({job.work_system})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleSave}
              title={isSaved ? 'Hapus simpanan' : 'Simpan lowongan'}
              aria-label={isSaved ? 'Hapus dari simpanan' : 'Simpan lowongan'}
              aria-pressed={isSaved}
              className="h-9 w-9"
            >
              {isSaved ? (
                <RiBookmarkFill
                  className="h-4 w-4 text-amber-600 dark:text-amber-400"
                  aria-hidden="true"
                />
              ) : (
                <RiBookmarkLine className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>

            {job.url && (
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                <Button variant="default" size="sm" className="gap-1.5 text-xs whitespace-nowrap">
                  Lamar <RiExternalLinkLine className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </a>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {[
            { label: 'Upah / jam', value: formatRupiah(job.work_salaryperhour), mono: true },
            { label: 'Beban kerja', value: `${job.work_hours} jam/mgg`, mono: true },
            { label: 'Sistem', value: job.work_system, mono: false },
            { label: 'Sumber', value: job.source_portal || 'Resmi', mono: false },
          ].map((s) => (
            <div
              key={s.label}
              className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 min-w-0"
            >
              <dt className="text-[11px] text-zinc-500 truncate">{s.label}</dt>
              <dd
                className={`text-sm text-zinc-900 dark:text-zinc-50 truncate ${
                  s.mono ? 'font-mono font-semibold' : 'font-medium'
                }`}
                title={String(s.value)}
              >
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* SPK Match Breakdown */}
      <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 space-y-4 bg-zinc-50/60 dark:bg-zinc-900/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Analisis kesesuaian SPK
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Skor U(Ai){' '}
            <strong className="font-mono text-zinc-900 dark:text-zinc-50">
              {job.finalScore.toFixed(4)} ({matchPct}%)
            </strong>
          </p>
        </div>

        <div
          role="progressbar"
          aria-label={`Kecocokan ${matchPct} persen`}
          aria-valuenow={matchPct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden"
        >
          <div className={`${barColor} emil-meter h-full rounded-full`} style={{ width: `${matchPct}%` }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <CriterionRow
            ok={isCategoryMatch}
            title="C1 — Kategori pekerjaan"
            body={
              isCategoryMatch
                ? `Sesuai minat Anda (${job.job_category}).`
                : `Berbeda dari minat Anda (${studentPrefs.preferredCategory}).`
            }
          />
          <CriterionRow
            ok={isSalaryGood}
            title={`C2 — Upah (${salaryRatio.toFixed(2)}× target)`}
            body={`Tawaran ${formatRupiah(job.work_salaryperhour)} vs target ${formatRupiah(studentPrefs.minSalary)}.`}
          />
          <CriterionRow
            ok={isLocationMatch}
            title="C3 — Lokasi & moda"
            body={
              job.work_system?.toLowerCase() === 'remote'
                ? 'Remote (fleksibilitas maksimal untuk jadwal kuliah).'
                : isLocationMatch
                  ? `Di wilayah domisili Anda (${job.work_job_location}).`
                  : `Di ${job.work_job_location}, di luar domisili ${studentPrefs.location}.`
            }
          />
          <CriterionRow
            ok={isHoursGood}
            title={`C4 — Beban jam (${job.work_hours} jam)`}
            body={
              isHoursGood
                ? `Dalam batas Anda (${studentPrefs.maxHours} jam/minggu). Aman untuk kuliah.`
                : `Melebihi batas Anda (${studentPrefs.maxHours} jam/minggu). Perlu pertimbangan.`
            }
          />
          <div className="sm:col-span-2">
            <CriterionRow
              ok={skillCosine >= 0.3 ? true : skillCosine > 0 ? false : null}
              title={`C5 — Kecocokan keahlian (${skillPct}%)`}
              body="Irisan kata kunci skill Anda dengan deskripsi lowongan (TF-IDF cosine)."
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500 pt-1">
          <span className="font-mono">U(Ai) = Σ (wⱼ × uⱼ) · bobot ROC</span>
          <button
            onClick={onOpenPreferences}
            className="text-zinc-900 dark:text-zinc-100 font-semibold underline underline-offset-2 hover:no-underline cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100"
          >
            Ubah bobot prioritas
          </button>
        </div>
      </div>

      {/* Skills */}
      <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
        <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Keahlian yang diminta
        </h4>
        {skills.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {skills.map((skill, idx) => (
              <li key={`${skill}-${idx}`}>
                <Badge variant="secondary" className="text-xs py-1 px-2.5 font-normal">
                  {skill}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-zinc-500">Tidak ada daftar keahlian terstruktur untuk lowongan ini.</p>
        )}
      </div>

      {/* Trust + footer */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
          <p className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
            <RiShieldCheckLine className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Terverifikasi 6-lapis CRISP-DM
          </p>
          <p className="leading-relaxed">
            Bebas kata kunci magang/freelance bersyarat, gaji wajar, di bawah 30 jam/minggu, dan tautan aktif.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="text-xs text-zinc-500 inline-flex items-center gap-1">
            <RiCalendarLine className="h-3.5 w-3.5" aria-hidden="true" />
            Posting: {job.date_posted || '2026'}
          </span>

          {job.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              <Button variant="default" size="sm" className="gap-1.5 text-xs">
                Buka portal {job.source_portal || 'resmi'} <RiExternalLinkLine className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
