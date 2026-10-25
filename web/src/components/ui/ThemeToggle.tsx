import { useTheme } from '../../lib/theme'
import { RiSunLine, RiMoonLine } from 'react-icons/ri'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="group"
      aria-label="Pilih Tema Tampilan (Light / Dark Mode)"
      className={`inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 p-0.5 text-xs font-medium transition-colors ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-150 cursor-pointer ${
          theme === 'light'
            ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200/80'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="Mode Terang (Light Mode - Default)"
      >
        <RiSunLine className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-150 cursor-pointer ${
          theme === 'dark'
            ? 'bg-slate-800 text-blue-400 font-semibold shadow-2xs border border-slate-700/80'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="Mode Gelap (Dark Mode)"
      >
        <RiMoonLine className="w-3.5 h-3.5 text-indigo-400 dark:text-blue-400 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">Dark</span>
      </button>
    </div>
  )
}
