import { useState, useEffect, useMemo, useRef } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { RiErrorWarningLine } from 'react-icons/ri'
import { PortalHeader } from './components/PortalHeader'
import { PortalHero } from './components/PortalHero'
import { LandingPage } from './components/landing/LandingPage'
import { JobCardItem } from './components/JobCardItem'
import { JobDetailPane } from './components/JobDetailPane'
import { PreferenceSidebar } from './components/PreferenceSidebar'
import { SavedJobsModal } from './components/SavedJobsModal'
import { FullMatrixView } from './components/FullMatrixView'
import { KuesionerPage } from './components/kuesioner/KuesionerPage'
import { Button } from './components/ui/Button'
import type { CleanJob, StudentProfile } from './types/data'
import type { StudentPreferences } from './types/portal'
import { DEFAULT_STUDENT_PREFERENCES } from './types/portal'
import { fetchCsvData, computeSPKForCustomStudent } from './lib/spk'
import { ROUTES } from './lib/routes'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export function PortalFooter({ onOpenPreferences }: { onOpenPreferences: () => void }) {
  return (
    <footer className="border-t border-slate-200 bg-white mt-16 py-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 upmatch • Sistem Rekomendasi Part-Time Mahasiswa (SMARTER &amp; ROC)</p>
        <div className="flex items-center gap-4 text-slate-600">
          <span>221 Lowongan Terverifikasi</span>
          <span>•</span>
          <span>Untuk Mahasiswa</span>
          <span>•</span>
          <button
            onClick={onOpenPreferences}
            className="hover:text-slate-900 underline cursor-pointer"
          >
            Atur Kriteria SPK
          </button>
        </div>
      </div>
    </footer>
  )
}

