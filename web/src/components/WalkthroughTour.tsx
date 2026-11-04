import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../lib/routes'

type TourSectionKey = 'navigasi' | 'lowongan' | 'perhitungan' | 'kuesioner'

interface TourStep {
  id: string
  section: TourSectionKey
  sectionLabel: string
  selector: string
  fallbackSelector?: string
  title: string
  description: string
}

const SECTION_STEPS: Record<TourSectionKey, TourStep[]> = {
  navigasi: [
    {
      id: 'header-nav',
      section: 'navigasi',
      sectionLabel: 'Navigasi',
      selector: '[data-tour="header-nav"]',
      fallbackSelector: '[data-tour="header-brand"]',
      title: 'Menu Navigasi',
      description:
        'Pindah halaman ke Beranda, Lowongan, Perhitungan SPK, atau Kuesioner di sini.',
    },
    {
      id: 'header-saved',
      section: 'navigasi',
      sectionLabel: 'Navigasi',
      selector: '[data-tour="header-saved"]',
      title: 'Lowongan Tersimpan',
      description:
        'Lihat kembali daftar lowongan favorit yang sudah kamu tandai (bookmark).',
    },
    {
      id: 'header-tools',
      section: 'navigasi',
      sectionLabel: 'Navigasi',
      selector: '[data-tour="header-tools"]',
      title: 'Tema & Panduan',
      description:
        'Ganti tampilan mode terang/gelap atau klik "?" untuk membuka panduan ini lagi.',
    },
    {
      id: 'header-profile',
      section: 'navigasi',
      sectionLabel: 'Navigasi',
      selector: '[data-tour="header-profile"]',
      title: 'Profil Kamu',
      description:
        'Cek nama profil, ringkasan target gaji, lokasi, dan batas jam kerjamu di sini.',
    },
  ],
  lowongan: [
    {
      id: 'portal-hero',
      section: 'lowongan',
      sectionLabel: 'Lowongan',
      selector: '[data-tour="portal-hero"]',
      title: 'Ringkasan Preferensi',
      description:
        'Menampilkan sapaan nama dan filter aktifmu. Klik "Sesuaikan preferensi" untuk mengubahnya.',
    },
    {
      id: 'portal-filter',
      section: 'lowongan',
      sectionLabel: 'Lowongan',
      selector: '[data-tour="portal-filter"]',
      title: 'Cari & Filter Lowongan',
      description:
        'Cari posisi kerja, saring kategori & moda kerja, atau atur urutan lowongan di sini.',
    },
    {
      id: 'portal-job-list',
      section: 'lowongan',
      sectionLabel: 'Lowongan',
      selector: '[data-tour="portal-job-list"]',
      title: 'Daftar Lowongan',
      description:
        'Pilih lowongan dari daftar yang sudah diurutkan otomatis dari yang paling cocok untukmu.',
    },
    {
      id: 'portal-job-detail',
      section: 'lowongan',
      sectionLabel: 'Lowongan',
      selector: '[data-tour="portal-job-detail"]',
      title: 'Detail & Skor SPK',
      description:
        'Lihat deskripsi pekerjaan, rincian skor 5 kriteria (C1–C5), dan tombol untuk melamar.',
    },
  ],
  perhitungan: [
    {
      id: 'matrix-header',
      section: 'perhitungan',
      sectionLabel: 'Perhitungan',
      selector: '[data-tour="matrix-header"]',
      title: 'Kontrol & Unduh CSV',
      description:
        'Atur ulang bobot prioritas ROC atau unduh tabel perhitungan lengkap ke file CSV.',
    },
    {
      id: 'matrix-content',
      section: 'perhitungan',
      sectionLabel: 'Perhitungan',
      selector: '[data-tour="matrix-content"]',
      title: 'Tabel Matriks SPK',
      description:
        'Lihat detail peringkat, skor utilitas, dan matriks awal dari 221 lowongan kerja.',
    },
  ],
  kuesioner: [
    {
      id: 'kuesioner-stepper',
      section: 'kuesioner',
      sectionLabel: 'Kuesioner',
      selector: '[data-tour="kuesioner-stepper"]',
      title: 'Tahapan Kuesioner',
      description:
        'Ikuti 3 tahap singkat: isi Profil, urutkan Prioritas kriteria, lalu lihat Hasil rekomendasi.',
    },
    {
      id: 'kuesioner-content',
      section: 'kuesioner',
      sectionLabel: 'Kuesioner',
      selector: '[data-tour="kuesioner-content"]',
      title: 'Form Pengisian Profil',
      description:
        'Jawab pertanyaan satu per satu. Nama yang kamu isi akan langsung tampil di profil website.',
    },
  ],
}

