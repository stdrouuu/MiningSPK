import { navButtonClass, navIndicatorClass } from '../../lib/navStyle'

interface LandingNavProps {
  active: 'landing' | 'portal' | 'matrix'
  savedCount: number
  onNavigate: (view: 'landing' | 'portal' | 'matrix') => void
  onOpenSavedJobs: () => void
}

export function LandingNav({ active, savedCount, onNavigate, onOpenSavedJobs }: LandingNavProps) {
  const navIndicator = navIndicatorClass()

  const link = (view: 'landing' | 'portal' | 'matrix', label: string) => {
    const isActive = active === view
    return (
      <button
        onClick={() => onNavigate(view)}
        aria-current={isActive ? 'page' : undefined}
        className={navButtonClass(isActive)}
      >
        {label}
        {isActive && navIndicator && <span className={navIndicator} aria-hidden="true" />}
      </button>
    )
  }

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button onClick={() => onNavigate('landing')} className="flex items-center text-left group focus:outline-none">
            <span className="text-xl font-medium tracking-tighter text-slate-900">upmatch</span>
          </button>

          <nav className="hidden md:flex items-center gap-2 text-sm font-normal">
            {link('landing', 'Beranda')}
            {link('portal', 'Lowongan')}
            {link('matrix', 'Perhitungan')}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSavedJobs}
            className="relative p-2 rounded-lg border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center"
            title={`Lowongan tersimpan (${savedCount})`}
            aria-label={`Lowongan tersimpan (${savedCount})`}
          >
            <svg className="w-4 h-4 text-[#ED1E79]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#ED1E79] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-2xs">
              {savedCount}
            </span>
          </button>

          <button
            onClick={() => onNavigate('portal')}
            className="px-4 py-2 bg-[#0C52EE] hover:bg-[#0942c4] text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-sm focus:outline-none"
          >
            Lihat lowongan
          </button>
        </div>
      </div>
    </header>
  )
}