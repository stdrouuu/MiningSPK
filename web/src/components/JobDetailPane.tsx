import { CompanyLogo } from './CompanyLogo'
import { relativePosting } from './JobCardItem'
import type { RankedJobResult } from '../types/data'
import type { StudentPreferences } from '../types/portal'

interface JobDetailPaneProps {
  job: RankedJobResult | null
  studentPrefs: StudentPreferences
  /** Profil belum terisi -> panel "Bagaimana Anda cocok" diganti ajakan kuesioner. */
  hideAnalysis?: boolean
  onFillQuestionnaire?: () => void
  isSaved: boolean
  onToggleSave: () => void
  onOpenPreferences: () => void
}

export function JobDetailPane({
  job,
  studentPrefs,
  hideAnalysis = false,
  onFillQuestionnaire,
  isSaved,
  onToggleSave,
  onOpenPreferences,
}: JobDetailPaneProps) {
  if (!job) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 sticky top-6 shadow-xs">
        <div className="py-16 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center font-medium">?</div>
          <h3 className="text-[15px] sm:text-[15px] font-medium text-slate-800">Pilih lowongan untuk melihat detail</h3>
          <p className="text-sm text-slate-400 font-light max-w-xs mx-auto">
            Klik salah satu lowongan di daftar untuk melihat rincian pekerjaan dan analisis kecocokan SPK.
          </p>
        </div>
      </div>
    )
  }

  const matchPct = Math.round(Math.min(100, Math.max(0, job.finalScore * 100)))
  const isCategoryMatch = job.job_category?.trim().toLowerCase() === studentPrefs.preferredCategory.trim().toLowerCase()
  const salaryRatio = job.work_salaryperhour / Math.max(1, studentPrefs.minSalary)
  const isWithinHours = job.work_hours <= studentPrefs.maxHours

  let c3Desc = ''
  if (job.work_system?.toLowerCase() === 'remote') {
    c3Desc = 'Remote (fleksibilitas maksimal untuk jadwal kuliah).'
  } else if ((job.work_job_location || '').toLowerCase().includes(studentPrefs.location.toLowerCase())) {
    c3Desc = `Di wilayah domisili Anda (${job.work_job_location}).`
  } else {
    c3Desc = `Di ${job.work_job_location}, di luar domisili ${studentPrefs.location}.`
  }

  const c4Desc = isWithinHours
    ? `Dalam batas Anda (${studentPrefs.maxHours} jam/minggu). Aman untuk kuliah.`
    : `Melebihi batas Anda (${studentPrefs.maxHours} jam/minggu). Perlu pertimbangan.`

  const rawSkills = (job.work_required_skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const allSkills = rawSkills.slice(0, 12)

  // Lokasi & work system bisa berisi teks sama (mis. "Remote") — jangan tampil dobel.
  const locationText = (job.work_job_location || '').trim()
  const systemText = (job.work_system || '').trim()
  const showLocation = locationText.length > 0 && locationText.toLowerCase() !== systemText.toLowerCase()

  return (
    <section
      key={job.job_id}
      aria-label={`Detail ${job.job_title}`}
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5"
    >
      {/* Logo besar di kiri + aksi (bookmark & buka portal) di kanan, gaya JobStreet */}
      <div className="flex items-start justify-between gap-3">
        <CompanyLogo companyName={job.company_name} logoUrl={job.company_logo} size="xl" />
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleSave}
            className="p-2.5 rounded-lg border border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            title={isSaved ? 'Hapus dari simpanan' : 'Simpan lowongan'}
            aria-pressed={isSaved}
          >
            <svg
              className={`w-4 h-4 ${isSaved ? 'text-[#ED1E79] fill-current' : ''}`}
              fill={isSaved ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0C52EE] hover:bg-[#0942c4] text-white rounded-lg text-sm font-medium transition-colors shadow-2xs"
            >
              <span>Lamar</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h7m0 0v7m0-7L11 16" />
              </svg>
            </a>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl sm:text-3xl font-medium text-slate-900 leading-snug">{job.job_title}</h2>
        <div className="flex items-center gap-2 flex-wrap text-[15px] text-slate-700 mt-1">
          <span>{job.company_name}</span>
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" aria-label="Perusahaan terverifikasi">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12.5l2 2 4-4.5" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3l7.5 3.2v4.6c0 4.6-3.2 8.3-7.5 9.9-4.3-1.6-7.5-5.3-7.5-9.9V6.2L12 3z" />
          </svg>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-pink-100/60 text-[#c83472] text-[13px] font-medium leading-none">
            {job.job_category}
          </span>
        </div>
      </div>

      {/* Section 2: lokasi, work system, upah per jam */}
      <ul className="space-y-1 text-[15px] text-slate-600 font-light">
        {showLocation && (
          <li className="flex items-center gap-2.5">
            <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {locationText}
          </li>
        )}
        <li className="flex items-center gap-2.5">
          <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" strokeWidth="2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7v5l3 3" />
          </svg>
          {job.work_system}
        </li>
        <li className="flex items-center gap-2.5">
          <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth="2" />
            <circle cx="12" cy="12" r="2.5" strokeWidth="2" />
            <path strokeLinecap="round" strokeWidth="2" d="M6 6V4m12 2V4" />
          </svg>
          <span className="font-normal text-slate-900">Rp {job.work_salaryperhour.toLocaleString('id-ID')} per jam</span>
        </li>
      </ul>

      {/* Section 3: keahlian yang diminta */}
      <div className="space-y-2">
        <h4 className="text-[15px] font-medium text-slate-900">Keahlian yang diminta</h4>
        <div className="flex flex-wrap gap-1.5">
          {allSkills.length > 0 ? (
            allSkills.map((s, i) => (
              <span key={`${s}-${i}`} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm font-light">{s}</span>
            ))
          ) : (
            <span className="text-sm text-slate-400 font-light">Tidak ada daftar keahlian terstruktur.</span>
          )}
        </div>
      </div>

      {/* Section 4: waktu & portal posting */}
      <p className="text-sm text-slate-500 font-light">
        {relativePosting(job.date_posted)} dari portal <span className="font-normal text-slate-800">{job.source_portal || 'resmi'}</span>
      </p>

      {hideAnalysis ? (
        <div className="mt-2 border-t border-slate-200 pt-5 space-y-2">
          <h4 className="text-[15px] font-medium text-slate-900">Lihat seberapa cocok lowongan ini buatmu</h4>
          <p className="text-sm text-slate-500 font-light">
            Isi kuesioner singkat (±3 menit) — skor kecocokan dan analisis SPK lowongan ini
            langsung dihitung dari kebutuhanmu.
          </p>
          <button
            onClick={onFillQuestionnaire}
            className="px-4 py-2 bg-[#0C52EE] hover:bg-[#0942c4] text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Mulai kuesioner
          </button>
        </div>
      ) : (
      <div className="mt-2 border-t border-slate-200 pt-5 space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h4 className="text-[15px] font-medium text-slate-900 shrink-0">Analisis kesesuaian SPK</h4>
          <p className="shrink-0 flex items-baseline gap-1.5 text-[13px] text-slate-500">
            Skor U(Ai) {job.finalScore.toFixed(4)}
            <span className="text-sm font-semibold text-slate-900 tabular-nums">{matchPct}%</span>
          </p>
        </div>

        <div className="w-full h-1 rounded-full bg-slate-200/70 overflow-hidden" role="progressbar" aria-valuenow={matchPct} aria-valuemin={0} aria-valuemax={100} aria-label={`Kecocokan SPK ${matchPct}%`}>
          <div className="h-full rounded-full bg-[#0C52EE]" style={{ width: `${matchPct}%` }} />
        </div>

        <div className="space-y-2.5">
          {[
            { label: 'Kategori pekerjaan', body: isCategoryMatch ? `Sesuai minat Anda (${job.job_category}).` : `Berbeda dari minat Anda (${studentPrefs.preferredCategory}).`, warn: false },
            { label: `Upah (${salaryRatio.toFixed(2)}× target)`, body: `Tawaran Rp ${job.work_salaryperhour.toLocaleString('id-ID')} vs target Rp ${studentPrefs.minSalary.toLocaleString('id-ID')}.`, warn: false },
            { label: 'Lokasi & moda', body: c3Desc, warn: false },
            { label: `Beban jam (${job.work_hours} jam)`, body: c4Desc, warn: !isWithinHours },
            { label: 'Kecocokan keahlian', body: 'Irisan kata kunci skill Anda dengan deskripsi lowongan (TF-IDF cosine).', warn: false },
          ].map((row) => (
            <div key={row.label} className="flex gap-4">
              <span className="w-36 shrink-0 text-[13px] leading-normal text-slate-500">{row.label}</span>
              <span className={`flex-1 text-sm leading-relaxed ${row.warn ? 'text-[#d12e32] font-medium' : 'text-slate-700 font-normal'}`}>{row.body}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-[13px] text-slate-500">U(Ai) = {"\u03A3"} (w{'\u2C7C'} {"\u00D7"} u{'\u2C7C'}) {"\u2022"} bobot ROC</span>
          <button onClick={onOpenPreferences} className="text-[#0C52EE] font-medium hover:underline underline-offset-4">
            Ubah bobot prioritas
          </button>
        </div>
      </div>
      )}
    </section>
  )
}
