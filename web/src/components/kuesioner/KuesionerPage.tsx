import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiQuestionLine,
  RiMapPinLine,
  RiInformationLine,
  RiAlertLine,
} from 'react-icons/ri'
import { BrandLogo } from '../BrandLogo'
import { Button } from '../ui/Button'
import { CompanyLogo } from '../CompanyLogo'
import { TopRankMedalBadge } from '../TopRankMedalBadge'
import { useWalkthrough } from '../WalkthroughTour'
import { ConfirmRankModal } from './ConfirmRankModal'
import { JobRadarSearchModal } from './JobRadarSearchModal'
import { PairwiseQuiz } from './PairwiseQuiz'
import { StepperPreview } from './StepperPreview'
import { PriorityEditor } from './PriorityEditor'
import { SensitivityPanel } from './SensitivityPanel'
import { CategoryDropdownVariants } from './CategoryDropdownVariants'
import type { CleanJob, RankedJobResult, StudentProfile } from '../../types/data'
import type { StudentPreferences } from '../../types/portal'
import type { CriterionKey, Ranks } from '../../types/priority'
import { saveSession } from '../../types/priority'
import { strictRanks } from '../../lib/priority'
import { computeLeaderScenarios } from '../../lib/sensitivity'
import { computeSPKForCustomStudent } from '../../lib/spk'
import type { TfidfArtifact } from '../../lib/spk'
import { avatarForPrefs } from '../../lib/avatar'
import { formatRupiah } from '../../lib/utils'
import { jobProximity } from '../../lib/geo'
import { ROUTES } from '../../lib/routes'

interface Props {
  jobs: CleanJob[]
  students: StudentProfile[]
  loading: boolean
  studentPrefs: StudentPreferences
  setStudentPrefs: React.Dispatch<React.SetStateAction<StudentPreferences>>
  onOpenPreferences: () => void
  onOpenSavedJobs: () => void
  savedJobsCount: number
  tfidf?: TfidfArtifact | null
  onViewAllInPortal?: () => void
}

const TOTAL_PROFILE_QUESTIONS = 7
const MAX_SKILL_LENGTH = 300

// ─── Opsi Google Form survei (Q3–Q7) — diurutkan alfabet A–Z ──────────────────

const Q3_OPTIONS = [
  { value: 'Bekasi', label: 'Bekasi', hint: 'Kota Bekasi, Cikarang, Tambun, dsb.' },
  { value: 'Bogor', label: 'Bogor', hint: 'Kota Bogor, Cibinong, Cibubur, dsb.' },
  { value: 'Depok', label: 'Depok', hint: 'Margonda, Cinere, Cimanggis, Pancoran Mas, dsb.' },
  { value: 'Jakarta Barat', label: 'Jakarta Barat', hint: 'Grogol, Kebon Jeruk, Tanjung Duren, Palmerah, Kembangan, dsb.' },
  { value: 'Jakarta Pusat', label: 'Jakarta Pusat', hint: 'Gambir, Menteng, Tanah Abang, Senen, dsb.' },
  { value: 'Jakarta Selatan', label: 'Jakarta Selatan', hint: 'Kebayoran, Mampang, Setiabudi, Pasar Minggu, dsb.' },
  { value: 'Jakarta Timur', label: 'Jakarta Timur', hint: 'Jatinegara, Matraman, Duren Sawit, Cakung, dsb.' },
  { value: 'Jakarta Utara', label: 'Jakarta Utara', hint: 'Penjaringan, Kelapa Gading, Pluit, Pademangan, dsb.' },
  { value: 'Tangerang Selatan', label: 'Tangerang / Tangerang Selatan / BSD / Serpong' },
]

const Q4_OPTIONS = [
  { value: 'Admin & Office Support', label: 'Admin & Office Support', hint: 'Input data, rekap berkas, admin chat/dokumen' },
  { value: 'Content & Media', label: 'Content & Media', hint: 'Host live streaming TikTok/Shopee, content writer, penerjemah' },
  { value: 'Customer Service & Support', label: 'Customer Service & Support', hint: 'Layanan chat pelanggan, front desk, helpdesk' },
  { value: 'Design & Creative', label: 'Design & Creative', hint: 'Desain grafis, editor video, konten visual' },
  { value: 'Education & Tutoring', label: 'Education & Tutoring', hint: 'Guru les privat, asisten bimbel, tutor belajar' },
  { value: 'Food & Beverage (F&B)', label: 'Food & Beverage (F&B)', hint: 'Barista, crew kafe/restoran, helper dapur' },
  { value: 'IT & Software', label: 'IT & Software', hint: 'Junior web/mobile developer, IT support, technical assistant' },
  { value: 'Logistics & Delivery', label: 'Logistics & Delivery', hint: 'Sortir/packing gudang, kurir pengiriman' },
  { value: 'Marketing & Sales', label: 'Marketing & Sales', hint: 'Promotor produk, sales lapangan/event, direct sales' },
  { value: 'Retail & Store Operations', label: 'Retail & Store Operations', hint: 'Kasir toko, pramuniaga/store crew, staf operasional toko' },
]

