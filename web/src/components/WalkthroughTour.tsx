import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../lib/routes'

type TourRouteKey = 'landing' | 'portal' | 'matrix' | 'kuesioner'

interface TourStep {
  id: string
  route: TourRouteKey
  section: string
  selector: string
  fallbackSelector?: string
  title: string
  description: string
}

const TOUR_STEPS: TourStep[] = [
  // ─── 1. HEADER & NAVIGASI GLOBAL ────────────────────────────────────────────
  {
    id: 'header-nav',
    route: 'landing',
    section: 'Navigasi',
    selector: '[data-tour="header-nav"]',
    fallbackSelector: '[data-tour="header-brand"]',
    title: 'Menu Navigasi Utama',
    description:
      'Buka halaman Beranda, Portal Lowongan, Tabel Perhitungan SPK (SMARTER & ROC), dan Kuesioner Rekomendasi melalui menu navigasi di sini.',
  },
  {
    id: 'header-saved',
    route: 'landing',
    section: 'Navigasi',
    selector: '[data-tour="header-saved"]',
    title: 'Lowongan Tersimpan (Bookmark)',
    description:
      'Simpan lowongan yang menarik perhatianmu. Klik ikon pita ini kapan saja untuk membuka daftar lowongan favorit yang sudah kamu tandai.',
  },
  {
    id: 'header-tools',
    route: 'landing',
    section: 'Navigasi',
    selector: '[data-tour="header-tools"]',
    title: 'Mode Tema & Tombol Panduan (?)',
    description:
      'Ubah tampilan website antara Mode Terang dan Mode Gelap, atau klik ikon "?" di sebelahnya kapan pun kamu ingin membuka kembali panduan tutorial ini.',
  },
  {
    id: 'header-profile',
    route: 'landing',
    section: 'Navigasi',
    selector: '[data-tour="header-profile"]',
    title: 'Profil & Ringkasan Mahasiswa',
    description:
      'Menampilkan nama profilmu (yang otomatis terhubung dari pengisian Kuesioner), avatar personal, serta ringkasan target gaji, lokasi, dan jam kerja mingguan.',
  },

  // ─── 2. HALAMAN BERANDA ─────────────────────────────────────────────────────
  {
    id: 'landing-hero',
    route: 'landing',
    section: 'Beranda',
    selector: '[data-tour="landing-hero"]',
    title: 'Selamat Datang di upmatch',
    description:
      'Platform pencari kerja part-time mahasiswa yang mengurutkan 221 lowongan terverifikasi secara objektif menggunakan metode SMARTER & pembobotan ROC. Klik "Lihat Lowongan Sekarang" untuk mulai.',
  },
  {
    id: 'landing-categories',
    route: 'landing',
    section: 'Beranda',
    selector: '[data-tour="landing-categories"]',
    title: 'Eksplorasi Kategori Bidang',
    description:
      'Geser kartu untuk melihat 10 kategori bidang pekerjaan (Tutor, F&B, Design, IT, dll.). Klik salah satu kartu untuk langsung memfilter lowongan pada bidang tersebut.',
  },
  {
    id: 'landing-featured',
    route: 'landing',
    section: 'Beranda',
    selector: '[data-tour="landing-featured"]',
    title: 'Lowongan Terbaru Pilihan',
    description:
      'Cuplikan lowongan part-time lengkap dengan informasi upah per jam, beban jam kerja per minggu, dan moda kerja (Remote, Hybrid, atau Onsite). Klik kartu untuk melihat detailnya.',
  },
  {
    id: 'landing-stats',
    route: 'landing',
    section: 'Beranda',
    selector: '[data-tour="landing-stats"]',
    title: 'Transparansi Data & Sumber Resmi',
    description:
      'Menampilkan statistik 200+ loker terverifikasi dari 4 portal karir terpercaya (Glints, Loker.id, KitaLulus, Kalibrr) yang dihitung dengan 5 kriteria SPK dan 100% transparansi ROC.',
  },
  {
    id: 'landing-cta',
    route: 'landing',
    section: 'Beranda',
    selector: '[data-tour="landing-cta"]',
    title: 'Pintasan Menuju Portal',
    description:
      'Siap mencari pekerjaan yang pas dengan jadwal kuliahmu? Klik tombol di banner ini untuk langsung menuju halaman eksplorasi seluruh lowongan.',
  },

  // ─── 3. HALAMAN PORTAL LOWONGAN ─────────────────────────────────────────────
  {
    id: 'portal-hero',
    route: 'portal',
    section: 'Lowongan',
    selector: '[data-tour="portal-hero"]',
    title: 'Banner Sapaan & Filter Preferensi',
    description:
      'Menyapa nama profilmu secara personal serta menampilkan ringkasan Lokasi, Target Upah/Jam, dan Maks Jam/Minggu. Klik "Sesuaikan preferensi" atau "Mulai kuesioner" untuk mengatur parameter SPK.',
  },
  {
    id: 'portal-filter',
    route: 'portal',
    section: 'Lowongan',
    selector: '[data-tour="portal-filter"]',
    title: 'Pencarian, Filter & Urutan',
    description:
      'Cari nama posisi, perusahaan, atau skill tertentu; saring berdasarkan Kategori Bidang dan Moda Kerja; serta urutkan daftar berdasarkan Kecocokan SPK, Upah Tertinggi, atau Jam Tersedikit.',
  },
  {
    id: 'portal-job-list',
    route: 'portal',
    section: 'Lowongan',
    selector: '[data-tour="portal-job-list"]',
    title: 'Daftar Lowongan Terurut SPK',
    description:
      'Daftar lowongan di sisi kiri diurutkan otomatis berdasarkan skor kecocokan tertinggi dengan profilmu. Klik kartu untuk melihat rinciannya, atau klik ikon pita untuk menyimpan lowongan.',
  },
  {
    id: 'portal-job-detail',
    route: 'portal',
    section: 'Lowongan',
    selector: '[data-tour="portal-job-detail"]',
    title: 'Detail Lowongan & Skor Kriteria C1–C5',
    description:
      'Panel kanan menampilkan deskripsi pekerjaan, keahlian yang dibutuhkan, tombol lamar asli, serta rincian nilai utilitas 5 kriteria SPK (C1 Bidang, C2 Gaji, C3 Lokasi, C4 Jam Kerja, C5 Skill Cosine).',
  },

  // ─── 4. HALAMAN PERHITUNGAN SPK ─────────────────────────────────────────────
  {
    id: 'matrix-header',
    route: 'matrix',
    section: 'Perhitungan',
    selector: '[data-tour="matrix-header"]',
    title: 'Pusat Komputasi & Ekspor CSV',
    description:
      'Halaman ini menampilkan transparansi perhitungan matematis SPK untuk profilmu. Kamu dapat mengubah prioritas ROC secara langsung atau mengunduh tabel lengkap 221 lowongan dalam format CSV.',
  },
  {
    id: 'matrix-content',
    route: 'matrix',
    section: 'Perhitungan',
    selector: '[data-tour="matrix-content"]',
    title: 'Tabel Matriks Keputusan (3 Mode)',
    description:
      'Beralih antara Mode 1 (Peringkat & Skor Akhir U(Ai)), Mode 2 (Nilai Normalisasi Utilitas u1–u5), dan Mode 3 (Matriks Awal Xij sebelum normalisasi). Klik baris tabel untuk membuka detail lowongan.',
  },

  // ─── 5. HALAMAN KUESIONER ───────────────────────────────────────────────────
  {
    id: 'kuesioner-stepper',
    route: 'kuesioner',
    section: 'Kuesioner',
    selector: '[data-tour="kuesioner-stepper"]',
    title: 'Tahapan Kuesioner 3 Langkah',
    description:
      'Alur pengisian terbagi menjadi 3 tahap: (1) Profil untuk data diri & preferensi dasar, (2) Prioritas untuk mengurutkan 5 kriteria SPK, dan (3) Hasil untuk melihat Top 3 rekomendasi & Analisis Sensitivitas.',
  },
  {
    id: 'kuesioner-content',
    route: 'kuesioner',
    section: 'Kuesioner',
    selector: '[data-tour="kuesioner-content"]',
    title: 'Pengisian Profil & Korelasi Nama',
    description:
      'Jawab pertanyaan kuesioner satu per satu di area ini. Nama yang kamu masukkan pada pertanyaan pertama akan langsung tersimpan dan menggantikan label "User baru" di seluruh halaman website!',
  },
]

