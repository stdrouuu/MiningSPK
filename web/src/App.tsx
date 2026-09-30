import { useState, useEffect, useMemo } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  Search,
  SlidersHorizontal,
  AlertCircle,
  Building2,
} from 'lucide-react'
import { PortalHeader } from './components/PortalHeader'
import { PortalHero } from './components/PortalHero'
import { LandingPage } from './components/landing/LandingPage'
import { JobCardItem } from './components/JobCardItem'
import { JobDetailPane } from './components/JobDetailPane'
import { PreferenceSidebar } from './components/PreferenceSidebar'
import { SavedJobsModal } from './components/SavedJobsModal'
import { FullMatrixView } from './components/FullMatrixView'
import { Button } from './components/ui/Button'
import type { CleanJob, StudentProfile } from './types/data'
import type { StudentPreferences } from './types/portal'
import { DEFAULT_STUDENT_PREFERENCES } from './types/portal'
import { fetchCsvData, computeSPKForCustomStudent } from './lib/spk'
import { getInitialTheme, applyTheme } from './lib/theme'
import { ROUTES } from './lib/routes'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function PortalFooter({ onOpenPreferences }: { onOpenPreferences: () => void }) {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 mt-16 py-6 text-xs text-zinc-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 upmatch • Sistem Rekomendasi Part-Time Mahasiswa UKRIDA (SMARTER & ROC)</p>
        <div className="flex items-center gap-4 text-zinc-600 dark:text-zinc-400">
          <span>221 Lowongan Terverifikasi</span>
          <span>•</span>
          <span>52 Mahasiswa Teruji</span>
          <span>•</span>
          <button
            onClick={onOpenPreferences}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 underline cursor-pointer"
          >
            Atur Kriteria SPK
          </button>
        </div>
      </div>
    </footer>
  )
}