export function App() {
  // Dataset states
  const [jobs, setJobs] = useState<CleanJob[]>([])
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dua sumber profil untuk dua mode (layar sama):
  // - userPrefs: selalu kosong, diisi user baru via /kuesioner (mode /).
  // - dataPrefs: dari responden GForm via dropdown avatar (mode /data/*, demo).
  const [userPrefs, setUserPrefs] = useState<StudentPreferences>(DEFAULT_STUDENT_PREFERENCES)
  const [dataPrefs, setDataPrefs] = useState<StudentPreferences>(DEFAULT_STUDENT_PREFERENCES)

  // Filter & search states (persist across /portal <-> /perhitungan-spk)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [filterWorkSystem, setFilterWorkSystem] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'match' | 'salary-high' | 'salary-low' | 'hours-low'>('match')

  // Active selected job for detail pane (also reflected in ?job= URL param)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  // Saved jobs bookmark IDs
  const [savedJobIds, setSavedJobIds] = useState<string[]>([])

  // Navigasi antar URL (landing <-> portal <-> matriks)
  const navigate = useNavigate()

  // Modals state
  const [isPreferenceOpen, setIsPreferenceOpen] = useState(false)
  const [isSavedJobsOpen, setIsSavedJobsOpen] = useState(false)

  // Sinkronkan URL lama / tidak dikenal & pastikan selalu mode terang (prototipe light-only)
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  // Mode aktif dilihat dari prefix URL (/data/* = demo data responden).
  const { pathname } = useLocation()
  const isDataMode = pathname === ROUTES.DATA || pathname.startsWith('/data/')

  // Load dataset CSV.
  // userPrefs TIDAK pernah auto-isi (landing / selalu bersih untuk user baru);
  // hanya dataPrefs yang diisi responden pertama sebagai default mode demo.
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [jobsData, studentsData] = await Promise.all([
          fetchCsvData<CleanJob>('/data/clean_jobs_dataset.csv'),
          fetchCsvData<StudentProfile>('/data/clean_students_dataset.csv'),
        ])

        setJobs(jobsData)
        setStudents(studentsData)

        if (studentsData.length > 0) {
          const s = studentsData[0]
          setDataPrefs((prev) => ({
            ...prev,
            name: s.student_name,
            nim: s.student_id,
            minSalary: s.min_expected_salary || 35000,
            maxHours: s.student_expected_work_hour || 18,
            location: s.student_location_clean || s.student_location || 'Jakarta Barat',
            preferredCategory: s.preferred_category || 'Education & Tutoring',
            skills: s.clean_student_skills || s.student_skills || '',
            avatarSeed: s.student_id,
            avatarStyle: '',
            profileComplete: true,
          }))
        }
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError('Gagal memuat dataset lowongan kerja. Pastikan data tersedia.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Ekstrak list kategori unik
  const categories = useMemo(() => {
    const set = new Set<string>()
    jobs.forEach((j) => {
      if (j.job_category) set.add(j.job_category)
    })
    return Array.from(set).sort()
  }, [jobs])

  // Profil + setter aktif mengikuti mode URL.
  const activePrefs = isDataMode ? dataPrefs : userPrefs
  const updateActivePrefs: React.Dispatch<React.SetStateAction<StudentPreferences>> = (update) => {
    if (isDataMode) setDataPrefs(update)
    else setUserPrefs(update)
  }

  // Komputasi SPK dinamis setiap kali preferensi mode aktif berubah.
  // /perhitungan-spk user baru = hasil kuesionernya; /data/* = responden terpilih.
  const rankedJobs = useMemo(() => {
    return computeSPKForCustomStudent(jobs, activePrefs)
  }, [jobs, activePrefs])

  // Filter dan sort hasil untuk tampilan job feed
  const displayJobs = useMemo(() => {
    return rankedJobs
      .filter((job) => {
        const q = searchQuery.toLowerCase()
        const matchSearch =
          !q ||
          job.job_title?.toLowerCase().includes(q) ||
          job.company_name?.toLowerCase().includes(q) ||
          job.job_id?.toLowerCase().includes(q) ||
          job.work_required_skills?.toLowerCase().includes(q)

        const matchCat = filterCategory === 'ALL' || job.job_category === filterCategory
        const matchSys =
          filterWorkSystem === 'ALL' ||
          job.work_system?.toLowerCase() === filterWorkSystem.toLowerCase()

        return matchSearch && matchCat && matchSys
      })
      .sort((a, b) => {
        if (sortBy === 'salary-high') return b.work_salaryperhour - a.work_salaryperhour
        if (sortBy === 'salary-low') return a.work_salaryperhour - b.work_salaryperhour
        if (sortBy === 'hours-low') return a.work_hours - b.work_hours
        return b.finalScore - a.finalScore // default 'match' (SPK ranking)
      })
  }, [rankedJobs, searchQuery, filterCategory, filterWorkSystem, sortBy])

  // Auto-select job pertama jika belum ada yang terpilih
  useEffect(() => {
    if (displayJobs.length > 0 && (!selectedJobId || !displayJobs.some((j) => j.job_id === selectedJobId))) {
      setSelectedJobId(displayJobs[0].job_id)
    }
  }, [displayJobs, selectedJobId])

  const selectedJob = useMemo(() => {
    return displayJobs.find((j) => j.job_id === selectedJobId) || displayJobs[0] || null
  }, [displayJobs, selectedJobId])

  // Bookmark / Save jobs handler
  const handleToggleSave = (jobId: string) => {
    setSavedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    )
  }

  const savedJobsList = useMemo(() => {
    return rankedJobs.filter((j) => savedJobIds.includes(j.job_id))
  }, [rankedJobs, savedJobIds])

  const shared = {
    jobs,
    students,
    loading,
    error,
    studentPrefs: activePrefs,
    setStudentPrefs: updateActivePrefs,
    userPrefs,
    setUserPrefs,
    isDataMode,
    categories,
    rankedJobs,
    displayJobs,
    selectedJob,
    selectedJobId,
    setSelectedJobId,
    savedJobIds,
    savedJobsList,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterWorkSystem,
    setFilterWorkSystem,
    sortBy,
    setSortBy,
  }

  // User baru yang profilnya masih kosong diarahkan isi kuesioner dulu.
  const goFillQuestionnaire = () => {
    setIsPreferenceOpen(false)
    navigate(ROUTES.KUESIONER)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <ScrollToTop />
      <Routes>
        <Route
          path={ROUTES.LANDING}
          element={
            <LandingRoute
              mode="user"
              savedCount={savedJobIds.length}
              rankedJobs={rankedJobs}
              onOpenSavedJobs={() => setIsSavedJobsOpen(true)}
              setSearchQuery={setSearchQuery}
              setFilterCategory={setFilterCategory}
              setSelectedJobId={setSelectedJobId}
            />
          }
        />
        {/* Mode demo data: beranda yang sama, rekomendasi dari responden terpilih */}
        <Route
          path={ROUTES.DATA}
          element={
            <LandingRoute
              mode="data"
              savedCount={savedJobIds.length}
              rankedJobs={rankedJobs}
              onOpenSavedJobs={() => setIsSavedJobsOpen(true)}
              setSearchQuery={setSearchQuery}
              setFilterCategory={setFilterCategory}
              setSelectedJobId={setSelectedJobId}
            />
          }
        />
        <Route
          path={ROUTES.PORTAL}
          element={
            <PortalRoute
              mode="user"
              state={shared}
              onOpenPreferences={() => setIsPreferenceOpen(true)}
              onOpenSavedJobs={() => setIsSavedJobsOpen(true)}
              onToggleSave={handleToggleSave}
              onFillQuestionnaire={goFillQuestionnaire}
            />
          }
        />
        <Route
          path={ROUTES.DATA_PORTAL}
          element={
            <PortalRoute
              mode="data"
              state={shared}
              onOpenPreferences={() => setIsPreferenceOpen(true)}
              onOpenSavedJobs={() => setIsSavedJobsOpen(true)}
              onToggleSave={handleToggleSave}
              onFillQuestionnaire={goFillQuestionnaire}
            />
          }
        />
        <Route
          path={ROUTES.MATRIX}
          element={
            <MatrixRoute
              mode="user"
              state={shared}
              onOpenPreferences={() => setIsPreferenceOpen(true)}
              onOpenSavedJobs={() => setIsSavedJobsOpen(true)}
              onFillQuestionnaire={goFillQuestionnaire}
            />
          }
        />
        <Route
          path={ROUTES.DATA_MATRIX}
          element={
            <MatrixRoute
              mode="data"
              state={shared}
              onOpenPreferences={() => setIsPreferenceOpen(true)}
              onOpenSavedJobs={() => setIsSavedJobsOpen(true)}
              onFillQuestionnaire={goFillQuestionnaire}
            />
          }
        />
        <Route
          path={ROUTES.KUESIONER}
          element={
            <>
              <KuesionerPage
                jobs={shared.jobs}
                students={shared.students}
                loading={shared.loading}
                studentPrefs={userPrefs}
                setStudentPrefs={setUserPrefs}
                onOpenPreferences={() => setIsPreferenceOpen(true)}
                onOpenSavedJobs={() => setIsSavedJobsOpen(true)}
                savedJobsCount={shared.savedJobIds.length}
              />
              <PortalFooter onOpenPreferences={() => setIsPreferenceOpen(true)} />
            </>
          }
        />
        {/* URL lama / tidak dikenal -> kembali ke beranda modenya masing-masing */}
        <Route path="*" element={<Navigate to={isDataMode ? ROUTES.DATA : ROUTES.LANDING} replace />} />
      </Routes>

      {/* Preference Drawer / Modal (global, bisa dibuka dari semua URL) */}
      <PreferenceSidebar
        open={isPreferenceOpen}
        onClose={() => setIsPreferenceOpen(false)}
        preferences={activePrefs}
        onUpdatePreferences={updateActivePrefs}
        studentPresets={students}
        categories={categories}
        mode={isDataMode ? 'data' : 'user'}
        onFillQuestionnaire={goFillQuestionnaire}
      />

      {/* Saved Jobs Modal (global) */}
      <SavedJobsModal
        open={isSavedJobsOpen}
        onClose={() => setIsSavedJobsOpen(false)}
        savedJobs={savedJobsList}
        onRemoveSaved={handleToggleSave}
        onSelectJob={(job) => {
          setSelectedJobId(job.job_id)
          setIsSavedJobsOpen(false)
          const portalPath = isDataMode ? ROUTES.DATA_PORTAL : ROUTES.PORTAL
          navigate(`${portalPath}?job=${encodeURIComponent(job.job_id)}`)
        }}
      />
    </div>
  )
}

