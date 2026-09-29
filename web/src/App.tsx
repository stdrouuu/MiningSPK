import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  SlidersHorizontal,
  Loader2,
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

  // View state: 'landing' (marketing) | 'jobs' (Job Portal feed) | 'matrix' (Matriks SPK)
  const [activeView, setActiveView] = useState<'landing' | 'jobs' | 'matrix'>('landing')

  // Filter & search states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [filterWorkSystem, setFilterWorkSystem] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'match' | 'salary-high' | 'salary-low' | 'hours-low'>('match')

  // Active selected job for detail pane
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  // Saved jobs bookmark IDs
  const [savedJobIds, setSavedJobIds] = useState<string[]>([])

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

  const handleEnterPortal = () => setActiveView('jobs')
  const handleShowMethod = () => {
    setActiveView('landing')
    requestAnimationFrame(() => {
      document.querySelector('[aria-label="Cara kerja"]')?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  if (!loading && !error && activeView === 'landing') {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col font-sans transition-colors">
        <LandingPage
          savedCount={savedJobIds.length}
          onEnterPortal={handleEnterPortal}
          onShowMethod={handleShowMethod}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
        {/* Preference Drawer / Modal */}
        <PreferenceSidebar
          open={isPreferenceOpen}
          onClose={() => setIsPreferenceOpen(false)}
          preferences={studentPrefs}
          onUpdatePreferences={setStudentPrefs}
          studentPresets={students}
          categories={categories}
        />

        {/* Saved Jobs Modal */}
        <SavedJobsModal
          open={isSavedJobsOpen}
          onClose={() => setIsSavedJobsOpen(false)}
          savedJobs={savedJobsList}
          onRemoveSaved={handleToggleSave}
          onSelectJob={(job) => {
            setSelectedJobId(job.job_id)
            setActiveView('jobs')
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col font-sans transition-colors">
      {/* Header */}
      <PortalHeader
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activeView={activeView === 'landing' ? 'jobs' : activeView}
        onChangeView={setActiveView}
        studentPrefs={studentPrefs}
        onOpenPreferences={() => setIsPreferenceOpen(true)}
        savedJobsCount={savedJobIds.length}
        onOpenSavedJobs={() => setIsSavedJobsOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-3">
            <Loader2 className="h-8 w-8 text-zinc-900 dark:text-zinc-100 animate-spin" />
            <p className="text-sm text-zinc-500">Memuat portal lowongan dan modul SPK...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-center space-y-2 max-w-md mx-auto my-20">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">{error}</h3>
          </div>
        ) : activeView === 'matrix' ? (
          /* Tampilan Matriks SPK SMARTER */
          <FullMatrixView
            rankedJobs={rankedJobs}
            studentPrefs={studentPrefs}
            onOpenPreferences={() => setIsPreferenceOpen(true)}
            onSelectJobForDetail={(job) => {
              setSelectedJobId(job.job_id)
              setActiveView('jobs')
            }}
          />
        ) : (
          /* Tampilan Utama: Job Portal Feed (Master-Detail Layout ala Shadcn Mail) */
          <div className="space-y-6">
            {/* Banner Hero */}
            <PortalHero
              studentPrefs={studentPrefs}
              onOpenPreferences={() => setIsPreferenceOpen(true)}
              totalJobs={jobs.length}
            />

            {/* Filter Bar & Controls */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Left: Search input */}
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari posisi kerja, perusahaan, atau keahlian..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>

              {/* Right: Dropdown Filters & Preference button */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Kategori Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 cursor-pointer"
                >
                  <option value="ALL">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Sistem Kerja Filter */}
                <select
                  value={filterWorkSystem}
                  onChange={(e) => setFilterWorkSystem(e.target.value)}
                  className="h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 cursor-pointer"
                >
                  <option value="ALL">Semua Moda</option>
                  <option value="Remote">Remote Only</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>

                {/* Urutkan */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 cursor-pointer font-medium"
                >
                  <option value="match">Urutkan: Kecocokan SPK (Match %)</option>
                  <option value="salary-high">Upah Tertinggi</option>
                  <option value="salary-low">Upah Terendah</option>
                  <option value="hours-low">Jam Tersedikit</option>
                </select>

                {/* Tombol Atur Preferensi */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreferenceOpen(true)}
                  className="text-xs gap-1.5 h-9"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Prioritas SPK
                </Button>
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
              <span>
                Menampilkan <strong className="text-zinc-900 dark:text-zinc-100">{displayJobs.length}</strong>{' '}
                lowongan yang dihitung kesesuaiannya terhadap preferensi{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">{studentPrefs.name}</strong>
              </span>
              <span>
                Lokasi: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{studentPrefs.location}</span> • Target: <span className="text-zinc-700 dark:text-zinc-300 font-medium">Rp {studentPrefs.minSalary.toLocaleString('id-ID')}/jam</span>
              </span>
            </div>

            {/* Split Master-Detail Layout (Like Shadcn Mail) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Job Cards Feed (5 cols on lg) */}
              <div className="lg:col-span-5 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {displayJobs.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500">
                    <Building2 className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Tidak ada lowongan yang cocok
                    </p>
                    <p className="text-xs mt-1">Coba sesuaikan kata kunci pencarian atau filter kategori.</p>
                  </div>
                ) : (
                  displayJobs.map((job) => (
                    <JobCardItem
                      key={job.job_id}
                      job={job}
                      isSelected={selectedJob?.job_id === job.job_id}
                      onSelect={() => setSelectedJobId(job.job_id)}
                      studentPrefs={studentPrefs}
                      isSaved={savedJobIds.includes(job.job_id)}
                      onToggleSave={(e) => {
                        e.stopPropagation()
                        handleToggleSave(job.job_id)
                      }}
                    />
                  ))
                )}
              </div>

              {/* Right Column: Sticky Job Detail Pane (7 cols on lg) */}
              <div className="lg:col-span-7 sticky top-20 max-h-[calc(100vh-100px)]">
                <JobDetailPane
                  job={selectedJob}
                  studentPrefs={studentPrefs}
                  isSaved={!!selectedJob && savedJobIds.includes(selectedJob.job_id)}
                  onToggleSave={() => selectedJob && handleToggleSave(selectedJob.job_id)}
                  onOpenPreferences={() => setIsPreferenceOpen(true)}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 mt-16 py-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 upmatch • Sistem Rekomendasi Part-Time Mahasiswa UKRIDA (SMARTER & ROC)</p>
          <div className="flex items-center gap-4 text-zinc-600 dark:text-zinc-400">
            <span>221 Lowongan Terverifikasi</span>
            <span>•</span>
            <span>52 Mahasiswa Teruji</span>
            <span>•</span>
            <button
              onClick={() => setIsPreferenceOpen(true)}
              className="hover:text-zinc-900 dark:hover:text-zinc-100 underline cursor-pointer"
            >
              Atur Kriteria SPK
            </button>
          </div>
        </div>
      </footer>

      {/* Preference Drawer / Modal */}
      <PreferenceSidebar
        open={isPreferenceOpen}
        onClose={() => setIsPreferenceOpen(false)}
        preferences={studentPrefs}
        onUpdatePreferences={setStudentPrefs}
        studentPresets={students}
        categories={categories}
      />

      {/* Saved Jobs Modal */}
      <SavedJobsModal
        open={isSavedJobsOpen}
        onClose={() => setIsSavedJobsOpen(false)}
        savedJobs={savedJobsList}
        onRemoveSaved={handleToggleSave}
        onSelectJob={(job) => {
          setSelectedJobId(job.job_id)
          setActiveView('jobs')
        }}
      />
    </div>
  )
}

export default App
