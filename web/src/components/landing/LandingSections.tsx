import { useState } from 'react'
import { CompanyLogo } from '../CompanyLogo'
import type { RankedJobResult } from '../../types/data'

const CATEGORY_ICONS: Array<{ match: string; label: string; icon: React.ReactNode }> = [
  {
    match: 'Retail',
    label: 'Retail & Sales',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />,
  },
  {
    match: 'Design',
    label: 'Design & Creative',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />,
  },
  {
    match: 'Education',
    label: 'Education & Tutoring',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  },
  {
    match: 'Food',
    label: 'Food & Beverage',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />,
  },
  {
    match: 'Technology',
    label: 'Technology Support',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  },
  {
    match: 'Hospitality',
    label: 'Hospitality',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  },
  {
    match: 'Administrative',
    label: 'Administrative',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  },
  {
    match: 'Marketing',
    label: 'Marketing',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />,
  },
  {
    match: 'Customer',
    label: 'Customer Service',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />,
  },
]

export function CategoryGrid({
  jobs,
  onSelectCategory,
  onExploreAll,
}: {
  jobs: RankedJobResult[]
  onSelectCategory: (cat: string) => void
  onExploreAll: () => void
}) {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900">Browse by category</h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light">
            Temukan pekerjaan yang tepat untukmu dari {jobs.length}+ lowongan terverifikasi di Jabodetabek.
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {CATEGORY_ICONS.map((c) => {
              const count = jobs.filter((j) => (j.job_category || '').toLowerCase().includes(c.match.toLowerCase())).length
              return (
                <button
                  key={c.match}
                  onClick={() => onSelectCategory(jobs.find((j) => (j.job_category || '').toLowerCase().includes(c.match.toLowerCase()))?.job_category || c.label)}
                  className="relative overflow-hidden bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50/50 rounded-xl p-3.5 sm:p-4 transition-all cursor-pointer group flex items-center justify-between min-h-[76px] text-left"
                >
                  <div className="relative z-10 min-w-0 pr-8 text-left">
                    <h3 className="text-xs sm:text-sm font-medium text-slate-900 group-hover:text-slate-950 transition-colors truncate">{c.label}</h3>
                    <p className="text-[11px] text-slate-400 font-light mt-0.5">{count} Jobs Available</p>
                  </div>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-slate-200 group-hover:text-slate-300 transition-colors">
                    <svg className="w-14 h-14" fill="none" stroke="currentColor" strokeWidth="1.3" viewBox="0 0 24 24">
                      {c.icon}
                    </svg>
                  </div>
                </button>
              )
            })}

            <button
              onClick={onExploreAll}
              className="relative overflow-hidden bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50/50 rounded-xl p-3.5 sm:p-4 transition-all cursor-pointer group flex items-center justify-between min-h-[76px] text-left"
            >
              <div className="relative z-10 min-w-0 pr-8 text-left">
                <h3 className="text-xs sm:text-sm font-medium text-[#0C52EE] group-hover:text-slate-900 transition-colors truncate">Semua Lowongan</h3>
                <p className="text-[11px] text-slate-400 font-light mt-0.5">Explore Portal {"\u2192"}</p>
              </div>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-slate-200 group-hover:text-slate-300 transition-colors">
                <svg className="w-14 h-14" fill="none" stroke="currentColor" strokeWidth="1.3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-4">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-2 h-2 rounded-full bg-[#0C52EE]" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>
    </section>
  )
}

