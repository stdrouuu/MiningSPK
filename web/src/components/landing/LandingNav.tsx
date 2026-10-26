import { useEffect, useRef, useState } from 'react'
import { navButtonClass, navIndicatorClass } from '../../lib/navStyle'
import { ThemeToggle } from '../ui/ThemeToggle'
import { avatarForPrefs } from '../../lib/avatar'
import type { StudentPreferences } from '../../types/portal'

type NavView = 'landing' | 'portal' | 'matrix' | 'kuesioner'

interface LandingNavProps {
  mode: 'user' | 'data'
  active: NavView
  savedCount: number
  onNavigate: (view: NavView) => void
  onOpenSavedJobs: () => void
  studentPrefs: StudentPreferences
  onOpenPreferences: () => void
}

export function LandingNav({
  mode,
  active,
  savedCount,
  onNavigate,
  onOpenSavedJobs,
  studentPrefs,
  onOpenPreferences,
}: LandingNavProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const navIndicator = navIndicatorClass()

  useEffect(() => {
    if (!showProfileMenu) return
    const onPointer = (e: PointerEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [showProfileMenu])

  const headerAvatar = avatarForPrefs(studentPrefs)
  const isProfileEmpty = mode === 'user' && !studentPrefs.name.trim()

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

          {/* User Profile Dropdown Button */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
              className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-left cursor-pointer"
            >
              <img
                src={headerAvatar}
                alt={studentPrefs.name}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 object-cover shrink-0"
              />
              <div className="hidden sm:block text-sm leading-tight">
                <div className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[140px]">
                  {studentPrefs.name.trim() || 'User baru'}
                </div>
              </div>
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProfileMenu && (
              <div
                role="menu"
                aria-label="Profil mahasiswa"
                className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 p-4"
              >
                <div className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <img
                    src={headerAvatar}
                    alt={studentPrefs.name}
                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                      {studentPrefs.name.trim() || 'User baru'}
                    </div>
                    <div className="text-[11px] text-[#0C52EE] font-medium mt-0.5">
                      {studentPrefs.nim.trim() ? `NIM: ${studentPrefs.nim}` : 'Belum isi kuesioner'}
                    </div>
                  </div>
                </div>

                <div className="py-3 space-y-2 text-sm text-slate-600 dark:text-slate-300 font-light">
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-400">Target gaji:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      Rp {studentPrefs.minSalary.toLocaleString('id-ID')}/jam
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-400">Lokasi:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{studentPrefs.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-400">Maks. jam:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {studentPrefs.maxHours} jam/mgg
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    if (isProfileEmpty) onNavigate('kuesioner')
                    else onOpenPreferences()
                  }}
                  className="w-full mt-1 bg-[#0C52EE] hover:bg-[#0942c4] text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors text-center cursor-pointer"
                >
                  {isProfileEmpty ? 'Mulai kuesioner' : 'Ubah preferensi saya'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}