interface WalkthroughContextValue {
  isOpen: boolean
  startTour: () => void
  stopTour: () => void
}

const WalkthroughContext = createContext<WalkthroughContextValue>({
  isOpen: false,
  startTour: () => {},
  stopTour: () => {},
})

function useWalkthrough() {
  return useContext(WalkthroughContext)
}

/**
 * Tombol trigger panduan berbentuk lingkaran ("?") di sebelah kanan ThemeToggle.
 */
export function GuideTriggerButton() {
  const { startTour } = useWalkthrough()

  return (
    <button
      type="button"
      onClick={startTour}
      data-tour="guide-trigger"
      className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#0C52EE] dark:hover:border-blue-400 hover:bg-blue-50/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#0C52EE] dark:hover:text-blue-400 transition-all flex items-center justify-center cursor-pointer shadow-2xs shrink-0 font-semibold text-sm select-none"
      title="Panduan Penggunaan Website"
      aria-label="Buka panduan penggunaan website"
    >
      ?
    </button>
  )
}

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

function resolveRoutePath(routeKey: TourRouteKey, isDataMode: boolean): string {
  if (routeKey === 'landing') return isDataMode ? ROUTES.DATA : ROUTES.LANDING
  if (routeKey === 'portal') return isDataMode ? ROUTES.DATA_PORTAL : ROUTES.PORTAL
  if (routeKey === 'matrix') return isDataMode ? ROUTES.DATA_MATRIX : ROUTES.MATRIX
  return ROUTES.KUESIONER
}

