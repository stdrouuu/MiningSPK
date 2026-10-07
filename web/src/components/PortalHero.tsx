import type { StudentPreferences } from '../types/portal'
import { avatarForPrefs } from '../lib/avatar'

interface PortalHeroProps {
  studentPrefs: StudentPreferences
  onOpenPreferences: () => void
  totalJobs: number
}

export function PortalHero({ studentPrefs, onOpenPreferences, totalJobs }: PortalHeroProps) {
  return (
    <section className="relative w-full rounded-2xl bg-[#0C52EE] overflow-hidden min-h-[160px] p-6 sm:p-8 lg:p-10 shadow-sm text-white flex items-center justify-between">
      <div className="relative z-10 max-w-2xl lg:max-w-3xl space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-medium tracking-tight leading-snug">
          Halo{' '}
          {/* Avatar duduk flush di baseline (vertical-align: baseline memakai bottom margin edge
              untuk elemen inline), jadi sisi bawahnya rata dengan huruf "Halo" & ", ini
              part-time". Ukurannya 0.72em ≈ cap-height, jadi sisi atasnya juga rata dengan
              tops huruf kapital. Pakai em (bukan px) supaya ikut menyesuaikan font-size
              di semua breakpoint. */}
          <span className="whitespace-nowrap">
            {studentPrefs.name.split(' ')[0]}
            <img
              src={avatarForPrefs(studentPrefs)}
              alt=""
              aria-hidden="true"
              loading="lazy"
              draggable={false}
              style={{ height: '0.72em', width: '0.72em', verticalAlign: 'baseline' }}
              className="ml-2 inline-block rounded-full object-cover shrink-0 select-none"
            />
          </span>
          , ini part–time paling cocok untukmu
        </h1>
        <p className="text-xs sm:text-sm text-blue-100 font-light leading-relaxed max-w-xl">
          {totalJobs} lowongan part-time terverifikasi di Jabodetabek, diurutkan real-time dari upah, jarak, jam kuliah, dan skill kamu.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-[#072e8a] border border-blue-400/25 font-normal text-white shadow-2xs">
            Lokasi: {studentPrefs.location}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-[#072e8a] border border-blue-400/25 font-normal text-white shadow-2xs">
            Target: Rp {studentPrefs.minSalary.toLocaleString('id-ID')}/jam
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-[#072e8a] border border-blue-400/25 font-normal text-white shadow-2xs">
            Max: {studentPrefs.maxHours} jam/mgg
          </span>
          <button onClick={onOpenPreferences} className="ml-2 font-medium underline hover:text-slate-200 transition-colors cursor-pointer">
            Sesuaikan preferensi &amp; prioritas
          </button>
        </div>
      </div>

      <div className="hidden md:block absolute right-0 top-0 bottom-0 w-80 lg:w-[380px] pointer-events-none overflow-hidden" aria-hidden="true">
        <svg className="absolute right-0 top-0 h-full w-full" viewBox="0 0 380 180" preserveAspectRatio="none" fill="none">
          <polygon points="130,0 185,0 95,180 40,180" fill="#072e8a" />
          <polygon points="185,0 235,0 145,180 95,180" fill="#0942c4" />
          <polygon points="295,0 380,0 290,180 205,180" fill="#FFFFFF" />
          <polygon points="225,40 285,40 245,150 185,150" fill="#ED1E79" fillOpacity="0.9" />
        </svg>
      </div>
    </section>
  )
}
