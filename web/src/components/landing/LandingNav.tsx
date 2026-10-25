import { navButtonClass, navIndicatorClass } from '../../lib/navStyle'
import { ThemeToggle } from '../ui/ThemeToggle'

type NavView = 'landing' | 'portal' | 'matrix' | 'kuesioner'

interface LandingNavProps {
  mode: 'user' | 'data'
  active: NavView
  savedCount: number
  onNavigate: (view: NavView) => void
  onOpenSavedJobs: () => void
}

export function LandingNav({ mode, active, savedCount, onNavigate, onOpenSavedJobs }: LandingNavProps) {
  const navIndicator = navIndicatorClass()

  const link = (view: NavView, label: string) => {
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
    <header className="w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button onClick={() => onNavigate('landing')} className="flex items-center text-left group focus:outline-none">
            <span className="text-2xl font-medium tracking-tighter text-slate-900 dark:text-white">upmatch</span>
            {mode === 'data' && (
              <span className="ml-2 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[10px] font-medium text-amber-800 dark:text-amber-300">
                demo data
              </span>
            )}
          </button>

          <nav className="hidden md:flex items-center gap-2 text-sm sm:text-base font-normal">
            {link('landing', 'Beranda')}
            {link('portal', 'Lowongan')}
            {link('matrix', 'Perhitungan')}
            {mode === 'user' && link('kuesioner', 'Kuesioner')}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSavedJobs}
            className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
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

          {/* Theme Toggle (Light Mode Default & Dark Mode) */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}