export function FeaturedJobs({
  jobs,
  onOpenJob,
  onBrowseAll,
}: {
  jobs: RankedJobResult[]
  onOpenJob: (job: RankedJobResult) => void
  onBrowseAll: () => void
}) {
  const featured = jobs.slice(0, 9)
  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-100">
      <div className="space-y-8">
        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900">Explore The Latest Job Openings</h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light">
            Daftar pekerjaan paruh waktu terverifikasi terkini yang cocok untuk jadwal kuliahmu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((job) => {
            const pct = Math.round(Math.min(100, Math.max(0, job.finalScore * 100)))
            return (
              <button
                key={job.job_id}
                onClick={() => onOpenJob(job)}
                className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-all shadow-2xs cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <CompanyLogo companyName={job.company_name} logoUrl={job.company_logo} />
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-medium text-slate-900 truncate">{job.job_title}</h3>
                      <p className="text-[11px] text-slate-500 font-light truncate">{job.company_name}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 border border-blue-200 text-[#0C52EE] shrink-0">
                    {pct}%
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-light">
                  <span className="font-medium text-slate-900">Rp {job.work_salaryperhour.toLocaleString('id-ID')}/jam</span>
                  <span>{job.work_hours} jam/mgg</span>
                  <span className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-normal">{job.work_system}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onBrowseAll}
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 hover:text-slate-900 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors bg-white shadow-2xs"
          >
            Browse All {jobs.length} Jobs {"\u2192"}
          </button>
        </div>
      </div>
    </section>
  )
}

export function StatsPartners({ jobs }: { jobs: RankedJobResult[] }) {
  return (
    <section className="py-14 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="max-w-2xl mx-auto space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight">
            Guiding You To Your Dream Job With Renowned Companies
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light">
            Menghubungkan mahasiswa dengan peluang kerja resmi tanpa mengorbankan indeks prestasi kumulatif.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto py-2">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-medium text-slate-900 tracking-tight">
              {jobs.length}<span className="text-[#0C52EE]">+</span>
            </div>
            <p className="text-xs text-slate-400 font-light">Loker Terverifikasi</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-medium text-slate-900 tracking-tight">
              5<span className="text-[#0C52EE]">+</span>
            </div>
            <p className="text-xs text-slate-400 font-light">Kriteria Penilaian</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-medium text-slate-900 tracking-tight">
              100<span className="text-[#ED1E79]">%</span>
            </div>
            <p className="text-xs text-slate-400 font-light">Transparansi ROC</p>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-slate-400 font-medium text-xs sm:text-sm grayscale opacity-75">
          <span>Glints</span>
          <span>Jobstreet</span>
          <span>Kalibrr</span>
          <span>LinkedIn</span>
          <span>Indeed</span>
        </div>
      </div>
    </section>
  )
}

export function BlueBanner({
  onQuickSearch,
}: {
  onQuickSearch: (q: string) => void
}) {
  const [q, setQ] = useState('')
  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="w-full rounded-2xl bg-[#0C52EE] p-8 sm:p-12 text-center text-white space-y-4 shadow-sm">
        <h2 className="text-2xl sm:text-3xl font-medium tracking-tight">
          Start Looking For The Best Part-Time
        </h2>
        <p className="text-xs sm:text-sm text-blue-100 font-light max-w-xl mx-auto leading-relaxed">
          Temukan posisi kerja yang paling fleksibel dengan jadwal kuliahmu hari ini menggunakan algoritma SMARTER &amp; ROC.
        </p>

        <div className="pt-4 max-w-md mx-auto">
          <div className="bg-white rounded-xl p-1.5 flex items-center gap-2 shadow-sm text-slate-800">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onQuickSearch(q.trim())}
              placeholder="Cari posisi atau keahlian..."
              className="w-full text-xs px-3 py-2 bg-transparent focus:outline-none font-light placeholder-slate-400"
            />
            <button
              onClick={() => onQuickSearch(q.trim())}
              className="px-4 py-2 bg-[#0C52EE] hover:bg-[#0942c4] text-white rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function LandingFooter({
  totalJobs,
  onNavigate,
}: {
  totalJobs: number
  onNavigate: (view: 'landing' | 'portal' | 'matrix') => void
}) {
  return (
    <footer className="bg-white border-t border-slate-200 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 font-light">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div className="space-y-2 col-span-2 md:col-span-1">
          <div className="font-medium text-slate-900 text-base">upmatch</div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-light">
            Sistem rekomendasi part-time untuk mahasiswa berbasis metode Multi-Criteria Decision Making (MCDM) SMARTER &amp; ROC.
          </p>
        </div>
        <div className="space-y-1.5">
          <h4 className="font-medium text-slate-900 text-xs">Navigasi</h4>
          <p><button onClick={() => onNavigate('landing')} className="hover:text-[#0C52EE]">Beranda</button></p>
          <p><button onClick={() => onNavigate('portal')} className="hover:text-[#0C52EE]">Lowongan</button></p>
          <p><button onClick={() => onNavigate('matrix')} className="hover:text-[#0C52EE]">Perhitungan SPK</button></p>
        </div>
        <div className="space-y-1.5">
          <h4 className="font-medium text-slate-900 text-xs">Metodologi</h4>
          <p className="text-slate-400">CRISP-DM Fase 3</p>
          <p className="text-slate-400">Rank Order Centroid</p>
          <p className="text-slate-400">SMARTER Multi-Attribute</p>
        </div>
        <div className="space-y-1.5">
          <h4 className="font-medium text-slate-900 text-xs">Untuk Siapa</h4>
          <p className="text-slate-400">Mahasiswa Aktif</p>
          <p className="text-slate-400">Semua Jurusan & Kampus</p>
          <p className="text-slate-400">Indonesia</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px]">
        <span>{"\u00A9"} 2026 upmatch. All rights reserved.</span>
        <span>{totalJobs} Lowongan Terverifikasi {"\u2022"} Untuk Mahasiswa</span>
      </div>
    </footer>
  )
}