const Q5_OPTIONS = [
  { value: 'Remote', hint: 'Bekerja online dari rumah / tempat lainnya' },
  { value: 'Hybrid', hint: 'Sebagian online, sebagian hadir ke lokasi' },
  { value: 'Onsite', hint: 'Hadir fisik di tempat kerja / outlet / kantor' },
]

const Q6A_OPTIONS = [
  { value: 1, label: '1 hari / minggu', hint: 'misalnya khusus weekend' },
  { value: 2, label: '2 hari / minggu' },
  { value: 3, label: '3 hari / minggu' },
  { value: 4, label: '4 hari / minggu' },
  { value: 5, label: '5 hari / minggu atau lebih', hint: 'selama tidak mengganggu kuliah' },
]

const Q6B_OPTIONS = [
  { value: 2.5, label: '2 – 3 jam / hari', hint: 'santai, misal sore setelah kuliah' },
  { value: 5, label: '4 – 6 jam / hari', hint: 'sedang / setengah hari' },
  { value: 7.5, label: '7 – 8 jam / hari', hint: 'panjang / mendekati shift penuh' },
]

const Q7_OPTIONS = [
  { value: 750000, label: 'Rp 500rb – Rp 1jt / bulan', hint: 'penghasilan dasar / mengutamakan pengalaman' },
  { value: 1250000, label: 'Rp 1jt – Rp 1,5jt / bulan' },
  { value: 1750000, label: 'Rp 1,5jt – Rp 2jt / bulan' },
  { value: 2250000, label: 'Rp 2jt – Rp 2,5jt / bulan' },
  { value: 2750000, label: 'Di atas Rp 2,5jt / bulan' },
]

/** Jam ideal/minggu = hari × jam/hari, dibatasi 8–30 (rentang model SPK). */
function jamIdealPerMinggu(days: number, hoursPerDay: number): number {
  return Math.min(30, Math.max(8, Math.round(days * hoursPerDay)))
}

/** Upah per jam ≈ target bulanan ÷ (jam ideal × 4 minggu), dibatasi 15–60rb. */
function perJam(monthly: number, jamIdeal: number): number {
  const v = Math.round(monthly / (jamIdeal * 4) / 1000) * 1000
  return Math.min(60000, Math.max(15000, v))
}

