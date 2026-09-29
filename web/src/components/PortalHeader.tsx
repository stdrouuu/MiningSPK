import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Search,
  Bell,
  Sun,
  Moon,
  Bookmark,
  SlidersHorizontal,
  TableProperties,
  Home,
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
  searchQuery: string
  onSearchChange: (q: string) => void
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
  searchQuery,
  onSearchChange,
}: PortalHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => onChangeView('jobs')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="h-8 w-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 flex items-center justify-center font-bold text-sm shadow-xs">
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                upmatch
              </span>
              <span className="text-[11px] font-medium text-zinc-500 hidden sm:inline">
                job portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              to="/"
              className="px-3 py-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-1.5"
            >
              <Home className="h-3.5 w-3.5" />
              Beranda
            </Link>

            <button
              onClick={() => onChangeView('jobs')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeView === 'jobs'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              Jobs
            </button>

            <button
              onClick={onOpenPreferences}
              className="px-3 py-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Preferences & SPK
            </button>

            <button
              onClick={() => onChangeView('matrix')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeView === 'matrix'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              <TableProperties className="h-3.5 w-3.5" />
              Perhitungan SPK
            </button>
          </nav>
        </div>

        {/* Center/Search in header for medium+ screens */}
        <div className="hidden lg:flex items-center flex-1 max-w-xs relative">
          <Search className="absolute left-3 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search job title, skills..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 pl-9 pr-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
          />
        </div>

        {/* Right: Actions, Theme Toggle, Saved Jobs, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Saved Jobs Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSavedJobs}
            className="relative text-xs gap-1.5 h-8 px-2.5"
            title="Saved Jobs"
          >
            <Bookmark className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            <span className="hidden sm:inline">Saved</span>
            {savedJobsCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">
                {savedJobsCount}
              </Badge>
            )}
          </Button>

          {/* Theme Toggle Button (Light/Dark mode) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="h-8 w-8 text-zinc-600 dark:text-zinc-400"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-zinc-700" />
            )}
          </Button>

          {/* Notifications icon */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-600 dark:text-zinc-400"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>

          {/* Divider */}
          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

          {/* Student Profile Chip */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <div className="h-7 w-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 font-bold text-xs flex items-center justify-center">
                {studentPrefs.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                  {studentPrefs.name}
                </p>
                <p className="text-[10px] text-zinc-500">{studentPrefs.major}</p>
              </div>
            </button>

            {/* Profile Menu Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 shadow-lg z-50 animate-in fade-in-50 zoom-in-95">
                <div className="pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {studentPrefs.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono">NIM: {studentPrefs.nim}</p>
                  <p className="text-[11px] text-zinc-500">{studentPrefs.major}</p>
                </div>
                <div className="pt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex justify-between py-0.5">
                    <span>Target Gaji:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Rp {studentPrefs.minSalary.toLocaleString('id-ID')}/jam
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Lokasi:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {studentPrefs.location}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Max Jam:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {studentPrefs.maxHours} jam/mgg
                    </span>
                  </div>
                </div>
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
                    Edit Preferensi Saya
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
