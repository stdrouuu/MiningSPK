import { BrandLogo } from './BrandLogo'

interface SiteFooterProps {
  totalJobs: number
  onNavigate: (view: 'landing' | 'portal' | 'matrix' | 'kuesioner') => void
  onOpenPreferences?: () => void
}

export function SiteFooter({ totalJobs, onNavigate, onOpenPreferences }: SiteFooterProps) {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 mt-16 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-slate-400 font-light transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
        <div className="space-y-2 col-span-2 md:col-span-1">
          <BrandLogo
            iconClassName="w-5 h-5 shrink-0"
            textClassName="text-lg font-medium tracking-tighter text-slate-900 dark:text-white"
          />
          <p className="text-[11px] text-slate-400 leading-relaxed font-light">
            Sistem rekomendasi part-time untuk mahasiswa berbasis metode
            Multi-Criteria Decision Making (MCDM) SMARTER &amp; ROC.
          </p>
        </div>
        <div className="space-y-1.5">
          <h4 className="font-medium text-slate-900 dark:text-white text-xs">
            Navigasi
          </h4>
          <p>
            <button
              onClick={() => onNavigate('landing')}
              className="hover:text-[#0C52EE] cursor-pointer"
            >
              Beranda
            </button>
          </p>
          <p>
            <button
              onClick={() => onNavigate('portal')}
              className="hover:text-[#0C52EE] cursor-pointer"
            >
              Lowongan
            </button>
          </p>
          <p>
            <button
              onClick={() => onNavigate('matrix')}
              className="hover:text-[#0C52EE] cursor-pointer"
            >
              Perhitungan SPK
            </button>
          </p>
          {onOpenPreferences && (
            <p>
              <button
                onClick={onOpenPreferences}
                className="hover:text-[#0C52EE] cursor-pointer"
              >
                Atur Kriteria SPK
              </button>
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <h4 className="font-medium text-slate-900 dark:text-white text-xs">
            Untuk Siapa
          </h4>
          <p className="text-slate-400">Mahasiswa Aktif</p>
          <p className="text-slate-400">Semua Jurusan &amp; Kampus</p>
          <p className="text-slate-400">Indonesia</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-[11px] text-center sm:text-left">
        <span className="tracking-tighter">
          {'\u00A9'} 2026 upmatch. All rights reserved.
        </span>
        <span>
          {totalJobs} Lowongan Terverifikasi {'\u2022'} Untuk Mahasiswa
        </span>
      </div>
    </footer>
  )
}
