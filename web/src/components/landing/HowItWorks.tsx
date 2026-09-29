import { Reveal } from './Reveal'

// How it works: left sticky visual plus right stacked rows.
// Avoids 3 equal cards and zigzag repetition. Labels are verbs, no Stage or Step prefix.
const STEPS = [
  {
    verb: 'Isi preferensi',
    body: 'Tulis target upah, lokasi, batas jam, dan daftar keahlian dalam satu menit.',
  },
  {
    verb: 'Atur prioritas',
    body: 'Seret urutan lima kriteria. Bobot ROC menyesuaikan otomatis tanpa rumus manual.',
  },
  {
    verb: 'Pilih hasil',
    body: 'Buka peringkat teratas, simpan favorit, dan lamar lewat portal resmi.',
  },
]

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8" aria-label="Cara kerja">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <div className="lg:sticky lg:top-20">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
                Dari profil ke lamaran dalam tiga langkah
              </h2>
              <p className="mt-3 max-w-[52ch] text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                Tidak perlu paham SMARTER. Kamu cukup kenal jadwalmu, sistem mengurus skornya.
              </p>
              <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                <img
                  src="https://picsum.photos/seed/upmatch-student-desk/720/560"
                  alt="Meja belajar mahasiswa dengan laptop dan catatan"
                  width={720}
                  height={560}
                  loading="lazy"
                  className="w-full object-cover"
                />
              </div>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <div className="flex flex-col">
            {STEPS.map((s, i) => (
              <Reveal key={s.verb} delay={i * 60}>
                <div className="flex gap-5 border-b border-zinc-200 py-7 first:border-t dark:border-zinc-800">
                  <span className="font-mono text-3xl font-bold text-zinc-300 dark:text-zinc-700">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{s.verb}</h3>
                    <p className="mt-1 max-w-[58ch] text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {s.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