function currentRouteKey(pathname: string): TourRouteKey {
  if (pathname === ROUTES.PORTAL || pathname === ROUTES.DATA_PORTAL) return 'portal'
  if (pathname === ROUTES.MATRIX || pathname === ROUTES.DATA_MATRIX) return 'matrix'
  if (pathname === ROUTES.KUESIONER) return 'kuesioner'
  return 'landing'
}

export function WalkthroughProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  })

  const location = useLocation()
  const navigate = useNavigate()
  const isDataMode =
    location.pathname === ROUTES.DATA || location.pathname.startsWith('/data/')

  const startTour = useCallback(() => {
    const activeKey = currentRouteKey(location.pathname)
    // Jika user menekan "?" di halaman selain Beranda, mulai langsung dari
    // langkah pertama halaman tersebut (untuk Beranda mulai dari step 0: Header + Beranda).
    if (activeKey === 'landing') {
      setStepIndex(0)
    } else {
      const idx = TOUR_STEPS.findIndex((s) => s.route === activeKey)
      setStepIndex(idx >= 0 ? idx : 0)
    }
    setIsOpen(true)
  }, [location.pathname])

  const stopTour = useCallback(() => {
    setIsOpen(false)
  }, [])

  const step = TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0]

  // Sinkronisasi URL halaman ketika step berpindah lintas halaman
  useEffect(() => {
    if (!isOpen || !step) return
    const activeKey = currentRouteKey(location.pathname)
    // Langkah 0..3 adalah elemen Header yang ada di semua halaman, namun agar
    // konsisten jika berada di step beranda/portal/matrix/kuesioner kita pastikan rutenya sesuai
    if (step.id.startsWith('header-')) {
      return
    }
    if (activeKey !== step.route) {
      navigate(resolveRoutePath(step.route, isDataMode))
    }
  }, [isOpen, step, location.pathname, isDataMode, navigate])

  // Temukan elemen target, scroll ke layar, dan hitung koordinat spotlight
  const updatePosition = useCallback(
    (shouldScroll = false) => {
      if (!isOpen || !step) return

      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })

      let el = document.querySelector(step.selector) as HTMLElement | null
      if ((!el || el.getBoundingClientRect().width === 0) && step.fallbackSelector) {
        el = document.querySelector(step.fallbackSelector) as HTMLElement | null
      }

      if (!el) {
        setSpotlight(null)
        return
      }

      const rawRect = el.getBoundingClientRect()
      if (rawRect.width === 0 || rawRect.height === 0) {
        setSpotlight(null)
        return
      }

      if (shouldScroll) {
        const isHeaderEl = step.id.startsWith('header-')
        if (isHeaderEl) {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          const absoluteTop = window.scrollY + rawRect.top
          const targetScrollY = Math.max(0, absoluteTop - 110)
          const OutOfView =
            rawRect.top < 70 ||
            rawRect.top > window.innerHeight - 220
          if (OutOfView) {
            window.scrollTo({ top: targetScrollY, behavior: 'smooth' })
          }
        }
      }

      // Hitung ulang setelah potensial scroll
      const rect = el.getBoundingClientRect()
      const pad = 8
      const maxSpotHeight = Math.max(160, window.innerHeight - 250)
      const clampedHeight = Math.min(rect.height, maxSpotHeight)

      const top = Math.max(6, rect.top - pad)
      const left = Math.max(6, rect.left - pad)
      const width = Math.min(window.innerWidth - left - 6, rect.width + pad * 2)
      const height = clampedHeight + pad * 2

      setSpotlight({ top, left, width, height })
    },
    [isOpen, step]
  )

  // Saat step berubah atau halaman baru selesai dirender, scroll & ukur posisi
  useEffect(() => {
    if (!isOpen) return
    // Panggil bertahap agar saat pindah route DOM sempat ter-mount & scroll selesai
    const t0 = window.setTimeout(() => updatePosition(true), 40)
    const t1 = window.setTimeout(() => updatePosition(false), 260)
    const t2 = window.setTimeout(() => updatePosition(false), 520)
    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [isOpen, stepIndex, location.pathname, updatePosition])

  // Update posisi saat pengguna scroll atau resize jendela
  useEffect(() => {
    if (!isOpen) return
    const onScrollOrResize = () => updatePosition(false)
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [isOpen, updatePosition])

  // Navigasi keyboard (Escape, ArrowRight, ArrowLeft)
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopTour()
      } else if (e.key === 'ArrowRight') {
        setStepIndex((i) => (i < TOUR_STEPS.length - 1 ? i + 1 : i))
      } else if (e.key === 'ArrowLeft') {
        setStepIndex((i) => (i > 0 ? i - 1 : i))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, stopTour])

  // Hitung posisi kartu popover dan panah penunjuk (seperti gambar referensi)
  const popoverLayout = useMemo(() => {
    const cardWidth = Math.min(380, viewport.width - 24)
    if (!spotlight) {
      return {
        cardWidth,
        left: Math.max(12, (viewport.width - cardWidth) / 2),
        top: Math.max(80, viewport.height / 2 - 110),
        placement: 'center' as const,
        arrowLeft: cardWidth / 2,
      }
    }

    const targetCenterX = spotlight.left + spotlight.width / 2
    const left = Math.min(
      Math.max(12, targetCenterX - cardWidth / 2),
      viewport.width - cardWidth - 12
    )
    const arrowLeft = Math.min(
      Math.max(28, targetCenterX - left),
      cardWidth - 28
    )

    const spaceBelow = viewport.height - (spotlight.top + spotlight.height)
    const spaceAbove = spotlight.top
    const estimatedCardHeight = 225

    if (spaceBelow >= estimatedCardHeight || spaceBelow >= spaceAbove) {
      const top = Math.min(
        viewport.height - estimatedCardHeight - 12,
        Math.max(12, spotlight.top + spotlight.height + 14)
      )
      return {
        cardWidth,
        left,
        top,
        placement: 'bottom' as const,
        arrowLeft,
      }
    } else {
      const top = Math.max(12, spotlight.top - estimatedCardHeight - 14)
      return {
        cardWidth,
        left,
        top,
        placement: 'top' as const,
        arrowLeft,
      }
    }
  }, [spotlight, viewport])

  const sections = useMemo(() => {
    const seen = new Map<string, number>()
    TOUR_STEPS.forEach((s, idx) => {
      if (!seen.has(s.section)) seen.set(s.section, idx)
    })
    return Array.from(seen.entries())
  }, [])

  const ctxValue = useMemo(
    () => ({ isOpen, startTour, stopTour }),
    [isOpen, startTour, stopTour]
  )

  return (
    <WalkthroughContext.Provider value={ctxValue}>
      {children}

      {isOpen && step && (
        <div
          className="fixed inset-0 z-[95]"
          role="dialog"
          aria-modal="true"
          aria-label={`Panduan website: ${step.title}`}
        >
          {/* SVG Backdrop dengan lubang Spotlight (Cutout) */}
          <svg
            className="fixed inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <mask id="upmatch-tour-spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {spotlight && (
                  <rect
                    x={spotlight.left}
                    y={spotlight.top}
                    width={spotlight.width}
                    height={spotlight.height}
                    rx={16}
                    ry={16}
                    fill="black"
                    className="transition-all duration-300 ease-out"
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(15, 23, 42, 0.68)"
              mask="url(#upmatch-tour-spotlight-mask)"
            />
          </svg>

          {/* Klik area gelap untuk melewati/menutup panduan */}
          <div
            className="fixed inset-0"
            onClick={stopTour}
            aria-hidden="true"
          />

          {/* Bingkai Highlight di sekeliling elemen aktif */}
          {spotlight && (
            <div
              style={{
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
              }}
              className="fixed rounded-2xl ring-2 ring-white dark:ring-blue-400 shadow-[0_0_0_4px_rgba(12,82,238,0.35)] pointer-events-none transition-all duration-300 ease-out z-[96]"
            />
          )}

          {/* Kartu Popover Panduan (Gaya Coachmark seperti referensi gambar) */}
          <div
            style={{
              width: popoverLayout.cardWidth,
              left: popoverLayout.left,
              top: popoverLayout.top,
            }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[97] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-5 transition-all duration-300 ease-out"
          >
            {/* Segitiga Panah Penunjuk ke Elemen */}
            {popoverLayout.placement === 'bottom' && (
              <div
                style={{ left: popoverLayout.arrowLeft - 8 }}
                className="absolute -top-2 w-4 h-4 bg-white dark:bg-slate-900 border-l border-t border-slate-100 dark:border-slate-800 rotate-45 pointer-events-none"
                aria-hidden="true"
              />
            )}
            {popoverLayout.placement === 'top' && (
              <div
                style={{ left: popoverLayout.arrowLeft - 8 }}
                className="absolute -bottom-2 w-4 h-4 bg-white dark:bg-slate-900 border-r border-b border-slate-100 dark:border-slate-800 rotate-45 pointer-events-none"
                aria-hidden="true"
              />
            )}

            {/* Tab Pintasan Bagian Halaman */}
            <div className="flex flex-wrap items-center justify-center gap-1 mb-3">
              {sections.map(([secName, firstIdx]) => {
                const isActiveSec = step.section === secName
                return (
                  <button
                    key={secName}
                    type="button"
                    onClick={() => setStepIndex(firstIdx)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${
                      isActiveSec
                        ? 'bg-[#0C52EE]/10 dark:bg-blue-500/20 text-[#0C52EE] dark:text-blue-300 border border-[#0C52EE]/30 dark:border-blue-500/40'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {secName}
                  </button>
                )
              })}
            </div>

            {/* Judul & Penjelasan Spesifik */}
            <div className="text-center space-y-1.5 px-1">
              <h3 className="text-[15px] sm:text-base font-semibold text-[#0C52EE] dark:text-blue-400 leading-snug">
                {step.title}
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Tombol Navigasi Bawah: Lewati | Kembali | Lanjut (X dari N) */}
            <div className="flex items-center justify-between gap-2 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={stopTour}
                className="text-xs sm:text-[13px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer px-1 py-1"
              >
                Lewati
              </button>

              <div className="flex items-center gap-3">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                    className="text-xs sm:text-[13px] font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer px-2 py-1"
                  >
                    Kembali
                  </button>
                )}

                {stepIndex < TOUR_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStepIndex((i) => Math.min(TOUR_STEPS.length - 1, i + 1))}
                    className="px-4 py-2 rounded-full bg-[#0C52EE] hover:bg-[#0942c4] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-[13px] font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    Lanjut ({stepIndex + 1} dari {TOUR_STEPS.length})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopTour}
                    className="px-4 py-2 rounded-full bg-[#0C52EE] hover:bg-[#0942c4] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-[13px] font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    Selesai ({TOUR_STEPS.length} dari {TOUR_STEPS.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </WalkthroughContext.Provider>
  )
}
