import { useEffect, useState } from 'react'
import type { StudentPreferences } from '../types/portal'
import { avatarForPrefs } from '../lib/avatar'

interface PortalStickyNavProps {
  studentPrefs: StudentPreferences
  onOpenPreferences: () => void
  isProfileEmpty?: boolean
  onFillQuestionnaire?: () => void
  savedJobsCount?: number
  onOpenSavedJobs?: () => void
}

/**
 * Navbar sticky yang meluncur halus dari atas saat feed di-scroll melewati hero banner.
 * Berisi nama pengguna dan pill preferensi yang sudah diisi, persis seperti screenshot pengguna.
 */
export function PortalStickyNav({
  studentPrefs,
  onOpenPreferences,
  isProfileEmpty = false,
  onFillQuestionnaire,
  savedJobsCount = 0,
  onOpenSavedJobs,
}: PortalStickyNavProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Muncul saat pengguna scroll ke bawah melewati hero banner (~200px)
      setIsVisible(window.scrollY > 200)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const firstName = (studentPrefs.name || '').trim().split(' ')[0] || 'kamu'

  return (
    <div
      aria-hidden={!isVisible}
      className={`fixed top-0 left-0 right-0 z-40 w-full bg-[#0C52EE] dark:bg-slate-900/95 dark:backdrop-blur-md shadow-md border-b border-blue-600/40 dark:border-slate-800 transition-all duration-300 ease-out transform ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4 overflow-hidden">
        {/* Sisi Kiri: Sapaan nama + avatar */}
        <div className="relative z-10 flex items-center gap-2 text-white min-w-0 shrink-0">
          <span className="text-sm sm:text-base font-medium tracking-tight whitespace-nowrap flex items-center gap-1.5">
            <span>Halo</span>
            <span className="italic underline underline-offset-4 font-semibold">
              {firstName}
            </span>
            <img
              src={avatarForPrefs(studentPrefs)}
              alt=""
              aria-hidden="true"
              loading="lazy"
              draggable={false}
              className="w-6 h-6 rounded-full object-cover shrink-0 select-none inline-block ml-0.5"
            />
          </span>
        </div>

        {/* Sisi Kanan: Pill preferensi yang sudah diisi & Tombol Bookmark */}
        <div className="relative z-10 flex items-center gap-2 shrink-0">
          {isProfileEmpty ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onFillQuestionnaire}
                className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-blue-600 text-slate-900 dark:text-white font-medium hover:bg-blue-50 dark:hover:bg-blue-500 transition-colors cursor-pointer text-xs sm:text-sm shadow-2xs whitespace-nowrap"
              >
                Mulai kuesioner
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 text-xs sm:text-sm">
                <span className="px-3.5 py-1.5 rounded-xl bg-white/20 dark:bg-slate-800/80 border border-white/10 dark:border-slate-700/60 text-white font-medium shadow-2xs whitespace-nowrap backdrop-blur-xs">
                  Lokasi: {studentPrefs.location}
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-white/20 dark:bg-slate-800/80 border border-white/10 dark:border-slate-700/60 text-white font-medium shadow-2xs whitespace-nowrap backdrop-blur-xs">
                  Target: Rp {studentPrefs.minSalary.toLocaleString('id-ID')}/jam
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-white/20 dark:bg-slate-800/80 border border-white/10 dark:border-slate-700/60 text-white font-medium shadow-2xs backdrop-blur-xs">
                  Max: {studentPrefs.maxHours} jam/mgg
                </span>
              </div>
              <button
                onClick={onOpenPreferences}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-xs sm:text-sm shadow-2xs whitespace-nowrap dark:border dark:border-slate-700"
              >
                <svg className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                </svg>
                <span>Sesuaikan preferensi</span>
              </button>
            </div>
          )}

          {/* Bookmark Button */}
          {onOpenSavedJobs && (
            <button
              onClick={onOpenSavedJobs}
              className="relative p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center cursor-pointer shadow-2xs dark:border dark:border-slate-700 shrink-0"
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
          )}
        </div>

        {/* Aksen Polygon Geometris lembut di pojok kanan belakang */}
        <div
          className="hidden md:block absolute right-0 top-0 bottom-0 w-64 pointer-events-none overflow-hidden opacity-25"
          aria-hidden="true"
        >
          <svg className="absolute right-0 top-0 h-full w-full" viewBox="0 0 380 180" preserveAspectRatio="none" fill="none">
            <polygon points="130,0 185,0 95,180 40,180" fill="#072e8a" />
            <polygon points="185,0 235,0 145,180 95,180" fill="#0942c4" />
            <polygon points="295,0 380,0 290,180 205,180" fill="#FFFFFF" />
            <polygon points="225,40 285,40 245,150 185,150" fill="#ED1E79" fillOpacity="0.9" />
          </svg>
        </div>
      </div>
    </div>
  )
}
