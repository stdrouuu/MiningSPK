import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Sun,
  Moon,
  Bookmark,
  SlidersHorizontal,
  TableProperties,
  Home,
  LayoutGrid,
  Menu,
  X,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import type { StudentPreferences } from '../types/portal'

interface PortalHeaderProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  activeView: 'jobs' | 'matrix'
  onChangeView: (view: 'jobs' | 'matrix') => void
  studentPrefs: StudentPreferences
  onOpenPreferences: () => void
  savedJobsCount: number
  onOpenSavedJobs: () => void
}

export function PortalHeader({
  theme,
  onToggleTheme,
  activeView,
  onChangeView,
  studentPrefs,
  onOpenPreferences,
  savedJobsCount,
  onOpenSavedJobs,
}: PortalHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close profile menu on outside click / Escape
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

  const navLink = (isActive: boolean) =>
    `emil-press px-3 py-1.5 rounded-md cursor-pointer ${
      isActive
        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold'
        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand + desktop nav */}
        <div className="flex items-center gap-6 min-w-0">
          <button
            onClick={() => onChangeView('jobs')}
            className="flex items-center gap-2.5 cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 shrink-0"
            aria-label="Upmatch — ke daftar lowongan"
          >
            <span className="h-8 w-8 rounded-md bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 flex items-center justify-center">
              <Briefcase className="h-4 w-4" strokeWidth={1.5} />
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                upmatch
              </span>
              <span className="text-[11px] font-medium text-zinc-500 hidden sm:inline">
                portal kerja
              </span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium" aria-label="Navigasi portal">
            <Link
              to="/"
              className="emil-press px-3 py-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5"
            >
              <Home className="h-3.5 w-3.5" strokeWidth={1.5} />
              Beranda
            </Link>

            <button
              onClick={() => onChangeView('jobs')}
              aria-current={activeView === 'jobs' ? 'page' : undefined}
              className={navLink(activeView === 'jobs')}
            >
              <span className="inline-flex items-center gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.5} />
                Lowongan
              </span>
            </button>

            <button onClick={onOpenPreferences} className={navLink(false)}>
              <span className="inline-flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
                Preferensi & SPK
              </span>
            </button>

            <button
              onClick={() => onChangeView('matrix')}
              aria-current={activeView === 'matrix' ? 'page' : undefined}
              className={navLink(activeView === 'matrix')}
            >
              <span className="inline-flex items-center gap-1.5">
                <TableProperties className="h-3.5 w-3.5" strokeWidth={1.5} />
                Perhitungan SPK
              </span>
            </button>
          </nav>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSavedJobs}
            className="relative text-xs gap-1.5 h-8 px-2.5"
            title="Lowongan tersimpan"
            aria-label={`Buka lowongan tersimpan, ${savedJobsCount} tersimpan`}
          >
            <Bookmark className="h-4 w-4 text-zinc-600 dark:text-zinc-400" strokeWidth={1.5} />
            <span className="hidden sm:inline">Tersimpan</span>
            {savedJobsCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">
                {savedJobsCount}
              </Badge>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="h-8 w-8 text-zinc-600 dark:text-zinc-400"
            title={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
            aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
            aria-pressed={theme === 'dark'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" strokeWidth={1.5} />
            ) : (
              <Moon className="h-4 w-4 text-zinc-700" strokeWidth={1.5} />
            )}
          </Button>

          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" aria-hidden="true" />

          {/* Student profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
              className="emil-press flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100"
            >
              <span
                className="h-7 w-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 font-bold text-xs flex items-center justify-center"
                aria-hidden="true"
              >
                {(studentPrefs.name || '?').charAt(0).toUpperCase()}
              </span>
              <span className="text-left hidden sm:block">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight block max-w-[120px] truncate">
                  {studentPrefs.name}
                </span>
                <span className="text-[10px] text-zinc-500 block">{studentPrefs.major}</span>
              </span>
            </button>

            {showProfileMenu && (
              <div
                role="menu"
                aria-label="Profil mahasiswa"
                style={{ '--transform-origin': 'top right' } as CSSProperties}
                className="emil-popover absolute right-0 mt-2 w-64 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 shadow-lg z-50"
              >
                <div className="pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {studentPrefs.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono">NIM: {studentPrefs.nim}</p>
                  <p className="text-[11px] text-zinc-500">{studentPrefs.major}</p>
                </div>
                <dl className="pt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex justify-between gap-2 py-0.5">
                    <dt>Target gaji</dt>
                    <dd className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                      Rp {studentPrefs.minSalary.toLocaleString('id-ID')}/jam
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 py-0.5">
                    <dt>Lokasi</dt>
                    <dd className="font-semibold text-zinc-900 dark:text-zinc-100 text-right">
                      {studentPrefs.location}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 py-0.5">
                    <dt>Maks. jam</dt>
                    <dd className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {studentPrefs.maxHours} jam/mgg
                    </dd>
                  </div>
                </dl>
                <div className="pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      setShowProfileMenu(false)
                      onOpenPreferences()
                    }}
                  >
                    Ubah preferensi saya
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile nav toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setShowMobileNav((v) => !v)}
            aria-expanded={showMobileNav}
            aria-label={showMobileNav ? 'Tutup navigasi' : 'Buka navigasi'}
          >
            {showMobileNav ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav panel */}
      {showMobileNav && (
        <nav
          className="emil-nav-in md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 space-y-1 text-sm"
          aria-label="Navigasi seluler"
        >
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => setShowMobileNav(false)}
          >
            <Home className="h-4 w-4" /> Beranda
          </Link>
          <button
            onClick={() => {
              onChangeView('jobs')
              setShowMobileNav(false)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <LayoutGrid className="h-4 w-4" /> Lowongan
          </button>
          <button
            onClick={() => {
              onOpenPreferences()
              setShowMobileNav(false)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <SlidersHorizontal className="h-4 w-4" /> Preferensi & SPK
          </button>
          <button
            onClick={() => {
              onChangeView('matrix')
              setShowMobileNav(false)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <TableProperties className="h-4 w-4" /> Perhitungan SPK
          </button>
        </nav>
      )}
    </header>
  )
}