const SECTION_LIST: Array<{ key: TourSectionKey; label: string }> = [
  { key: 'navigasi', label: 'Navigasi' },
  { key: 'lowongan', label: 'Lowongan' },
  { key: 'perhitungan', label: 'Perhitungan' },
  { key: 'kuesioner', label: 'Kuesioner' },
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

function resolveSectionPath(section: TourSectionKey, isDataMode: boolean): string | null {
  if (section === 'navigasi') return null // Navbar ada di semua halaman
  if (section === 'lowongan') return isDataMode ? ROUTES.DATA_PORTAL : ROUTES.PORTAL
  if (section === 'perhitungan') return isDataMode ? ROUTES.DATA_MATRIX : ROUTES.MATRIX
  return ROUTES.KUESIONER
}

function defaultSectionForPath(pathname: string): TourSectionKey {
  if (pathname === ROUTES.PORTAL || pathname === ROUTES.DATA_PORTAL) return 'lowongan'
  if (pathname === ROUTES.MATRIX || pathname === ROUTES.DATA_MATRIX) return 'perhitungan'
  if (pathname === ROUTES.KUESIONER) return 'kuesioner'
  // Di Beranda tidak ada tutorial konten beranda, langsung tampilkan tutorial Navbar (Navigasi)
  return 'navigasi'
}

export function WalkthroughProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<TourSectionKey>('navigasi')
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
    const sec = defaultSectionForPath(location.pathname)
    setActiveSection(sec)
    setStepIndex(0)
    setIsOpen(true)
  }, [location.pathname])

  const stopTour = useCallback(() => {
    setIsOpen(false)
  }, [])

  const steps = SECTION_STEPS[activeSection]
  const step = steps[stepIndex] ?? steps[0]

  // Kunci scroll halaman selama panduan aktif agar posisi highlight tidak bergeser/bug
  useEffect(() => {
    if (!isOpen) return

    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    const preventScroll = (e: Event) => {
      e.preventDefault()
    }

    window.addEventListener('wheel', preventScroll, { passive: false })
    window.addEventListener('touchmove', preventScroll, { passive: false })

    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      window.removeEventListener('wheel', preventScroll)
      window.removeEventListener('touchmove', preventScroll)
    }
  }, [isOpen])

  // Pindah halaman otomatis bila pengguna memilih tab bagian lain di dalam popover
  useEffect(() => {
    if (!isOpen) return
    const targetPath = resolveSectionPath(activeSection, isDataMode)
    if (targetPath && location.pathname !== targetPath) {
      navigate(targetPath)
    }
  }, [isOpen, activeSection, isDataMode, location.pathname, navigate])

  // Posisikan scroll secara instan ke elemen target lalu ukur koordinat spotlight
  const alignAndMeasure = useCallback(
    (doScroll: boolean) => {
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

      const initialRect = el.getBoundingClientRect()
      if (initialRect.width === 0 || initialRect.height === 0) {
        setSpotlight(null)
        return
      }

      if (doScroll) {
        const html = document.documentElement
        const body = document.body
        html.style.overflow = ''
        body.style.overflow = ''

        if (activeSection === 'navigasi') {
          window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
        } else {
          const pageTop = window.scrollY + initialRect.top
          const desiredTop = Math.max(0, pageTop - 84)
          window.scrollTo({ top: desiredTop, behavior: 'instant' as ScrollBehavior })
        }

        html.style.overflow = 'hidden'
        body.style.overflow = 'hidden'
      }

      const rect = el.getBoundingClientRect()
      const pad = 8
      const maxSpotHeight = Math.max(140, window.innerHeight - 250)
      const visibleHeight = Math.min(rect.height, maxSpotHeight)

      const top = rect.top - pad
      const left = Math.max(6, rect.left - pad)
      const width = Math.min(window.innerWidth - left - 6, rect.width + pad * 2)
      const height = visibleHeight + pad * 2

      setSpotlight({ top, left, width, height })
    },
    [isOpen, step, activeSection]
  )

  useLayoutEffect(() => {
    if (!isOpen) return
    alignAndMeasure(true)
    const t1 = window.setTimeout(() => alignAndMeasure(true), 60)
    const t2 = window.setTimeout(() => alignAndMeasure(false), 200)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [isOpen, activeSection, stepIndex, location.pathname, alignAndMeasure])

  useEffect(() => {
    if (!isOpen) return
    const onResize = () => alignAndMeasure(false)
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [isOpen, alignAndMeasure])

  // Navigasi keyboard (Escape, ArrowRight, ArrowLeft)
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopTour()
      } else if (e.key === 'ArrowRight') {
        setStepIndex((i) => (i < steps.length - 1 ? i + 1 : i))
      } else if (e.key === 'ArrowLeft') {
        setStepIndex((i) => (i > 0 ? i - 1 : i))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, steps.length, stopTour])

  // Hitung posisi kartu popover dan panah penunjuk
  const popoverLayout = useMemo(() => {
    const cardWidth = Math.min(360, viewport.width - 24)
    if (!spotlight) {
      return {
        cardWidth,
        left: Math.max(12, (viewport.width - cardWidth) / 2),
        top: Math.max(80, viewport.height / 2 - 100),
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
      Math.max(24, targetCenterX - left),
      cardWidth - 24
    )

    const spaceBelow = viewport.height - (spotlight.top + spotlight.height)
    const spaceAbove = spotlight.top
    const estimatedCardHeight = 195

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

  const ctxValue = useMemo(
    () => ({ isOpen, startTour, stopTour }),
    [isOpen, startTour, stopTour]
  )

  return (
    <WalkthroughContext.Provider value={ctxValue}>
      {children}

      {isOpen && step && (
        <div
          className="fixed inset-0 z-[95] select-none"
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
                    className="transition-all duration-200 ease-out"
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

          {/* Klik area gelap untuk menutup panduan */}
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
              className="fixed rounded-2xl ring-2 ring-white dark:ring-blue-400 shadow-[0_0_0_4px_rgba(12,82,238,0.35)] pointer-events-none transition-all duration-200 ease-out z-[96]"
            />
          )}

          {/* Kartu Popover Panduan */}
          <div
            style={{
              width: popoverLayout.cardWidth,
              left: popoverLayout.left,
              top: popoverLayout.top,
            }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[97] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-5 transition-all duration-200 ease-out"
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

            {/* Tab Pilihan Bagian (tanpa Beranda, terpisah tiap bagian) */}
            <div className="flex flex-wrap items-center justify-center gap-1 mb-2.5">
              {SECTION_LIST.map((sec) => {
                const isActiveSec = activeSection === sec.key
                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => {
                      setActiveSection(sec.key)
                      setStepIndex(0)
                    }}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                      isActiveSec
                        ? 'bg-[#0C52EE]/10 dark:bg-blue-500/20 text-[#0C52EE] dark:text-blue-300 border border-[#0C52EE]/30 dark:border-blue-500/40'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {sec.label}
                  </button>
                )
              })}
            </div>

            {/* Judul & Penjelasan Singkat */}
            <div className="text-center space-y-1 px-1">
              <h3 className="text-[15px] font-semibold text-[#0C52EE] dark:text-blue-400 leading-snug">
                {step.title}
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Tombol Navigasi Bawah: Lewati | Kembali | Lanjut (X dari N bagian ini) */}
            <div className="flex items-center justify-between gap-2 pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800/80">
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

                {stepIndex < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
                    className="px-4 py-1.5 rounded-full bg-[#0C52EE] hover:bg-[#0942c4] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-[13px] font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    Lanjut ({stepIndex + 1} dari {steps.length})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopTour}
                    className="px-4 py-1.5 rounded-full bg-[#0C52EE] hover:bg-[#0942c4] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-[13px] font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    Selesai ({steps.length} dari {steps.length})
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
