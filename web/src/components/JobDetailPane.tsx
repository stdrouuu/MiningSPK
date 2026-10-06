import { CompanyLogo } from './CompanyLogo'
import type { RankedJobResult } from '../types/data'
import type { StudentPreferences } from '../types/portal'

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
      <div className="bg-white border border-slate-200 rounded-xl p-6 sticky top-20 shadow-xs">
        <div className="py-16 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center font-medium">?</div>
          <h3 className="text-sm font-medium text-slate-800">Pilih lowongan untuk melihat detail</h3>
          <p className="text-xs text-slate-400 font-light max-w-xs mx-auto">
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

  const skills = (job.work_required_skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12)

  return (
    <section
      key={job.job_id}
      aria-label={`Detail ${job.job_title}`}
      className="bg-white border border-slate-200 rounded-xl p-6 sticky top-20 shadow-xs space-y-5"
    >
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3 min-w-0">
          <CompanyLogo companyName={job.company_name} logoUrl={job.company_logo} />
          <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[#0C52EE] text-[11px] font-medium">
              Rekomendasi #{job.rank}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-pink-50 border border-pink-200 text-[#ED1E79] text-[11px] font-medium">{job.job_category}</span>
            <span className="text-xs text-slate-400 font-light">{job.job_id}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-medium text-slate-900 leading-snug">{job.job_title}</h2>
          <p className="text-xs text-slate-500 font-light mt-0.5">
            {job.company_name} {"\u2022"} {job.work_job_location} {"\u2022"}{' '}
            <span className="px-1.5 py-0.2 rounded border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-normal">{job.work_system}</span>
          </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleSave}
            className="p-2 rounded-lg border border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            title={isSaved ? 'Hapus dari simpanan' : 'Simpan lowongan'}
            aria-pressed={isSaved}
          >
            <svg className={`w-4 h-4 ${isSaved ? 'text-[#ED1E79] fill-current' : ''}`} fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#0C52EE] hover:bg-[#0942c4] text-white rounded-lg text-xs font-medium transition-colors shadow-2xs flex items-center gap-1"
            >
              <span>Lamar</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-400 font-light block">Upah / jam</span>
          <span className="font-medium text-slate-900">Rp {job.work_salaryperhour.toLocaleString('id-ID')}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-400 font-light block">Beban kerja</span>
          <span className="font-medium text-slate-900">{job.work_hours} jam/mgg</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-400 font-light block">Sistem</span>
          <span className="font-medium text-slate-900">{job.work_system}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-400 font-light block">Sumber</span>
          <span className="font-medium text-slate-900">{job.source_portal || 'Resmi'}</span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-[#0C52EE]">Analisis kesesuaian SPK</h4>
          <span className="text-xs font-medium text-[#0C52EE]">
            Skor U(Ai) {job.finalScore.toFixed(4)} ({matchPct}%)
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden" role="progressbar" aria-valuenow={matchPct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-[#0C52EE]" style={{ width: `${matchPct}%` }} />
        </div>

        <div className="space-y-2 text-xs font-light text-slate-700">
          {[
            { code: 'C1', title: 'Kategori pekerjaan: ', body: isCategoryMatch ? `Sesuai minat Anda (${job.job_category}).` : `Berbeda dari minat Anda (${studentPrefs.preferredCategory}).` },
            { code: 'C2', title: `Upah (${salaryRatio.toFixed(2)}× target): `, body: `Tawaran Rp ${job.work_salaryperhour.toLocaleString('id-ID')} vs target Rp ${studentPrefs.minSalary.toLocaleString('id-ID')}.` },
            { code: 'C3', title: 'Lokasi & moda: ', body: c3Desc },
            { code: 'C4', title: `Beban jam (${job.work_hours} jam): `, body: c4Desc },
            { code: 'C5', title: 'Kecocokan keahlian: ', body: 'Irisan kata kunci skill Anda dengan deskripsi lowongan (TF-IDF cosine).' },
          ].map((row) => (
            <div key={row.code} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200">
              <span className="font-medium text-white bg-[#0C52EE] px-1.5 py-0.5 rounded text-[11px] w-7 text-center shrink-0">{row.code}</span>
              <div>
                <span className="font-normal text-slate-900">{row.title}</span>
                <span>{row.body}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-[11px] text-slate-500 font-light">
          <span>U(Ai) = {"\u03A3"} (w{'\u2C7C'} {"\u00D7"} u{'\u2C7C'}) {"\u2022"} bobot ROC</span>
          <button onClick={onOpenPreferences} className="text-[#0C52EE] font-medium hover:underline">
            Ubah bobot prioritas
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-slate-900">Keahlian yang diminta</h4>
        <div className="flex flex-wrap gap-1.5">
          {skills.length > 0 ? (
            skills.map((s, i) => (
              <span key={`${s}-${i}`} className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-xs font-light">{s}</span>
            ))
          ) : (
            <span className="text-xs text-slate-400 font-light">Tidak ada daftar keahlian terstruktur.</span>
          )}
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-500 font-light">
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-medium">Terverifikasi 6-lapis CRISP-DM</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Bebas kata kunci magang/freelance bersyarat, gaji wajar, di bawah 30 jam/minggu, dan tautan aktif.
        </p>
        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
          <span>Posting: {job.date_posted || '2026/02'}</span>
          {job.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-[#0C52EE] font-medium hover:underline">
              Buka portal {job.source_portal || 'resmi'} {"\u2192"}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
