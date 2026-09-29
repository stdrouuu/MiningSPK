import { Reveal } from './Reveal'

// Logo wall lives UNDER hero, logo only, no category labels.
// Simple geometric monograms for campus job categories, not plain text wordmarks.
const MARKS = [
  { letter: 'E', label: 'Education and Tutoring' },
  { letter: 'F', label: 'Food and Beverage' },
  { letter: 'R', label: 'Retail and Sales' },
  { letter: 'D', label: 'Design and Creative' },
  { letter: 'T', label: 'Technology Support' },
  { letter: 'H', label: 'Hospitality' },
]

export function LogoWall() {
  return (
    <section className="border-y border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/30" aria-label="Kategori pekerjaan">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Dipakai untuk 6 kategori part-time yang sering diambil mahasiswa
          </p>
          <div className="mt-6 grid grid-cols-3 items-center justify-items-center gap-6 sm:grid-cols-6">
            {MARKS.map((m) => (
              <div
                key={m.label}
                role="img"
                aria-label={m.label}
                title={m.label}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-base font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                {m.letter}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