// ─── Route: / & /data (Beranda, layar sama, beda sumber profil) ───────────────
function LandingRoute({
  mode,
  savedCount,
  rankedJobs,
  onOpenSavedJobs,
  setSearchQuery,
  setFilterCategory,
  setSelectedJobId,
}: {
  mode: 'user' | 'data'
  savedCount: number
  rankedJobs: SharedState['rankedJobs']
  onOpenSavedJobs: () => void
  setSearchQuery: (q: string) => void
  setFilterCategory: (c: string) => void
  setSelectedJobId: (id: string | null) => void
}) {
  const navigate = useNavigate()
  const portalPath = mode === 'data' ? ROUTES.DATA_PORTAL : ROUTES.PORTAL

  return (
    <LandingPage
      mode={mode}
      savedCount={savedCount}
      jobs={rankedJobs}
      onOpenSavedJobs={onOpenSavedJobs}
      onQuickSearch={(q) => {
        setSearchQuery(q)
        navigate(portalPath)
      }}
      onSelectCategory={(cat) => {
        setFilterCategory(cat)
        navigate(portalPath)
      }}
      onOpenJob={(job) => {
        setSelectedJobId(job.job_id)
        navigate(`${portalPath}?job=${encodeURIComponent(job.job_id)}`)
      }}
    />
  )
}

