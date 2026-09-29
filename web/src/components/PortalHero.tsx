import { SlidersHorizontal } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import type { StudentPreferences } from '../types/portal'

interface PortalHeroProps {
  studentPrefs: StudentPreferences
  onOpenPreferences: () => void
  totalJobs: number
}

export function PortalHero({
  studentPrefs,
  onOpenPreferences,
  totalJobs,
}: PortalHeroProps) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 p-6 sm:p-8 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold">
            Decision Support System • SMARTER & ROC
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome Back, Find your ideal part-time match
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Menampilkan <strong className="text-zinc-900 dark:text-zinc-100">{totalJobs} lowongan part-time</strong> terverifikasi
            di Jabodetabek yang diurutkan secara real-time berdasarkan kesesuaian upah, jarak domisili, ketersediaan jam kuliah, dan kecocokan keahlian Anda.
          </p>
        </div>

        {/* Current Preference Badges & Action */}
        <div className="flex flex-col sm:items-end gap-3 shrink-0">
          <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end text-xs">
            <Badge variant="outline">
              Lokasi: {studentPrefs.location}
            </Badge>
            <Badge variant="outline">
              Target: Rp {studentPrefs.minSalary.toLocaleString('id-ID')}/jam
            </Badge>
            <Badge variant="outline">
              Max: {studentPrefs.maxHours} jam/mgg
            </Badge>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={onOpenPreferences}
            className="text-xs gap-2 font-medium"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Sesuaikan Preferensi & Prioritas SPK
          </Button>
        </div>
      </div>
    </div>
  )
}