export function App() {
  // Theme state (Light / Dark mode murni)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Dataset states
  const [jobs, setJobs] = useState<CleanJob[]>([])
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Student preferences & SPK criteria priority
  const [studentPrefs, setStudentPrefs] = useState<StudentPreferences>(DEFAULT_STUDENT_PREFERENCES)

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

  // Inisialisasi theme
  useEffect(() => {
    const initialTheme = getInitialTheme()
    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }

  // Load dataset CSV
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

        // Set default student data if available
        if (studentsData.length > 0) {
          const s = studentsData[0]
          setStudentPrefs((prev) => ({
            ...prev,
            name: s.student_name,
            nim: s.student_id,
            minSalary: s.min_expected_salary || 35000,
            maxHours: s.student_expected_work_hour || 18,
            location: s.student_location_clean || s.student_location || 'Jakarta Barat',
            preferredCategory: s.preferred_category || 'Education & Tutoring',
            skills: s.clean_student_skills || s.student_skills || '',
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

  // Komputasi SPK dinamis setiap kali preferensi mahasiswa atau prioritas berubah
  const rankedJobs = useMemo(() => {
    return computeSPKForCustomStudent(jobs, studentPrefs)
  }, [jobs, studentPrefs])

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
    theme,
    jobs,
    students,
    loading,
    error,
    studentPrefs,
    setStudentPrefs,
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

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col font-sans transition-colors">
      <ScrollToTop />
      <Routes>
        <Route
          path={ROUTES.LANDING}
          element={
            <LandingRoute
              savedCount={savedJobIds.length}
              theme={theme}
              onToggleTheme={handleToggleTheme}
            />
          }
        />
        <Route
          path={ROUTES.PORTAL}
          element={
            <PortalRoute
              state={shared}
              onToggleTheme={handleToggleTheme}
              onOpenPreferences={() => setIsPreferenceOpen(true)}
              onOpenSavedJobs={() => setIsSavedJobsOpen(true)}
              onToggleSave={handleToggleSave}
            />
          }
        />
        <Route
          path={ROUTES.MATRIX}
          element={
            <MatrixRoute
              state={shared}
              onToggleTheme={handleToggleTheme}
              onOpenPreferences={() => setIsPreferenceOpen(true)}
              onOpenSavedJobs={() => setIsSavedJobsOpen(true)}
            />
          }
        />
        {/* URL lama / tidak dikenal -> kembali ke landing */}
        <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
      </Routes>

      {/* Preference Drawer / Modal (global, bisa dibuka dari semua URL) */}
      <PreferenceSidebar
        open={isPreferenceOpen}
        onClose={() => setIsPreferenceOpen(false)}
        preferences={studentPrefs}
        onUpdatePreferences={setStudentPrefs}
        studentPresets={students}
        categories={categories}
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
          navigate(`${ROUTES.PORTAL}?job=${encodeURIComponent(job.job_id)}`)
        }}
      />
    </div>
  )
}

// ─── Route: / (Landing page marketing) ───────────────────────────────────────
function LandingRoute({
  savedCount,
  theme,
  onToggleTheme,
}: {
  savedCount: number
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}) {
  const navigate = useNavigate()

  const handleEnterPortal = () => navigate(ROUTES.PORTAL)
  const handleShowMethod = () => {
    document.querySelector('[aria-label="Cara kerja"]')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col font-sans transition-colors">
      <LandingPage
        savedCount={savedCount}
        onEnterPortal={handleEnterPortal}
        onShowMethod={handleShowMethod}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    </div>
  )
}

type SharedState = {
  theme: 'light' | 'dark'
  jobs: CleanJob[]
  students: StudentProfile[]
  loading: boolean
  error: string | null
  studentPrefs: StudentPreferences
  setStudentPrefs: React.Dispatch<React.SetStateAction<StudentPreferences>>
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

// ─── Route: /portal (Job Portal feed) ────────────────────────────────────────
function PortalRoute({
  state,
  onToggleTheme,
  onOpenPreferences,
  onOpenSavedJobs,
  onToggleSave,
}: {
  state: SharedState
  onToggleTheme: () => void
  onOpenPreferences: () => void
  onOpenSavedJobs: () => void
  onToggleSave: (jobId: string) => void
}) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

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
        theme={state.theme}
        onToggleTheme={onToggleTheme}
        activeView="jobs"
        onChangeView={(view) => navigate(view === 'matrix' ? ROUTES.MATRIX : ROUTES.PORTAL)}
        studentPrefs={state.studentPrefs}
        onOpenPreferences={onOpenPreferences}
        savedJobsCount={state.savedJobIds.length}
        onOpenSavedJobs={onOpenSavedJobs}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {state.loading ? (
          <div className="space-y-6" role="status" aria-label="Memuat lowongan">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6 sm:p-8 animate-pulse">
              <div className="h-5 w-2/3 rounded-md bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-3 h-4 w-1/2 rounded-md bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-pulse">
                    <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="mt-3 h-3 w-full rounded bg-zinc-100 dark:bg-zinc-900" />
                  </div>
                ))}
              </div>
              <div className="lg:col-span-7">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 animate-pulse">
                  <div className="h-6 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-lg bg-zinc-100 dark:bg-zinc-900" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <span className="sr-only">Memuat portal lowongan dan modul SPK…</span>
          </div>
        ) : state.error ? (
          <div className="p-6 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-center space-y-3 max-w-md mx-auto my-20">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">{state.error}</h3>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-xs">
              Coba muat ulang
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Banner Hero */}
            <PortalHero
              studentPrefs={state.studentPrefs}
              onOpenPreferences={onOpenPreferences}
              totalJobs={state.jobs.length}
            />

            {/* Filter Bar & Controls */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Left: Search input */}
              <div className="flex-1 max-w-md relative">
                <label htmlFor="portal-search" className="sr-only">Cari lowongan, perusahaan, atau keahlian</label>
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                <input
                  id="portal-search"
                  type="search"
                  placeholder="Cari posisi, perusahaan, atau keahlian…"
                  value={state.searchQuery}
                  onChange={(e) => state.setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100"
                />
              </div>

              {/* Right: Dropdown Filters & Preference button */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Kategori Filter */}
                <label htmlFor="filter-category" className="sr-only">Filter kategori</label>
                <select
                  id="filter-category"
                  value={state.filterCategory}
                  onChange={(e) => state.setFilterCategory(e.target.value)}
                  className="h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 cursor-pointer"
                >
                  <option value="ALL">Semua Kategori</option>
                  {state.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Sistem Kerja Filter */}
                <label htmlFor="filter-mode" className="sr-only">Filter moda kerja</label>
                <select
                  id="filter-mode"
                  value={state.filterWorkSystem}
                  onChange={(e) => state.setFilterWorkSystem(e.target.value)}
                  className="h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 cursor-pointer"
                >
                  <option value="ALL">Semua Moda</option>
                  <option value="Remote">Remote Only</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>

                {/* Urutkan */}
                <label htmlFor="sort-by" className="sr-only">Urutkan lowongan</label>
                <select
                  id="sort-by"
                  value={state.sortBy}
                  onChange={(e) => state.setSortBy(e.target.value as any)}
                  className="h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 cursor-pointer font-medium"
                >
                  <option value="match">Urutkan: Kecocokan SPK</option>
                  <option value="salary-high">Upah Tertinggi</option>
                  <option value="salary-low">Upah Terendah</option>
                  <option value="hours-low">Jam Tersedikit</option>
                </select>

                {/* Tombol Atur Preferensi */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenPreferences}
                  className="text-xs gap-1.5 h-9"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Prioritas SPK
                </Button>
              </div>
            </div>

            {/* Status bar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:justify-between text-xs text-zinc-600 dark:text-zinc-400 px-1" role="status" aria-live="polite">
              <span>
                Menampilkan <strong className="text-zinc-900 dark:text-zinc-100">{state.displayJobs.length}</strong>{' '}
                dari <strong className="text-zinc-900 dark:text-zinc-100">{state.jobs.length}</strong> lowongan untuk{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">{state.studentPrefs.name}</strong>
              </span>
              <span className="text-zinc-500">
                {state.studentPrefs.location} • Rp {state.studentPrefs.minSalary.toLocaleString('id-ID')}/jam • maks {state.studentPrefs.maxHours} jam/mgg
              </span>
            </div>

            {/* Split Master-Detail Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Right Column: detail first on mobile so selection is visible */}
              <div className="lg:col-span-7 order-1 lg:order-2 lg:sticky lg:top-20">
                <JobDetailPane
                  job={state.selectedJob}
                  studentPrefs={state.studentPrefs}
                  isSaved={!!state.selectedJob && state.savedJobIds.includes(state.selectedJob.job_id)}
                  onToggleSave={() => state.selectedJob && onToggleSave(state.selectedJob.job_id)}
                  onOpenPreferences={onOpenPreferences}
                />
              </div>

              {/* Left Column: Job Cards Feed */}
              <div className="lg:col-span-5 order-2 lg:order-1 space-y-3" role="listbox" aria-label="Daftar lowongan terurut SPK" aria-activedescendant={state.selectedJob ? `job-${state.selectedJob.job_id}` : undefined}>
                {state.displayJobs.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    <Building2 className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Tidak ada lowongan yang cocok
                    </p>
                    <p className="text-xs mt-1 text-zinc-500">Coba hapus kata kunci, pilih “Semua Kategori”, atau turunkan target upah di Preferensi.</p>
                    <Button variant="outline" size="sm" className="mt-4 text-xs" onClick={() => { state.setSearchQuery(''); state.setFilterCategory('ALL'); state.setFilterWorkSystem('ALL') }}>
                      Atur ulang filter
                    </Button>
                  </div>
                ) : (
                  state.displayJobs.map((job, i) => (
                    <JobCardItem
                      key={job.job_id}
                      job={job}
                      index={i}
                      isSelected={state.selectedJob?.job_id === job.job_id}
                      onSelect={() => handleSelectJob(job.job_id)}
                      studentPrefs={state.studentPrefs}
                      isSaved={state.savedJobIds.includes(job.job_id)}
                      onToggleSave={(e) => {
                        e.stopPropagation()
                        onToggleSave(job.job_id)
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <PortalFooter onOpenPreferences={onOpenPreferences} />
    </>
  )
}

// ─── Route: /perhitungan-spk (Matriks SPK SMARTER) ────────────────────────────
function MatrixRoute({
  state,
  onToggleTheme,
  onOpenPreferences,
  onOpenSavedJobs,
}: {
  state: SharedState
  onToggleTheme: () => void
  onOpenPreferences: () => void
  onOpenSavedJobs: () => void
}) {
  const navigate = useNavigate()

  return (
    <>
      <PortalHeader
        theme={state.theme}
        onToggleTheme={onToggleTheme}
        activeView="matrix"
        onChangeView={(view) => navigate(view === 'matrix' ? ROUTES.MATRIX : ROUTES.PORTAL)}
        studentPrefs={state.studentPrefs}
        onOpenPreferences={onOpenPreferences}
        savedJobsCount={state.savedJobIds.length}
        onOpenSavedJobs={onOpenSavedJobs}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {state.loading ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 animate-pulse" role="status" aria-label="Memuat modul SPK">
            <div className="h-5 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-3 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900" />
            <span className="sr-only">Memuat modul SPK…</span>
          </div>
        ) : state.error ? (
          <div className="p-6 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-center space-y-3 max-w-md mx-auto my-20">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">{state.error}</h3>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-xs">
              Coba muat ulang
            </Button>
          </div>
        ) : (
          <FullMatrixView
            rankedJobs={state.rankedJobs}
            studentPrefs={state.studentPrefs}
            onOpenPreferences={onOpenPreferences}
            onSelectJobForDetail={(job) => {
              state.setSelectedJobId(job.job_id)
              navigate(`${ROUTES.PORTAL}?job=${encodeURIComponent(job.job_id)}`)
            }}
          />
        )}
      </main>

      <PortalFooter onOpenPreferences={onOpenPreferences} />
    </>
  )
}

export default App
