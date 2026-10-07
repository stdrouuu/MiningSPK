import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RiMenuLine, RiCloseLine } from 'react-icons/ri'
import type { StudentPreferences } from '../types/portal'
import { ROUTES } from '../lib/routes'
import { avatarForPrefs } from '../lib/avatar'
import { navButtonClass, navIndicatorClass } from '../lib/navStyle'

interface PortalHeaderProps {
  activeView: 'jobs' | 'matrix'
  studentPrefs: StudentPreferences
  onOpenPreferences: () => void
  savedJobsCount: number
  onOpenSavedJobs: () => void
}

export function PortalHeader({
  activeView,
  studentPrefs,
  onOpenPreferences,
  savedJobsCount,
  onOpenSavedJobs,
}: PortalHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

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
        setShowMobileNav(false)
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
  const navIndicator = navIndicatorClass()

  const renderNavButton = (label: string, active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={navButtonClass(active)}
    >
      {label}
      {active && navIndicator && <span className={navIndicator} aria-hidden="true" />}
    </button>
  )

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button onClick={() => navigate(ROUTES.LANDING)} className="flex items-center group focus:outline-none text-left">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-medium tracking-tight text-slate-900">upmatch</span>
              {activeView !== 'jobs' && (
                <>
                  <span className="text-slate-300 font-light">—</span>
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">portal kerja</span>
                </>
              )}
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-2 text-xs sm:text-sm font-normal">
            {renderNavButton('Beranda', false, () => navigate(ROUTES.LANDING))}
            {renderNavButton('Lowongan', activeView === 'jobs', () => navigate(ROUTES.PORTAL))}
            {renderNavButton('Perhitungan', activeView === 'matrix', () => navigate(ROUTES.MATRIX))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSavedJobs}
            className="relative p-2 rounded-lg border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center"
            title={`Lowongan tersimpan (${savedJobsCount})`}
            aria-label={`Lowongan tersimpan (${savedJobsCount})`}
          >
            <svg className="w-4 h-4 text-[#ED1E79]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#ED1E79] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-2xs">
              {savedJobsCount}
            </span>
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
              className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors text-left"
            >
              <img
                src={headerAvatar}
                alt={studentPrefs.name}
                className="w-7 h-7 rounded-full bg-slate-100 object-cover shrink-0"
              />
              <div className="hidden sm:block text-xs leading-tight">
                <div className="font-medium text-slate-900 truncate max-w-[120px]">{studentPrefs.name}</div>
                <div className="text-[10px] text-slate-400 font-light">{studentPrefs.major}</div>
              </div>
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProfileMenu && (
              <div role="menu" aria-label="Profil mahasiswa" className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-4">
                <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                  <img
                    src={headerAvatar}
                    alt={studentPrefs.name}
                    className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-900 truncate">{studentPrefs.name}</div>
                    <div className="text-xs text-slate-500 font-light">{studentPrefs.major}</div>
                    <div className="text-[11px] text-[#0C52EE] font-medium">NIM: {studentPrefs.nim}</div>
                  </div>
                </div>

                <div className="py-3 space-y-2 text-xs text-slate-600 font-light">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target gaji:</span>
                    <span className="font-medium text-slate-900">Rp {studentPrefs.minSalary.toLocaleString('id-ID')}/jam</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lokasi:</span>
                    <span className="font-medium text-slate-900">{studentPrefs.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Maks. jam:</span>
                    <span className="font-medium text-slate-900">{studentPrefs.maxHours} jam/mgg</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    onOpenPreferences()
                  }}
                  className="w-full mt-1 bg-[#0C52EE] hover:bg-[#0942c4] text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors text-center"
                >
                  Ubah preferensi saya
                </button>
              </div>
            )}
          </div>

          <button
            className="h-8 w-8 md:hidden p-1 text-slate-600"
            onClick={() => setShowMobileNav((v) => !v)}
            aria-expanded={showMobileNav}
            aria-label={showMobileNav ? 'Tutup navigasi' : 'Buka navigasi'}
          >
            {showMobileNav ? <RiCloseLine className="h-4 w-4" /> : <RiMenuLine className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {showMobileNav && (
        <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 text-sm" aria-label="Navigasi seluler">
          <Link to={ROUTES.LANDING} className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100" onClick={() => setShowMobileNav(false)}>Beranda</Link>
          <button onClick={() => { navigate(ROUTES.PORTAL); setShowMobileNav(false) }} className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100">Lowongan</button>
          <button onClick={() => { navigate(ROUTES.MATRIX); setShowMobileNav(false) }} className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100">Perhitungan</button>
        </nav>
      )}
    </header>
  )
}
