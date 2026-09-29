import { Reveal } from './Reveal'

// Second and last eyebrow on page. Quotes max 3 lines, typographic quotes,
// attribution name plus role, no em dash.
const QUOTES = [
  {
    text: '\u201CJadwal 15 jam saya aman. Sistem menolak pekerjaan berat sebelum saya sempat tergoda.\u201D',
    name: 'Nadia Prameswari',
    role: 'Mahasiswa Psikologi, asisten les privat',
  },
  {
    text: '\u201CSaya naikkan bobot lokasi di minggu UTS. Peringkat berubah mengikuti prioritas baru.\u201D',
    name: 'Rizky Firmansyah',
    role: 'Mahasiswa Informatika, staf kopi shift sore',
  },
]

export function Testimonials() {
  return (
    <section className="border-y border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/30" aria-label="Testimoni">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-[65ch]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
              Cerita pengguna
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
              Dipilih karena menjaga kuliah
            </h2>
          </div>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {QUOTES.map((q, i) => (
            <Reveal key={q.name} delay={i * 80}>
              <figure className="h-full rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <blockquote className="text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
                  {q.text}
                </blockquote>
                <figcaption className="mt-4">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{q.name}</p>
                  <p className="text-xs text-zinc-500">{q.role}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