type SharedState = {
  jobs: CleanJob[]
  students: StudentProfile[]
  loading: boolean
  error: string | null
  studentPrefs: StudentPreferences
  setStudentPrefs: React.Dispatch<React.SetStateAction<StudentPreferences>>
  userPrefs: StudentPreferences
  setUserPrefs: React.Dispatch<React.SetStateAction<StudentPreferences>>
  isDataMode: boolean
  categories: string[]
  rankedJobs: ReturnType<typeof computeSPKForCustomStudent>
  displayJobs: ReturnType<typeof computeSPKForCustomStudent>
  selectedJob: ReturnType<typeof computeSPKForCustomStudent>[number] | null
  selectedJobId: string | null
  setSelectedJobId: React.Dispatch<React.SetStateAction<string | null>>
  savedJobIds: string[]
  savedJobsList: ReturnType<typeof computeSPKForCustomStudent>
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  filterCategory: string
  setFilterCategory: React.Dispatch<React.SetStateAction<string>>
  filterWorkSystem: string
  setFilterWorkSystem: React.Dispatch<React.SetStateAction<string>>
  sortBy: 'match' | 'salary-high' | 'salary-low' | 'hours-low'
  setSortBy: React.Dispatch<React.SetStateAction<'match' | 'salary-high' | 'salary-low' | 'hours-low'>>
}

/**
 * Membangun daftar token halaman untuk paginasi: selalu tampilkan halaman 1,
 * halaman terakhir, dan jendela di sekitar halaman aktif. Celah > 1 diringkas
 * menjadi elipsis ("…") supaya Controls tidak melebar.
 */
function buildPageTokens(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set<number>([1, total])
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= total) pages.add(p)
  }
  // Di dekat ujung, perluas jendela agar tidak ada elipsis bolong di tepi
  if (current <= 3) [2, 3, 4].forEach((p) => p <= total && pages.add(p))
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => p >= 1 && pages.add(p))

  const sorted = Array.from(pages).sort((a, b) => a - b)
  const tokens: (number | 'ellipsis')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) tokens.push('ellipsis')
    tokens.push(p)
  })
  return tokens
}

