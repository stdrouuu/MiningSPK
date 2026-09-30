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
    <div className="relative overflow-hidden rounded-xl border-0 p-6 sm:p-8 transition-colors bg-[#EA580C] dark:bg-[#EA580C]">
      {/* decorative soft glows (flat, no gradient) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-16 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-emerald-900/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <p className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
            Sistem pendukung keputusan • SMARTER & ROC
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
            Halo {studentPrefs.name.split(' ')[0]}, ini part-time paling cocok untukmu
          </h1>
          <p className="text-sm text-white/85 leading-relaxed max-w-[65ch]">
            <strong className="text-white">{totalJobs} lowongan part-time</strong> terverifikasi
            di Jabodetabek, diurutkan real-time dari upah, jarak, jam kuliah, dan skill kamu.
          </p>
        </div>

        {/* Current Preference Badges & Action */}
        <div className="flex flex-col sm:items-end gap-3 shrink-0">
          <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end text-xs">
            <Badge variant="outline" className="bg-white/15 border-white/25 text-white backdrop-blur-sm">
              Lokasi: {studentPrefs.location}
            </Badge>
            <Badge variant="outline" className="bg-white/15 border-white/25 text-white backdrop-blur-sm">
              Target: Rp {studentPrefs.minSalary.toLocaleString('id-ID')}/jam
            </Badge>
            <Badge variant="outline" className="bg-white/15 border-white/25 text-white backdrop-blur-sm">
              Max: {studentPrefs.maxHours} jam/mgg
            </Badge>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={onOpenPreferences}
            className="text-xs gap-2 font-semibold bg-white text-blue-700 hover:bg-white/90 border-0 shadow-md"
            aria-label="Sesuaikan preferensi dan prioritas SPK"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            Sesuaikan preferensi & prioritas
          </Button>
        </div>
      </div>
    </div>
  )
}
