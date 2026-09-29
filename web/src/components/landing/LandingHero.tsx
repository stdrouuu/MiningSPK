import { ArrowRight } from 'lucide-react'
import { Button } from '../ui/Button'
import { Reveal } from './Reveal'

interface LandingHeroProps {
  onEnterPortal: () => void
  onShowMethod: () => void
}

// Split hero: left copy, right asset. Max 4 text elements.
// Eyebrow 1 of max 2 on page. Headline 6 words, subtext 12 words.
export function LandingHero({ onEnterPortal, onShowMethod }: LandingHeroProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-16 pb-12 sm:px-6 md:pt-20 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold tracking-tighter leading-none text-zinc-900 md:text-5xl lg:text-6xl dark:text-zinc-50">
              Part-time yang pas dengan jadwal kuliah
            </h1>
            <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Upmatch mengurutkan 221 lowongan terverifikasi berdasarkan upah, lokasi, jam, dan keahlian kamu.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="default" size="md" onClick={onEnterPortal} className="gap-2 whitespace-nowrap">
                Lihat lowongan
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Button>
              <Button variant="outline" size="md" onClick={onShowMethod} className="whitespace-nowrap">
                Cara kerja
              </Button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <img
              src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=880&h=980&q=80"
              alt="Mahasiswa bekerja part-time di kafe kampus"
              width={880}
              height={980}
              loading="eager"
              className="aspect-[9/10] w-full object-cover"
            />
            {/* Real UI Overlay Badge: Contextual product card floating */}
            <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-zinc-200/90 bg-white/95 p-3.5 shadow-lg backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-900/95 sm:bottom-6 sm:left-6 sm:right-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
                  Barista & Kasir Shift Sore
                </span>
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  94% Match
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>15 jam/mgg • Grogol (1.2 km)</span>
                <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">Rp 38.000/jam</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