function RadioOption({
  name,
  checked,
  onPick,
  label,
  hint,
}: {
  name: string
  checked: boolean
  onPick: () => void
  label: string
  hint?: string
}) {
  return (
    <label
      className={`emil-press flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer text-sm ${checked
        ? 'border-[#0C52EE] dark:border-blue-500 bg-[#0C52EE]/[0.04] dark:bg-blue-500/10'
        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onPick}
        className="mt-0.5 accent-[#0C52EE] dark:accent-blue-500"
      />
      <span className="min-w-0">
        <span className={`block font-medium ${checked ? 'text-[#0C52EE] dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
          {label}
        </span>
        {hint && <span className="block text-xs text-slate-500 dark:text-slate-400 font-light mt-1">{hint}</span>}
      </span>
    </label>
  )
}

function QBlock({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-white leading-snug">
          {title}
        </p>
        {desc && <p className="text-sm text-slate-500 dark:text-slate-400 font-light mt-1">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

/** Urutan awal netral (C1–C5) — hanya contoh, user wajib menyusun ulang + konfirmasi. */
const DEFAULT_DRAFT: Ranks = {
  C1_kategori: 1,
  C2_gaji: 2,
  C3_lokasi: 3,
  C4_jam_kerja: 4,
  C5_skill: 5,
}

function toSpkRank(r: Ranks): StudentPreferences['priorityRank'] {
  return {
    C1_kategori: r.C1_kategori,
    C2_gaji: r.C2_gaji,
    C3_lokasi: r.C3_lokasi,
    C4_jam_kerja: r.C4_jam_kerja,
    C5_skill: r.C5_skill,
  }
}

export function KuesionerPage({
  jobs,
  loading,
  studentPrefs,
  setStudentPrefs,
  tfidf,
  onViewAllInPortal,
}: Props) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [showIntro, setShowIntro] = useState(true)
  const { isOpen: isTourOpen, activeSection: tourSection } = useWalkthrough()
  useEffect(() => {
    if (isTourOpen && tourSection === 'kuesioner') setShowIntro(false)
  }, [isTourOpen, tourSection])
  // Sub-langkah profil: satu pertanyaan satu layar (0=Nama, 1=Q3 … 6=Q8)
  const [qIndex, setQIndex] = useState(0)
  // Jawaban GForm mentah (Q6a/Q6b/Q7) — null = belum dijawab (wajib diisi semua)
  const [days, setDays] = useState<number | null>(null)
  const [hoursPerDay, setHoursPerDay] = useState<number | null>(null)
  const [monthly, setMonthly] = useState<number | null>(null)
  // Pilihan eksplisit Q3/Q4/Q5 (prefs punya nilai default global, jadi sudah/belum jawab dilacak terpisah)
  const [picked, setPicked] = useState({ q3: false, q4: false, q5: false })
  const mark = (k: 'q3' | 'q4' | 'q5') => setPicked((p) => ({ ...p, [k]: true }))
  const jamIdeal = days !== null && hoursPerDay !== null ? jamIdealPerMinggu(days, hoursPerDay) : null
  const rawJamIdeal = days !== null && hoursPerDay !== null ? Math.round(days * hoursPerDay) : null
  const hourly = monthly !== null && jamIdeal !== null ? perJam(monthly, jamIdeal) : null

  // Kisaran upah per jam dari dataset untuk bidang yang dipilih user
  const categorySalaryStats = useMemo(() => {
    if (!studentPrefs.preferredCategory || !jobs.length) return null
    const target = studentPrefs.preferredCategory.trim().toLowerCase()
    const matching = jobs
      .filter((j) => (j.job_category || '').trim().toLowerCase() === target && j.work_salaryperhour > 0)
      .map((j) => j.work_salaryperhour)
      .sort((a, b) => a - b)
    if (!matching.length) return null
    const minHourly = matching[0]
    const maxHourly = matching[matching.length - 1]
    const p75Hourly = matching[Math.min(matching.length - 1, Math.floor(matching.length * 0.75))]
    const avgHourly = Math.round(matching.reduce((a, b) => a + b, 0) / matching.length / 1000) * 1000
    const selectedOpt = Q4_OPTIONS.find((o) => o.value.toLowerCase() === target)
    return {
      category: selectedOpt?.label || studentPrefs.preferredCategory,
      count: matching.length,
      minHourly,
      maxHourly,
      p75Hourly,
      avgHourly,
    }
  }, [jobs, studentPrefs.preferredCategory])

  // Upah per jam mentah (sebelum batas 15–60rb SPK) hanya untuk transparansi catatan perhitungan
  const rawHourly =
    monthly !== null && jamIdeal !== null
      ? Math.round(monthly / (jamIdeal * 4) / 1000) * 1000
      : null

  // Warning di Pertanyaan 6 memakai target per jam final SPK (hourly) agar konsisten dengan kotak ringkasan & halaman Hasil
  const q6AboveMax =
    hourly !== null && categorySalaryStats !== null && hourly > categorySalaryStats.maxHourly
  const q6AboveTypical =
    hourly !== null &&
    categorySalaryStats !== null &&
    hourly > categorySalaryStats.p75Hourly &&
    !q6AboveMax

  // Peringatan pada halaman Hasil bila ekspektasi gaji terlalu tinggi dibanding bidang atau beban kerja
  const resultAboveCategoryRange =
    categorySalaryStats !== null && studentPrefs.minSalary > categorySalaryStats.maxHourly
  const resultLightWorkHighPay =
    categorySalaryStats !== null &&
    studentPrefs.minSalary > categorySalaryStats.p75Hourly &&
    studentPrefs.maxHours <= 12
  /** Tiap layar profil wajib dijawab sebelum bisa Lanjut. */
  const screenValid =
    qIndex === 0 ? studentPrefs.name.trim().length > 0
      : qIndex === 1 ? picked.q3
        : qIndex === 2 ? picked.q4
          : qIndex === 3 ? picked.q5
            : qIndex === 4 ? jamIdeal !== null
              : qIndex === 5 ? monthly !== null
                : studentPrefs.skills.trim().length > 0

  const [initialRanks, setInitialRanks] = useState<Ranks | null>(() =>
    studentPrefs.profileComplete ? { ...studentPrefs.priorityRank } : null
  )
  const [finalRanks, setFinalRanks] = useState<Ranks | null>(() =>
    studentPrefs.profileComplete ? { ...studentPrefs.priorityRank } : null
  )
  // Draf susunan user di langkah Prioritas + centang konfirmasi (wajib sebelum lanjut)
  const [draftRanks, setDraftRanks] = useState<Ranks>(() =>
    studentPrefs.profileComplete ? { ...studentPrefs.priorityRank } : DEFAULT_DRAFT
  )
  const [confirmed, setConfirmed] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [radarOpen, setRadarOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)

  // Gunakan priorityRank dari studentPrefs bila profil sudah selesai agar selalu sinkron 100%
  // dengan halaman Lowongan (/portal) dan Perhitungan (/perhitungan-spk).
  const activeRanks: Ranks | null = studentPrefs.profileComplete
    ? studentPrefs.priorityRank
    : (finalRanks ?? initialRanks)

  const ranked: RankedJobResult[] = useMemo(() => {
    if (!activeRanks || !jobs.length) return []
    return computeSPKForCustomStudent(jobs, {
      ...studentPrefs,
      priorityRank: toSpkRank(activeRanks),
    }, tfidf)
  }, [jobs, studentPrefs, activeRanks, tfidf])

  const scenarios = useMemo(() => {
    if (!activeRanks || !jobs.length) return []
    return computeLeaderScenarios(jobs, studentPrefs, activeRanks, tfidf)
  }, [jobs, studentPrefs, activeRanks, tfidf])

  const applyRanks = (r: Ranks, goToResult = true) => {
    setInitialRanks(r)
    setFinalRanks(r)
    // Kuesioner selesai sampai hasil -> simpan priorityRank pilihan user ke state global
    // dan tandai profil selesai agar halaman Lowongan & Perhitungan menampilkan urutan yang sama persis.
    setStudentPrefs((p) => ({
      ...p,
      priorityRank: toSpkRank(r),
      profileComplete: true,
    }))
    if (goToResult) setStep(2)
  }

  /** Lanjut dari Profil ke Prioritas (sinkronkan jam ideal & upah/jam dulu). */
  const goToPriority = () => {
    if (days === null || hoursPerDay === null || monthly === null) return
    const j = jamIdealPerMinggu(days, hoursPerDay)
    const h = perJam(monthly, j)
    set('maxHours', j)
    set('minSalary', h)
    setStep(1)
  }

  /** Buka modal konfirmasi ranking sebelum hasil dihitung. */
  const showResult = () => setConfirmOpen(true)

  /** Ranking disetujui dari modal: kunci susunan, simpan sesi, jalankan animasi radar map sesuai lokasi user, lalu tampilkan hasil. */
  const confirmRanks = () => {
    const ranks = { ...draftRanks }
    applyRanks(ranks, false)
    saveSession({
      timestamp: new Date().toISOString(),
      profile: {
        minSalary: studentPrefs.minSalary,
        maxHours: studentPrefs.maxHours,
        location: studentPrefs.location,
        preferredCategory: studentPrefs.preferredCategory,
        skills: studentPrefs.skills,
      },
      initialRanks: ranks,
      finalRanks: ranks,
      status: 'accepted_initial',
      editCount: 0,
      top3: computeSPKForCustomStudent(
        jobs,
        { ...studentPrefs, priorityRank: toSpkRank(ranks) },
        tfidf
      ).slice(0, 3).map((j) => j.job_id),
    })
    setConfirmOpen(false)
    setRadarOpen(true)
  }

  /** Kuis pilihan paksa → isi draf (user tetap bisa mengubah sebelum konfirmasi). */
  const finishQuiz = (points: Record<CriterionKey, number>) => {
    setDraftRanks(strictRanks(points))
    setConfirmed(true)
    setQuizOpen(false)
  }

  const set = <K extends keyof StudentPreferences>(k: K, v: StudentPreferences[K]) =>
    setStudentPrefs((p) => ({ ...p, [k]: v }))

  const previewAvatar = avatarForPrefs(studentPrefs)

  return (
    <>
      <main className="flex-1 w-full min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-slate-950">
        {showIntro ? (
          <aside className="relative overflow-hidden px-6 py-7 sm:px-12 md:px-14 md:py-10 flex flex-col min-h-screen">
            <button onClick={() => navigate(ROUTES.LANDING)} className="relative z-10 inline-flex items-center gap-2 self-start text-sm font-medium hover:underline text-[#0C52EE] dark:text-blue-400"><RiArrowLeftLine /> Beranda</button>
            <div className="relative z-10 flex-1 flex flex-col justify-center py-12 md:py-16 w-full max-w-lg mx-auto items-start text-left">
              <BrandLogo textClassName="text-2xl font-medium tracking-tighter text-slate-900 dark:text-white" />
              <h1 className="mt-3 max-w-lg text-3xl sm:text-4xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">Kuesioner: Isi profil untuk dapatkan rekomendasi kerja</h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">Jawab pertanyaan dan urutkan prioritasmu untuk melihat rekomendasi lowongan part-time.</p>
              <Button onClick={() => setShowIntro(false)} className="mt-7 h-11 gap-2 bg-[#0C52EE] hover:bg-[#0942c4] dark:bg-blue-600 dark:hover:bg-blue-500 text-white">
                Mulai kuesioner <RiArrowRightLine className="h-4 w-4" />
              </Button>
            </div>
          </aside>
        ) : (
          <>
            <header className="px-6 pt-7 sm:px-12 md:px-14 md:pt-10">
              <button onClick={() => navigate(ROUTES.LANDING)} className="inline-flex items-center gap-2 text-sm font-medium text-[#0C52EE] hover:underline dark:text-blue-400"><RiArrowLeftLine /> Beranda</button>
            </header>
            <div className="flex flex-1 flex-col w-full min-w-0 px-6 py-10 sm:px-12 lg:px-16">
              <div className="w-full max-w-xl mx-auto my-auto space-y-6">
                <>
                  <StepperPreview step={step} onStep={setStep} />

                  {loading ? (
                    <div data-tour="kuesioner-content" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 animate-pulse">
                      <div className="h-5 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="mt-3 h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800/60" />
                    </div>
                  ) : (
                    <div data-tour="kuesioner-content" className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                      {/* STEP 0 — Profil ala Google Form (Nama + Q3–Q8) */}
                      {step === 0 && (
                        <section className="space-y-6">
                          <div>
                            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                              <span>Pertanyaan {qIndex + 1} dari {TOTAL_PROFILE_QUESTIONS}</span>
                              <span className="tabular-nums">{Math.round(((qIndex + 1) / TOTAL_PROFILE_QUESTIONS) * 100)}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="emil-meter h-full bg-[#0C52EE] dark:bg-blue-500 rounded-full"
                                style={{ width: `${((qIndex + 1) / TOTAL_PROFILE_QUESTIONS) * 100}%` }}
                              />
                            </div>
                          </div>

                          <div key={qIndex} className="emil-detail-swap relative z-20">
                            {qIndex === 0 && (
                              <QBlock
                                title="Siapa nama lengkap atau nama panggilan Anda?"
                                desc="Nama yang Anda masukkan akan langsung terhubung dengan profil di pojok kanan atas website dan sapaan di halaman rekomendasi."
                              >
                                <input
                                  type="text"
                                  aria-label="Nama lengkap atau nama panggilan"
                                  value={studentPrefs.name}
                                  onChange={(e) => set('name', e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && studentPrefs.name.trim().length > 0) {
                                      e.preventDefault()
                                      setQIndex(1)
                                    }
                                  }}
                                  placeholder="Contoh: Brandon Jeremiah"
                                  autoFocus
                                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#0C52EE] dark:focus:border-blue-400"
                                />

                                {/* Pratinjau korelasi profil dengan header website */}
                                <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 p-3 mt-2">
                                  <img
                                    src={previewAvatar}
                                    alt={studentPrefs.name || 'User baru'}
                                    className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 object-cover shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                                      {studentPrefs.name.trim() || 'User baru'}
                                    </div>
                                    <div className="text-[11px] text-[#0C52EE] dark:text-blue-400 font-medium mt-0.5">
                                      {studentPrefs.name.trim()
                                        ? 'Terhubung dengan profil website Anda'
                                        : 'Ketik nama di atas untuk menggantikan "User baru"'}
                                    </div>
                                  </div>
                                </div>
                              </QBlock>
                            )}

                            {qIndex === 1 && (
                              <QBlock title="Di area mana Anda tinggal saat ini?">
                                <div className="grid grid-cols-1 gap-1.5">
                                  {Q3_OPTIONS.map((o) => (
                                    <RadioOption
                                      key={o.value}
                                      name="q3"
                                      label={o.label}
                                      hint={o.hint}
                                      checked={picked.q3 && studentPrefs.location === o.value}
                                      onPick={() => {
                                        set('location', o.value)
                                        mark('q3')
                                      }}
                                    />
                                  ))}
                                </div>
                              </QBlock>
                            )}

                            {qIndex === 2 && (
                              <QBlock title="Bidang pekerjaan part-time apa yang paling Anda minati?">
                                <CategoryDropdownVariants
                                  options={Q4_OPTIONS}
                                  value={picked.q4 ? studentPrefs.preferredCategory : ''}
                                  onChange={(val) => {
                                    set('preferredCategory', val)
                                    mark('q4')
                                  }}
                                />
                                {picked.q4 && categorySalaryStats && (
                                  <div
                                    className="mt-2 flex items-center gap-2 rounded-lg border border-blue-200/80 dark:border-blue-800/70 bg-blue-50/70 dark:bg-blue-950/30 px-3 py-2 text-xs text-slate-700 dark:text-slate-200"
                                    aria-live="polite"
                                  >
                                    <RiInformationLine className="h-4 w-4 text-[#0C52EE] dark:text-blue-400 shrink-0" aria-hidden="true" />
                                    <p className="leading-snug">
                                      Rata-rata gaji <span className="font-medium text-slate-900 dark:text-white">{categorySalaryStats.category}</span>:{' '}
                                      <span className="font-semibold text-slate-900 dark:text-white">
                                        sekitar {formatRupiah(categorySalaryStats.avgHourly)}/jam
                                      </span>
                                    </p>
                                  </div>
                                )}
                              </QBlock>
                            )}

                            {qIndex === 3 && (
                              <QBlock title="Sistem kerja part-time seperti apa yang Anda harapkan?">
                                <div className="grid grid-cols-1 gap-1.5">
                                  {Q5_OPTIONS.map((o) => (
                                    <RadioOption
                                      key={o.value}
                                      name="q5"
                                      label={o.value}
                                      hint={o.hint}
                                      checked={picked.q5 && studentPrefs.workSystem === o.value}
                                      onPick={() => {
                                        set('workSystem', o.value as StudentPreferences['workSystem'])
                                        mark('q5')
                                      }}
                                    />
                                  ))}
                                </div>
                              </QBlock>
                            )}

                            {qIndex === 4 && (
                              <div className="space-y-5">
                                <QBlock title="Dalam seminggu, berapa hari kerja part-time yang Anda harapkan?">
                                  <div className="grid grid-cols-1 gap-1.5">
                                    {Q6A_OPTIONS.map((o) => (
                                      <RadioOption
                                        key={o.value}
                                        name="q6a"
                                        label={o.label}
                                        hint={o.hint}
                                        checked={days === o.value}
                                        onPick={() => setDays(o.value)}
                                      />
                                    ))}
                                  </div>
                                </QBlock>

                                <QBlock title="Berapa jam waktu yang diharapkan untuk bekerja part-time?">
                                  <div className="grid grid-cols-1 gap-1.5">
                                    {Q6B_OPTIONS.map((o) => (
                                      <RadioOption
                                        key={o.value}
                                        name="q6b"
                                        label={o.label}
                                        hint={o.hint}
                                        checked={hoursPerDay === o.value}
                                        onPick={() => setHoursPerDay(o.value)}
                                      />
                                    ))}
                                  </div>
                                  {jamIdeal !== null ? (
                                    <p
                                      className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-light"
                                      aria-live="polite"
                                    >
                                      Target jam kerja:{' '}
                                      <span className="font-medium text-slate-900 dark:text-white">
                                        {rawJamIdeal !== null && rawJamIdeal === jamIdeal ? 'sekitar ' : ''}
                                        {jamIdeal} jam/minggu
                                      </span>
                                      {rawJamIdeal !== null && rawJamIdeal !== jamIdeal && (
                                        <span className="text-slate-400 dark:text-slate-500">
                                          {' '}
                                          ({rawJamIdeal < jamIdeal ? 'batas minimal part-time' : 'batas maksimal part-time'})
                                        </span>
                                      )}
                                      .
                                    </p>
                                  ) : (
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/80 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-light">
                                      Pilih hari dan jam di atas — jam idealmu dihitung otomatis di sini.
                                    </p>
                                  )}
                                </QBlock>
                              </div>
                            )}

                            {qIndex === 5 && (
                              <QBlock title="Berapa banyak upah / gaji yang Anda harapkan per bulan?">
                                <div className="grid grid-cols-1 gap-1.5">
                                  {Q7_OPTIONS.map((o) => (
                                    <RadioOption
                                      key={o.value}
                                      name="q7"
                                      label={o.label}
                                      hint={o.hint}
                                      checked={monthly === o.value}
                                      onPick={() => setMonthly(o.value)}
                                    />
                                  ))}
                                </div>
                                {hourly !== null ? (
                                  <div className="space-y-2" aria-live="polite">
                                    {!((q6AboveMax || q6AboveTypical) && categorySalaryStats) ? (
                                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-light">
                                        Perkiraan upah:{' '}
                                        <span className="font-medium text-slate-900 dark:text-white">
                                          {rawHourly !== null && rawHourly === hourly ? 'sekitar ' : ''}
                                          Rp {hourly.toLocaleString('id-ID')}/jam
                                        </span>
                                        {rawHourly !== null && rawHourly !== hourly && (
                                          <span className="text-slate-400 dark:text-slate-500">
                                            {' '}
                                            ({rawHourly > hourly ? 'batas maksimal pencarian' : 'batas minimal pencarian'})
                                          </span>
                                        )}
                                        .
                                      </p>
                                    ) : (
                                      <div
                                        role="alert"
                                        className="flex items-start gap-2.5 rounded-lg border border-pink-200 dark:border-pink-800/70 bg-pink-50/80 dark:bg-pink-950/35 px-3 py-2.5 text-xs text-[#9d174d] dark:text-pink-100"
                                      >
                                        <RiAlertLine className="h-4 w-4 text-[#ED1E79] dark:text-pink-400 shrink-0 mt-0.5" aria-hidden="true" />
                                        <div className="space-y-0.5 leading-snug">
                                          <p className="font-semibold text-[#b8165f] dark:text-pink-200">
                                            Target gajimu ketinggian
                                          </p>
                                          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#9d174d]/90 dark:text-pink-200/90 font-normal">
                                            {(() => {
                                              const targetLabel =
                                                rawHourly !== null && rawHourly > hourly
                                                  ? `melebihi ${formatRupiah(hourly)}`
                                                  : `sekitar ${formatRupiah(hourly)}`
                                              return (
                                                <>
                                                  <li>
                                                    Targetmu {targetLabel}/jam, di atas rata-rata{' '}
                                                    {categorySalaryStats.category} (sekitar{' '}
                                                    {formatRupiah(categorySalaryStats.avgHourly)}/jam).
                                                  </li>
                                                  <li>Kamu bisa tambah jam kerja atau turunin dikit target gajinya.</li>
                                                </>
                                              )
                                            })()}
                                          </ul>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/80 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-light">
                                    Pilih rentang upah di atas — hasil per jamnya muncul di sini.
                                  </p>
                                )}
                              </QBlock>
                            )}

                            {qIndex === 6 && (
                              <QBlock title="Tuliskan skills apa saja yang Anda miliki saat ini:">
                                <textarea
                                  aria-label="Keahlian yang dimiliki"
                                  rows={3}
                                  maxLength={MAX_SKILL_LENGTH}
                                  value={studentPrefs.skills}
                                  onChange={(e) => set('skills', e.target.value.slice(0, MAX_SKILL_LENGTH))}
                                  placeholder="Contoh: Canva, komunikasi ramah, kemampuan bekerja sama"
                                  className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 p-2.5 text-xs focus:outline-none focus:border-[#0C52EE] dark:focus:border-blue-400"
                                />
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-light">
                                    Contoh: "Microsoft Excel, pengetikan cepat, rekap data teliti" atau "Espresso machine, manual brewing, hospitality".
                                  </p>
                                  <span
                                    className={`shrink-0 text-[11px] font-mono tabular-nums ${studentPrefs.skills.length >= MAX_SKILL_LENGTH
                                      ? 'text-[#ED1E79] dark:text-pink-400 font-medium'
                                      : studentPrefs.skills.length >= MAX_SKILL_LENGTH - 40
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-slate-400 dark:text-slate-500'
                                      }`}
                                  >
                                    {studentPrefs.skills.length}/{MAX_SKILL_LENGTH}
                                  </span>
                                </div>
                              </QBlock>
                            )}
                          </div>

                          <div className="relative z-10 flex items-center justify-between gap-2 pt-1">
                            {qIndex > 0 ? (
                              <button
                                onClick={() => setQIndex((i) => i - 1)}
                                className="emil-press inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                              >
                                <RiArrowLeftLine className="h-3.5 w-3.5" /> Kembali
                              </button>
                            ) : (
                              <button onClick={() => setShowIntro(true)} className="emil-press inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                                <RiArrowLeftLine className="h-3.5 w-3.5" /> Kembali
                              </button>
                            )}
                            <div className="text-right space-y-1.5">
                              {!screenValid && (
                                <p className="text-[11px] font-light text-[#ED1E79] dark:text-pink-400">
                                  {qIndex === 0
                                    ? 'Masukkan nama Anda untuk lanjut.'
                                    : qIndex === TOTAL_PROFILE_QUESTIONS - 1
                                      ? 'Tulis minimal 1 skill untuk lanjut.'
                                      : 'Wajib diisi — pilih salah satu untuk lanjut.'}
                                </p>
                              )}
                              {qIndex < TOTAL_PROFILE_QUESTIONS - 1 ? (
                                <Button
                                  size="sm"
                                  onClick={() => setQIndex((i) => i + 1)}
                                  disabled={!screenValid}
                                  className="text-xs gap-1.5 bg-[#0C52EE] hover:bg-[#0942c4] dark:bg-blue-600 dark:hover:bg-blue-500"
                                >
                                  Lanjut <RiArrowRightLine className="h-3.5 w-3.5" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={goToPriority}
                                  disabled={!screenValid}
                                  className="text-xs gap-1.5 bg-[#0C52EE] hover:bg-[#0942c4] dark:bg-blue-600 dark:hover:bg-blue-500"
                                >
                                  Susun prioritasku <RiArrowRightLine className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </section>
                      )}

                      {/* STEP 1 — Susun ranking sendiri (unik 1–5, tanpa tebakan sistem) */}
                      {step === 1 && (
                        <section className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h2 className="text-sm font-medium text-slate-900 dark:text-white">Urutkan kriteria dari yang paling penting buatmu</h2>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5">
                                Urutan di bawah hanya contoh — geser rank-nya sampai sesuai versimu.
                              </p>
                            </div>
                            <button
                              onClick={() => setQuizOpen(true)}
                              className="emil-press help-attention shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#0C52EE] text-xs font-medium text-white hover:bg-[#0942c4] cursor-pointer"
                            >
                              <RiQuestionLine className="h-3.5 w-3.5" />
                              Saya bingung
                            </button>
                          </div>

                          <PriorityEditor
                            ranks={draftRanks}
                            onChange={(next) => setDraftRanks(next)}
                            onReset={() => {
                              setDraftRanks(DEFAULT_DRAFT)
                              setConfirmed(false)
                            }}
                          />

                          <label className="emil-press flex items-start gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 cursor-pointer text-xs shadow-2xs">
                            <input
                              type="checkbox"
                              checked={confirmed}
                              onChange={(e) => setConfirmed(e.target.checked)}
                              className="mt-0.5 h-4 w-4 accent-[#0C52EE] dark:accent-blue-500"
                            />
                            <span className="text-slate-700 dark:text-slate-300 font-light">
                              <span className="font-medium text-slate-900 dark:text-white">Urutan ini sudah sesuai prioritas saya.</span>
                            </span>
                          </label>

                          <div className="flex items-center justify-between gap-2">
                            <button
                              onClick={() => setStep(0)}
                              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline"
                            >
                              Kembali ke profil
                            </button>
                            <Button size="sm" onClick={showResult} disabled={!confirmed} className="text-xs gap-1.5 bg-[#0C52EE] hover:bg-[#0942c4] dark:bg-blue-600 dark:hover:bg-blue-500">
                              Lihat rekomendasi <RiArrowRightLine className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </section>
                      )}

                      {/* STEP 2 — Hasil */}
                      {step === 2 && activeRanks && (
                        <section className="space-y-4">
                          {(resultAboveCategoryRange || resultLightWorkHighPay) && (
                            <div
                              role="alert"
                              className="flex items-start gap-2.5 rounded-xl border border-pink-200 dark:border-pink-800/70 bg-pink-50/80 dark:bg-pink-950/35 px-3.5 py-3 text-xs text-[#9d174d] dark:text-pink-100"
                            >
                              <RiAlertLine className="h-4 w-4 text-[#ED1E79] dark:text-pink-400 shrink-0 mt-0.5" aria-hidden="true" />
                              <div className="space-y-0.5 leading-snug">
                                <p className="font-semibold text-[#b8165f] dark:text-pink-200">
                                  Target gajimu ketinggian nih
                                </p>
                                <p className="text-[11px] text-[#9d174d]/90 dark:text-pink-200/90 font-normal">
                                  {resultAboveCategoryRange && categorySalaryStats
                                    ? `Target ${formatRupiah(studentPrefs.minSalary)}/jam di atas bayaran normal ${categorySalaryStats.category} (${formatRupiah(categorySalaryStats.minHourly)}–${formatRupiah(categorySalaryStats.maxHourly)}/jam). Tambah jam kerja atau turunin dikit target gajinya ya.`
                                    : `Jam kerjamu tergolong santai (${studentPrefs.maxHours} jam/mgg) tapi targetnya ${formatRupiah(studentPrefs.minSalary)}/jam. Gaji gede butuh kerja lebih ekstra, kalau mau santai bisa turunin target gajinya.`}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Top 3 */}
                          <div className="space-y-2.5">
                            <div>
                              <h2 className="text-sm font-medium text-slate-900 dark:text-white">Top 3 pekerjaan part-time untukmu</h2>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5">
                                Diurutkan dari yang paling cocok, berdasarkan jawaban profil dan ranking prioritas yang sudah kamu isi.
                              </p>
                              <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-200">
                                <RiMapPinLine className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                                <span>
                                  Area pencarianmu:{' '}
                                  <span className="font-semibold text-slate-900 dark:text-white">
                                    {studentPrefs.location || 'Jabodetabek'}
                                  </span>
                                </span>
                              </div>
                            </div>
                            {ranked.slice(0, 3).map((job, i) => {
                              const prox = jobProximity(job, studentPrefs.location).label
                              const locLabel = (job.work_job_location || '').trim() || job.work_system || 'Lokasi fleksibel'
                              return (
                                <article key={job.job_id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs flex items-center gap-3.5">
                                  <TopRankMedalBadge rank={(i + 1) as 1 | 2 | 3} size={28} />
                                  <CompanyLogo
                                    companyName={job.company_name}
                                    logoUrl={job.company_logo}
                                    size="lg"
                                    className="h-12 w-16 object-contain shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{job.job_title}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-light truncate">
                                      {job.company_name} • ±{formatRupiah(job.work_salaryperhour)}/jam
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                                        <RiMapPinLine className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                                        {locLabel}
                                      </span>
                                      {job.work_system && locLabel.toLowerCase() !== job.work_system.toLowerCase() && (
                                        <span className="text-slate-400 dark:text-slate-500">• {job.work_system}</span>
                                      )}
                                      {prox && locLabel.toLowerCase() !== 'remote' && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                          {prox}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        <div className="emil-meter h-full bg-[#0C52EE] dark:bg-blue-500 rounded-full" style={{ width: `${Math.min(100, job.finalScore * 100)}%` }} />
                                      </div>
                                      <span className="text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                                        {Math.round(Math.min(100, Math.max(0, job.finalScore * 100)))}%
                                      </span>
                                    </div>
                                  </div>
                                </article>
                              )
                            })}
                            {ranked.length === 0 && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada lowongan yang bisa dihitung.</p>
                            )}
                          </div>

                          <SensitivityPanel scenarios={scenarios} />

                          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => (onViewAllInPortal ? onViewAllInPortal() : navigate(ROUTES.PORTAL))}
                              className="text-xs dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              Lihat semua di portal
                            </Button>
                          </div>
                        </section>
                      )}
                    </div>
                  )}
                </>
              </div>
            </div>
            <footer className="px-6 pb-7 sm:px-12 md:px-14 md:pb-10">
              <BrandLogo />
            </footer>
          </>
        )}
      </main>

      <PairwiseQuiz open={quizOpen} onClose={() => setQuizOpen(false)} onFinish={finishQuiz} />
      <ConfirmRankModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        ranks={draftRanks}
        onConfirm={confirmRanks}
      />
      <JobRadarSearchModal
        open={radarOpen}
        location={studentPrefs.location}
        userName={studentPrefs.name}
        topJobs={ranked}
        totalJobsCount={jobs.length}
        onComplete={() => {
          setRadarOpen(false)
          setStep(2)
        }}
      />
    </>
  )
}
