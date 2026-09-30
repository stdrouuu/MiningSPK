import { RiBriefcaseLine, RiSunLine, RiMoonLine } from 'react-icons/ri'
import { Button } from '../ui/Button'

interface LandingNavProps {
  onEnterPortal: () => void
  onShowMethod: () => void
  savedCount: number
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

// Shape rule for landing: buttons 6px (rounded-md), cards 12px (rounded-xl), pills full.
// Color lock: zinc neutrals plus single emerald accent.
export function LandingNav({ onEnterPortal, onShowMethod, savedCount, theme, onToggleTheme }: LandingNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
            <RiBriefcaseLine className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            upmatch
          </span>
        </div>

        <nav className="hidden items-center gap-1 text-sm font-medium md:flex" aria-label="Navigasi utama">
          <button
            onClick={onEnterPortal}
            className="emil-press cursor-pointer rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            Lowongan
          </button>
          <button
            onClick={onShowMethod}
            className="emil-press cursor-pointer rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            Cara kerja
          </button>
          <span className="px-3 py-1.5 text-xs text-zinc-500">
            {savedCount > 0 ? `${savedCount} tersimpan` : '221 terverifikasi'}
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="h-8 w-8 text-zinc-600 dark:text-zinc-400"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <RiSunLine className="h-4 w-4 text-amber-400" />
            ) : (
              <RiMoonLine className="h-4 w-4 text-zinc-700" />
            )}
          </Button>
          <Button variant="default" size="sm" onClick={onEnterPortal} className="whitespace-nowrap">
            Lihat lowongan
          </Button>
        </div>
      </div>
    </header>
  )
}
