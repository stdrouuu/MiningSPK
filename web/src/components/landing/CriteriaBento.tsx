import { MapPin, Coins, Clock, Shapes } from 'lucide-react'
import { Reveal } from './Reveal'

// Bento with exactly 5 cells for 5 SPK criteria.
// Layout: md 6-col, cell spans 4+2 then 2+2+2. Visual variation in 3 cells.
// No eyebrow here to respect restraint. Vertical stack header, no split header.
export function CriteriaBento() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8" aria-label="Kriteria penilaian">
      <Reveal>
        <div className="max-w-[65ch]">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
            Lima hal yang menentukan peringkat
          </h2>
          <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Setiap lowongan dinilai dengan bobot ROC yang bisa kamu atur ulang sesuai prioritas semester ini.
          </p>
        </div>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-6">
        <Reveal className="md:col-span-4">
          <div className="h-full overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <img
              src="https://picsum.photos/seed/upmatch-tutor-session/900/520"
              alt="Sesi les privat mahasiswa dengan siswa"
              width={900}
              height={520}
              loading="lazy"
              className="h-44 w-full object-cover"
            />
            <div className="p-5">
              <div className="flex items-center gap-2">
                <Shapes className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Kategori yang sesuai minat</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Tutor, barista, atau admin. Sistem menaikkan pekerjaan yang sejalur dengan pilihanmu.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80} className="md:col-span-2">
          <div className="h-full rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800/50 dark:bg-emerald-950/30">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-emerald-700 dark:text-emerald-300" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Upah per jam</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              Dibandingkan dengan targetmu. Tawaran di bawah target turun peringkat otomatis.
            </p>
            <p className="mt-4 font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-50">Rp 35rb</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">contoh target minimal mahasiswa</p>
          </div>
        </Reveal>

        <Reveal className="md:col-span-2">
          <div className="h-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Lokasi dan moda</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Remote dinilai fleksibel. Onsite dekat domisili dinilai lebih tinggi.
            </p>
          </div>
        </Reveal>

        <Reveal delay={80} className="md:col-span-2">
          <div className="h-full rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Beban jam mingguan</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Pekerjaan di atas 30 jam disaring keluar agar kuliah tetap aman.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120} className="md:col-span-2">
          <div className="h-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 dark:border-zinc-700">
            <img
              src="https://picsum.photos/seed/upmatch-skill-match/600/300"
              alt="Mahasiswa menyiapkan minuman di bar kopi"
              width={600}
              height={300}
              loading="lazy"
              className="h-28 w-full object-cover opacity-90"
            />
            <div className="p-5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-50">Kecocokan keahlian</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Dihitung dari irisan kata kunci skill dengan deskripsi lowongan.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
