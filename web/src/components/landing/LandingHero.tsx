import { diceBearUrl } from '../../lib/avatar'

interface LandingHeroProps {
  totalJobs: number
  onEnterPortal: () => void
}

// Lima avatar DiceBear berbeda untuk strip sosial "Untuk Mahasiswa Aktif".
const HERO_AVATARS = [
  { style: 'adventurer', seed: 'MHS-101', bg: 'b6e3f4', label: 'David Santoso' },
  { style: 'lorelei', seed: 'MHS-102', bg: 'ffd5dc', label: 'Jessica Tan' },
  { style: 'micah', seed: 'MHS-103', bg: 'c0aede', label: 'Michael Wijaya' },
  { style: 'personas', seed: 'MHS-104', bg: 'ffdfbf', label: 'Brandon Sutedja' },
  { style: 'notionists', seed: 'MHS-105', bg: 'c7f2c7', label: 'Andrew Linardi' },
]

export function LandingHero({ totalJobs, onEnterPortal }: LandingHeroProps) {
  return (
    <section className="pt-16 pb-14 px-4 sm:px-6 lg:px-8 text-center bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-normal sm:font-medium tracking-tight text-slate-900 leading-[1.25]">
          <span className="text-[#0C52EE] font-normal sm:font-medium">Part–time, Fleksibel</span> dan<br />
          <span className="text-slate-900 font-normal sm:font-medium">Jadwal Kuliah Aman</span> <span className="text-[#ED1E79] font-normal sm:font-medium">untuk Mahasiswa</span>
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-slate-500 font-light max-w-2xl mx-auto leading-relaxed pt-2">
          Upmatch mengurutkan {totalJobs} lowongan kerja terverifikasi di Jabodetabek secara objektif dengan metode SMARTER &amp; ROC agar performa akademik dan jam perkuliahanmu tetap terjaga.
        </p>

        <div className="pt-6 flex justify-center">
          <button
            onClick={onEnterPortal}
            className="inline-flex items-center gap-3 pl-2 pr-6 py-2 rounded-full bg-[#0C52EE] hover:bg-[#0942c4] text-white font-medium text-sm transition-all shadow-md group"
          >
            <span className="w-9 h-9 rounded-full bg-white text-[#0C52EE] flex items-center justify-center font-bold text-base transition-transform group-hover:rotate-45">
              {"\u2197"}
            </span>
            <span>Lihat Lowongan Sekarang</span>
            <span className="text-blue-200 ml-1">{"\u203A"}</span>
          </button>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 font-light">
          <div className="flex -space-x-2 overflow-hidden">
            {HERO_AVATARS.map((a) => (
              <img
                key={a.seed}
                src={diceBearUrl(a.style, a.seed, a.bg)}
                alt={a.label}
                title={a.label}
                loading="lazy"
                className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white object-cover"
              />
            ))}
          </div>
          <span className="text-slate-700 font-medium">Untuk Mahasiswa Aktif</span>
        </div>
      </div>
    </section>
  )
}
