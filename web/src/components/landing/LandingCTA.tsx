import { ArrowRight } from 'lucide-react'
import { Button } from '../ui/Button'
import { Reveal } from './Reveal'

interface LandingCTAProps {
  onEnterPortal: () => void
}

// Single CTA intent reused from hero: Lihat lowongan.
// Footer minimal, no version string, no locale strip, single theme.
export function LandingCTA({ onEnterPortal }: LandingCTAProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8" aria-label="Mulai">
      <Reveal>
        <div className="rounded-xl bg-zinc-950 px-6 py-12 text-center sm:px-12 dark:bg-zinc-900 dark:border dark:border-zinc-800">
          <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tight text-zinc-50 md:text-4xl">
            Lihat peringkatmu untuk minggu ini
          </h2>
          <p className="mx-auto mt-3 max-w-[52ch] text-sm leading-relaxed text-zinc-400">
            Masukkan preferensi sekali. Upmatch menyusun ulang 221 lowongan setiap ada perubahan.
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              variant="secondary"
              size="md"
              onClick={onEnterPortal}
              className="gap-2 whitespace-nowrap bg-zinc-50 text-zinc-900 hover:bg-white"
            >
              Lihat lowongan
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </Reveal>

      <footer className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-zinc-200 pt-6 text-xs text-zinc-500 sm:flex-row dark:border-zinc-800">
        <p>Upmatch 2026, sistem rekomendasi part-time mahasiswa UKRIDA</p>
        <div className="flex items-center gap-4">
          <span>221 lowongan</span>
          <span>52 mahasiswa</span>
          <button onClick={onEnterPortal} className="cursor-pointer font-medium text-zinc-700 underline dark:text-zinc-300">
            Buka portal
          </button>
        </div>
      </footer>
    </section>
  )
}