// ─── Route: /portal & /data/portal (feed sama, beda sumber profil) ─────────────
function PortalRoute({
  mode,
  state,
  onOpenPreferences,
  onOpenSavedJobs,
  onToggleSave,
  onFillQuestionnaire,
}: {
  mode: 'user' | 'data'
  state: SharedState
  onOpenPreferences: () => void
  onOpenSavedJobs: () => void
  onToggleSave: (jobId: string) => void
  onFillQuestionnaire: () => void
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  // Profil user baru belum terisi (kuesioner belum selesai) -> sembunyikan
  // semua skor % & chip preferensi yang dihitung dari nilai default.
  const isProfileEmpty = mode === 'user' && !state.studentPrefs.profileComplete

  // Paginasi feed lowongan (prev/next) supaya daftar tidak terlalu panjang
  const PAGE_SIZE = 8
  const [page, setPage] = useState(0)

  // Reset ke halaman pertama setiap kali filter/pencarian/sortir berubah
  useEffect(() => {
    setPage(0)
  }, [state.searchQuery, state.filterCategory, state.filterWorkSystem, state.sortBy])

  const pageCount = Math.max(1, Math.ceil(state.displayJobs.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pagedJobs = useMemo(
    () => state.displayJobs.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [state.displayJobs, safePage]
  )
  const pageTokens = useMemo(() => buildPageTokens(safePage + 1, pageCount), [safePage, pageCount])

  const listTopRef = useRef<HTMLDivElement | null>(null)
  const goToPage = (next: number) => {
    const target = Math.min(Math.max(next, 0), pageCount - 1)
    setPage(target)
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Deep-link: /portal?job=JOB_ID -> pilih job tersebut saat halaman dibuka / dibagikan
  useEffect(() => {
    const jobParam = searchParams.get('job')
    if (jobParam && jobParam !== state.selectedJobId) {
      state.setSelectedJobId(jobParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleSelectJob = (jobId: string) => {
    state.setSelectedJobId(jobId)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('job', jobId)
      return next
    }, { replace: true })
  }

  return (
    <>
      <PortalHeader
        mode={mode}
        activeView="jobs"
        studentPrefs={state.studentPrefs}
        onOpenPreferences={onOpenPreferences}
        savedJobsCount={state.savedJobIds.length}
        onOpenSavedJobs={onOpenSavedJobs}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* User baru + profil belum terisi -> tawarkan kuesioner sebagai bantuan */}
        {isProfileEmpty && !state.loading && !state.error && (
          <section className="bg-[#0C52EE]/[0.04] border border-[#0C52EE]/25 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <h2 className="text-sm font-medium text-slate-900">Dapatkan rekomendasi yang pas buat kamu</h2>
              <p className="text-xs text-slate-500 font-light mt-0.5">
                Ceritakan upah, jam, lokasi & skill-mu lewat kuesioner singkat (±3 menit) —
                221 lowongan langsung diurutkan sesuai kebutuhanmu.
              </p>
            </div>
            <Button size="sm" onClick={onFillQuestionnaire} className="text-xs shrink-0">
              Mulai kuesioner
            </Button>
          </section>
        )}
        {state.loading ? (
          <div className="space-y-6" role="status" aria-label="Memuat lowongan">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 animate-pulse">
              <div className="h-5 w-2/3 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="mt-3 h-4 w-1/2 rounded-md bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse">
                    <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-3 h-3 w-full rounded bg-slate-100 dark:bg-slate-900" />
                  </div>
                ))}
              </div>
              <div className="lg:col-span-7">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse">
                  <div className="h-6 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-lg bg-slate-100 dark:bg-slate-900" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <span className="sr-only">Memuat portal lowongan dan modul SPK…</span>
          </div>
        ) : state.error ? (
          <div className="p-6 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-center space-y-3 max-w-md mx-auto my-20">
            <RiErrorWarningLine className="h-8 w-8 text-red-500 mx-auto" />
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{state.error}</h3>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-xs">
              Coba muat ulang
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Banner Hero (atau CTA kuesioner bila profil belum terisi) */}
            <PortalHero
              studentPrefs={state.studentPrefs}
              onOpenPreferences={onOpenPreferences}
              totalJobs={state.jobs.length}
              isProfileEmpty={isProfileEmpty}
              onFillQuestionnaire={onFillQuestionnaire}
            />

            {/* Filter Bar & Controls */}
            <section className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
                <div className="lg:col-span-5 relative">
                  <label htmlFor="portal-search" className="sr-only">Cari lowongan, perusahaan, atau keahlian</label>
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input
                    id="portal-search"
                    type="text"
                    placeholder="Cari posisi, perusahaan, atau keahlian…"
                    value={state.searchQuery}
                    onChange={(e) => state.setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-light text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0C52EE]"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label htmlFor="filter-category" className="sr-only">Filter kategori</label>
                  <select
                    id="filter-category"
                    value={state.filterCategory}
                    onChange={(e) => state.setFilterCategory(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-light text-slate-700 focus:bg-white focus:outline-none focus:border-[#0C52EE]"
                  >
                    <option value="ALL">Semua Kategori</option>
                    {state.categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label htmlFor="filter-mode" className="sr-only">Filter moda kerja</label>
                  <select
                    id="filter-mode"
                    value={state.filterWorkSystem}
                    onChange={(e) => state.setFilterWorkSystem(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-light text-slate-700 focus:bg-white focus:outline-none focus:border-[#0C52EE]"
                  >
                    <option value="ALL">Semua Moda</option>
                    <option value="Remote">Remote Only</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label htmlFor="sort-by" className="sr-only">Urutkan lowongan</label>
                  <select
                    id="sort-by"
                    value={state.sortBy}
                    onChange={(e) => state.setSortBy(e.target.value as any)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-light text-slate-700 focus:bg-white focus:outline-none focus:border-[#0C52EE]"
                  >
                    <option value="match">Urutkan: Kecocokan SPK</option>
                    <option value="salary-high">Upah Tertinggi</option>
                    <option value="salary-low">Upah Terendah</option>
                    <option value="hours-low">Jam Tersedikit</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Status bar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:justify-between text-xs text-slate-500 gap-1 font-light px-1" role="status" aria-live="polite">
              <div>
                Menampilkan <span className="font-medium text-slate-900">{pagedJobs.length}</span> dari{' '}
                <span className="font-medium text-slate-900">{state.displayJobs.length}</span> lowongan untuk{' '}
                <span className="font-medium text-slate-900">{state.studentPrefs.name.trim() || 'kamu'}</span>
              </div>
              {!isProfileEmpty && (
                <div className="text-[11px] text-slate-400">
                  {state.studentPrefs.location} {"\u2022"} Rp {state.studentPrefs.minSalary.toLocaleString('id-ID')}/jam {"\u2022"} maks {state.studentPrefs.maxHours} jam/mgg
                </div>
              )}
            </div>

            {/* Split Master-Detail Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Job Cards Feed */}
              <div ref={listTopRef} className="lg:col-span-5 space-y-3 scroll-mt-20" role="listbox" aria-label="Daftar lowongan terurut SPK" aria-activedescendant={state.selectedJob ? `job-${state.selectedJob.job_id}` : undefined}>
                {state.displayJobs.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-2">
                    <p className="font-medium text-slate-800 text-sm">Tidak ada lowongan yang cocok</p>
                    <p className="text-xs text-slate-400 font-light">Coba hapus kata kunci, pilih "Semua Kategori", atau turunkan target upah di Preferensi.</p>
                    <button onClick={() => { state.setSearchQuery(''); state.setFilterCategory('ALL'); state.setFilterWorkSystem('ALL') }} className="text-xs font-medium text-[#0C52EE] hover:underline pt-2">
                      Atur ulang filter
                    </button>
                  </div>
                ) : (
                  pagedJobs.map((job, i) => (
                    <JobCardItem
                      key={job.job_id}
                      job={job}
                      index={i}
                      isSelected={state.selectedJob?.job_id === job.job_id}
                      onSelect={() => handleSelectJob(job.job_id)}
                      studentPrefs={state.studentPrefs}
                      hideMatch={isProfileEmpty}
                      isSaved={state.savedJobIds.includes(job.job_id)}
                      onToggleSave={(e) => {
                        e.stopPropagation()
                        onToggleSave(job.job_id)
                      }}
                    />
                  ))
                )}

                {/* Pagination: Previous / nomor halaman / Next */}
                {state.displayJobs.length > PAGE_SIZE && (
                  <nav
                    className="flex flex-wrap items-center justify-center gap-1 pt-1"
                    aria-label="Paginasi daftar lowongan"
                  >
                    <button
                      type="button"
                      onClick={() => goToPage(safePage - 1)}
                      disabled={safePage === 0}
                      aria-label="Halaman sebelumnya"
                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-500 transition hover:border-[#0C52EE] hover:text-[#0C52EE] disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    {pageTokens.map((token, i) =>
                      token === 'ellipsis' ? (
                        <span
                          key={`gap-${i}`}
                          className="w-6 h-8 inline-flex items-center justify-center text-xs text-slate-400 select-none"
                          aria-hidden="true"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={token}
                          type="button"
                          onClick={() => goToPage(token - 1)}
                          aria-label={`Halaman ${token}`}
                          aria-current={token === safePage + 1 ? 'page' : undefined}
                          className={`h-8 min-w-8 px-2 rounded-lg text-xs font-medium tabular-nums transition ${
                            token === safePage + 1
                              ? 'bg-[#0C52EE] text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {token}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => goToPage(safePage + 1)}
                      disabled={safePage >= pageCount - 1}
                      aria-label="Halaman berikutnya"
                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-500 transition hover:border-[#0C52EE] hover:text-[#0C52EE] disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                )}
              </div>

              {/* Right Column: detail panel — sticky, scroll sendiri */}
              <div className="lg:col-span-7 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain">
                <JobDetailPane
                  job={state.selectedJob}
                  studentPrefs={state.studentPrefs}
                  hideAnalysis={isProfileEmpty}
                  onFillQuestionnaire={onFillQuestionnaire}
                  isSaved={!!state.selectedJob && state.savedJobIds.includes(state.selectedJob.job_id)}
                  onToggleSave={() => state.selectedJob && onToggleSave(state.selectedJob.job_id)}
                  onOpenPreferences={onOpenPreferences}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <PortalFooter onOpenPreferences={onOpenPreferences} />
    </>
  )
}

// ─── Route: /perhitungan-spk & /data/perhitungan-spk (hasil ikut mode) ─────────
// Mode user = hasil kuesioner user baru; mode data = responden terpilih.
function MatrixRoute({
  mode,
  state,
  onOpenPreferences,
  onOpenSavedJobs,
  onFillQuestionnaire,
}: {
  mode: 'user' | 'data'
  state: SharedState
  onOpenPreferences: () => void
  onOpenSavedJobs: () => void
  onFillQuestionnaire: () => void
}) {
  const navigate = useNavigate()
  const portalPath = mode === 'data' ? ROUTES.DATA_PORTAL : ROUTES.PORTAL
  const isProfileEmpty = mode === 'user' && !state.studentPrefs.profileComplete

  return (
    <>
      <PortalHeader
        mode={mode}
        activeView="matrix"
        studentPrefs={state.studentPrefs}
        onOpenPreferences={onOpenPreferences}
        savedJobsCount={state.savedJobIds.length}
        onOpenSavedJobs={onOpenSavedJobs}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {state.loading ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse" role="status" aria-label="Memuat modul SPK">
            <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-3 h-10 rounded-lg bg-slate-100 dark:bg-slate-900" />
            <span className="sr-only">Memuat modul SPK…</span>
          </div>
        ) : state.error ? (
          <div className="p-6 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-center space-y-3 max-w-md mx-auto my-20">
            <RiErrorWarningLine className="h-8 w-8 text-red-500 mx-auto" />
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{state.error}</h3>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-xs">
              Coba muat ulang
            </Button>
          </div>
        ) : (
          <FullMatrixView
            rankedJobs={state.rankedJobs}
            studentPrefs={state.studentPrefs}
            onOpenPreferences={onOpenPreferences}
            isProfileEmpty={isProfileEmpty}
            onFillQuestionnaire={onFillQuestionnaire}
            onSelectJobForDetail={(job) => {
              state.setSelectedJobId(job.job_id)
              navigate(`${portalPath}?job=${encodeURIComponent(job.job_id)}`)
            }}
          />
        )}
      </main>

      <PortalFooter onOpenPreferences={onOpenPreferences} />
    </>
  )
}

export default App
