import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiArrowLeftLine, RiArrowRightLine, RiQuestionLine } from 'react-icons/ri'
import { PortalHeader } from '../PortalHeader'
import { Button } from '../ui/Button'
import { CompanyLogo } from '../CompanyLogo'
import { ConfirmRankModal } from './ConfirmRankModal'
import { PairwiseQuiz } from './PairwiseQuiz'
import { PriorityEditor } from './PriorityEditor'
import { SensitivityPanel } from './SensitivityPanel'
import type { CleanJob, RankedJobResult, StudentProfile } from '../../types/data'
import type { StudentPreferences } from '../../types/portal'
import type { CriterionKey, Ranks } from '../../types/priority'
import { saveSession } from '../../types/priority'
import { strictRanks } from '../../lib/priority'
import { computeLeaderScenarios } from '../../lib/sensitivity'
import { computeSPKForCustomStudent } from '../../lib/spk'
import type { TfidfArtifact } from '../../lib/spk'
import { formatRupiah } from '../../lib/utils'
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
}

const STEPS = ['Profil', 'Prioritas', 'Hasil']

// ─── Opsi Google Form survei (Q3–Q7) ─────────────────────────────────────────

const Q3_OPTIONS = [
  { value: 'Jakarta Barat', label: 'Jakarta Barat', hint: 'Grogol, Kebon Jeruk, Tanjung Duren, Palmerah, Kembangan, dsb.' },
  { value: 'Jakarta Pusat', label: 'Jakarta Pusat', hint: 'Gambir, Menteng, Tanah Abang, Senen, dsb.' },
  { value: 'Jakarta Selatan', label: 'Jakarta Selatan', hint: 'Kebayoran, Mampang, Setiabudi, Pasar Minggu, dsb.' },
  { value: 'Jakarta Timur', label: 'Jakarta Timur', hint: 'Jatinegara, Matraman, Duren Sawit, Cakung, dsb.' },
  { value: 'Jakarta Utara', label: 'Jakarta Utara', hint: 'Penjaringan, Kelapa Gading, Pluit, Pademangan, dsb.' },
  { value: 'Tangerang Selatan', label: 'Tangerang / Tangerang Selatan / BSD / Serpong' },
  { value: 'Depok', label: 'Depok / Bogor' },
  { value: 'Bekasi', label: 'Bekasi' },
]

const Q4_OPTIONS = [
  { value: 'Education & Tutoring', label: 'Education & Tutoring', hint: 'Guru les privat, asisten bimbel, tutor belajar' },
  { value: 'Food & Beverage (F&B)', label: 'Food & Beverage / F&B', hint: 'Barista, crew kafe/restoran, helper dapur' },
  { value: 'Retail & Store Operations', label: 'Retail & Store Operations', hint: 'Kasir toko, pramuniaga/store crew, staf operasional toko' },
  { value: 'Marketing & Sales', label: 'Marketing & Sales', hint: 'Promotor produk, sales lapangan/event, direct sales' },
  { value: 'Content & Media', label: 'Content & Media', hint: 'Host live streaming TikTok/Shopee, content writer, penerjemah' },
  { value: 'Design & Creative', label: 'Design & Creative', hint: 'Desain grafis, editor video, konten visual' },
  { value: 'Admin & Office Support', label: 'Admin & Office Support', hint: 'Input data, rekap berkas, admin chat/dokumen' },
  { value: 'Customer Service & Support', label: 'Customer Service & Support', hint: 'Layanan chat pelanggan, front desk, helpdesk' },
  { value: 'Logistics & Delivery', label: 'Logistics & Delivery', hint: 'Sortir/packing gudang, kurir pengiriman' },
  { value: 'IT & Software', label: 'IT & Software', hint: 'Junior web/mobile developer, IT support, technical assistant' },
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
      className={`emil-press flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer text-xs ${
        checked
          ? 'border-[#0C52EE] bg-[#0C52EE]/[0.04]'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onPick}
        className="mt-0.5 accent-[#0C52EE]"
      />
      <span className="min-w-0">
        <span className={`block font-medium ${checked ? 'text-[#0C52EE]' : 'text-slate-700'}`}>
          {label}
        </span>
        {hint && <span className="block text-[11px] text-slate-400 font-light mt-0.5">{hint}</span>}
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
        <p className="text-base sm:text-lg font-medium text-slate-900 leading-snug">
          {title}
        </p>
        {desc && <p className="text-xs text-slate-400 font-light mt-1">{desc}</p>}
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
  onOpenPreferences,
  onOpenSavedJobs,
  savedJobsCount,
  tfidf,
}: Props) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  // Sub-langkah profil: satu pertanyaan satu layar (0=Q3 … 5=Q8)
  const [qIndex, setQIndex] = useState(0)
  // Jawaban GForm mentah (Q6a/Q6b/Q7) — null = belum dijawab (wajib diisi semua)
  const [days, setDays] = useState<number | null>(null)
  const [hoursPerDay, setHoursPerDay] = useState<number | null>(null)
  const [monthly, setMonthly] = useState<number | null>(null)
  // Pilihan eksplisit Q3/Q4/Q5 (prefs punya nilai default global, jadi sudah/belum jawab dilacak terpisah)
  const [picked, setPicked] = useState({ q3: false, q4: false, q5: false })
  const mark = (k: 'q3' | 'q4' | 'q5') => setPicked((p) => ({ ...p, [k]: true }))
  const jamIdeal = days !== null && hoursPerDay !== null ? jamIdealPerMinggu(days, hoursPerDay) : null
  const hourly = monthly !== null && jamIdeal !== null ? perJam(monthly, jamIdeal) : null
  const timeSummary =
    days !== null && hoursPerDay !== null ? `${days} hari × ${hoursPerDay} jam` : ''
  const paySummary =
    monthly !== null && jamIdeal !== null
      ? `(Rp ${monthly.toLocaleString('id-ID')}/bulan ÷ ${jamIdeal * 4} jam/bulan)`
      : ''
  /** Tiap layar profil wajib dijawab sebelum bisa Lanjut. */
  const screenValid =
    qIndex === 0 ? picked.q3
    : qIndex === 1 ? picked.q4
    : qIndex === 2 ? picked.q5
    : qIndex === 3 ? jamIdeal !== null
    : qIndex === 4 ? monthly !== null
    : studentPrefs.skills.trim().length > 0
  const [initialRanks, setInitialRanks] = useState<Ranks | null>(null)
  const [finalRanks, setFinalRanks] = useState<Ranks | null>(null)
  // Draf susunan user di langkah Prioritas + centang konfirmasi (wajib sebelum lanjut)
  const [draftRanks, setDraftRanks] = useState<Ranks>(DEFAULT_DRAFT)
  const [confirmed, setConfirmed] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)

  const activeRanks = finalRanks ?? initialRanks

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
    // Kuesioner selesai sampai hasil -> profil user dianggap terisi,
    // skor % kecocokan & matriks boleh ditampilkan.
    set('profileComplete', true)
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

  /** Ranking disetujui dari modal: kunci susunan, simpan sesi, lalu tampilkan hasil. */
  const confirmRanks = () => {
    const ranks = { ...draftRanks }
    applyRanks(ranks)
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
  }

  /** Kuis pilihan paksa → isi draf (user tetap bisa mengubah sebelum konfirmasi). */
  const finishQuiz = (points: Record<CriterionKey, number>) => {
    setDraftRanks(strictRanks(points))
    setConfirmed(true)
    setQuizOpen(false)
  }

  const set = <K extends keyof StudentPreferences>(k: K, v: StudentPreferences[K]) =>
    setStudentPrefs((p) => ({ ...p, [k]: v }))

  return (
    <>
      <PortalHeader
        mode="user"
        activeView="kuesioner"
        studentPrefs={studentPrefs}
        onOpenPreferences={onOpenPreferences}
        savedJobsCount={savedJobsCount}
        onOpenSavedJobs={onOpenSavedJobs}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 mt-0.5">
            Isi profil, susun prioritas, lihat rekomendasi
          </h1>
          <p className="text-xs text-slate-500 font-light mt-1">
            {step === 0
              ? 'Jawabanmu dipakai menghitung upah/jam & jam ideal, lalu dipakai di rekomendasi. Jawab satu per satu — 6 pertanyaan, semua wajib diisi.'
              : step === 1
                ? 'Susun ranking kriteria 1–5 versimu — ini murni pilihanmu, bukan tebakan sistem.'
                : 'Rekomendasi dihitung dari ranking pilihanmu (SMARTER + ROC) yang sudah kamu konfirmasi.'}
          </p>
        </div>

        {/* Stepper sederhana */}
        <ol className="flex items-center gap-1.5" aria-label="Langkah kuesioner">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-1.5 flex-1">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 flex-1 rounded-lg border px-3 py-2 text-xs transition-colors ${
                  i === step
                    ? 'border-[#0C52EE] bg-[#0C52EE]/5 font-medium text-[#0C52EE]'
                    : i < step
                      ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      : 'border-slate-200 bg-white text-slate-400'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-mono ${
                    i === step ? 'bg-[#0C52EE] text-white' : i < step ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {i + 1}
                </span>
                {label}
              </button>
              {i < STEPS.length - 1 && <span className="text-slate-300">›</span>}
            </li>
          ))}
        </ol>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 animate-pulse">
            <div className="h-5 w-1/2 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-2/3 rounded bg-slate-100" />
          </div>
        ) : (
          <>
            {/* STEP 0 — Profil ala Google Form (Q3–Q8) */}
            {step === 0 && (
              <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-5">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
                    <span>Pertanyaan {qIndex + 1} dari 6</span>
                    <span className="tabular-nums">{Math.round(((qIndex + 1) / 6) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="emil-meter h-full bg-[#0C52EE] rounded-full" style={{ width: `${((qIndex + 1) / 6) * 100}%` }} />
                  </div>
                </div>

                <div key={qIndex} className="emil-detail-swap">
                {qIndex === 0 && (<QBlock title="Di area mana Anda tinggal saat ini?">
                  <div className="grid grid-cols-1 gap-1.5">
                    {Q3_OPTIONS.map((o) => (
                      <RadioOption
                        key={o.value}
                        name="q3"
                        label={o.label}
                        hint={o.hint}
                        checked={picked.q3 && studentPrefs.location === o.value}
                        onPick={() => { set('location', o.value); mark('q3') }}
                      />
                    ))}
                  </div>
                </QBlock>)}
                {qIndex === 1 && (<QBlock title="Bidang pekerjaan part-time apa yang paling Anda minati?">
                  <select
                    aria-label="Bidang pekerjaan yang diminati"
                    value={picked.q4 ? studentPrefs.preferredCategory : ''}
                    onChange={(e) => { set('preferredCategory', e.target.value); mark('q4') }}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:border-[#0C52EE]"
                  >
                    <option value="" disabled>Pilih satu bidang…</option>
                    {Q4_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label} — {o.hint}
                      </option>
                    ))}
                  </select>
                </QBlock>)}
                {qIndex === 2 && (<QBlock title="Sistem kerja part-time seperti apa yang Anda harapkan?">
                  <div className="grid grid-cols-1 gap-1.5">
                    {Q5_OPTIONS.map((o) => (
                      <RadioOption
                        key={o.value}
                        name="q5"
                        label={o.value}
                        hint={o.hint}
                        checked={picked.q5 && studentPrefs.workSystem === o.value}
                        onPick={() => { set('workSystem', o.value as StudentPreferences['workSystem']); mark('q5') }}
                      />
                    ))}
                  </div>
                </QBlock>)}
                {qIndex === 3 && (<>
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
                    <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-light" aria-live="polite">
                      Jam idealmu ≈ <span className="font-medium text-slate-900">{jamIdeal} jam/minggu</span>
                      <span className="text-slate-400"> ({timeSummary})</span>.
                      Makin dekat jam lowongan ke angka ini, makin cocok.
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg px-3 py-2 font-light">
                      Pilih hari dan jam di atas — jam idealmu dihitung otomatis di sini.
                    </p>
                  )}
                </QBlock>
                </>)}
                {qIndex === 4 && (<QBlock title="Berapa banyak upah / gaji yang Anda harapkan per bulan?">
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
                    <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-light" aria-live="polite">
                      ≈ <span className="font-medium text-slate-900">Rp {hourly.toLocaleString('id-ID')}/jam</span>
                      <span className="text-slate-400"> {paySummary}</span>.
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg px-3 py-2 font-light">
                      Pilih rentang upah di atas — hasil per jamnya muncul di sini.
                    </p>
                  )}
                </QBlock>)}
                {qIndex === 5 && (<QBlock title="Tuliskan skills apa saja yang Anda miliki saat ini:">
                  <textarea
                    aria-label="Keahlian yang dimiliki"
                    rows={3}
                    value={studentPrefs.skills}
                    onChange={(e) => set('skills', e.target.value)}
                    placeholder="Contoh: Canva, komunikasi ramah, kemampuan bekerja sama"
                    className="w-full rounded-md border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-[#0C52EE]"
                  />
                  <p className="text-[11px] text-slate-400 font-light">
                    Contoh: "Microsoft Excel, pengetikan cepat, rekap data teliti" atau "Espresso machine, manual brewing, hospitality".
                  </p>
                </QBlock>)}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {qIndex > 0 ? (
                    <button
                      onClick={() => setQIndex((i) => i - 1)}
                      className="emil-press inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:text-slate-900"
                    >
                      <RiArrowLeftLine className="h-3.5 w-3.5" /> Kembali
                    </button>
                  ) : (
                    <span />
                  )}
                  <div className="text-right space-y-1.5">
                    {!screenValid && (
                      <p className="text-[11px] font-light text-[#ED1E79]">
                        {qIndex === 5 ? 'Tulis minimal 1 skill untuk lanjut.' : 'Wajib diisi — pilih salah satu untuk lanjut.'}
                      </p>
                    )}
                    {qIndex < 5 ? (
                      <Button size="sm" onClick={() => setQIndex((i) => i + 1)} disabled={!screenValid} className="text-xs gap-1.5">
                        Lanjut <RiArrowRightLine className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={goToPriority}
                        disabled={!screenValid}
                        className="text-xs gap-1.5"
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
                    <h2 className="text-sm font-medium text-slate-900">Urutkan dari yang paling penting buatmu</h2>
                    <p className="text-xs text-slate-500 font-light mt-0.5">
                      Urutan di bawah hanya contoh — geser rank-nya sampai sesuai versimu.
                    </p>
                  </div>
                  <button
                    onClick={() => setQuizOpen(true)}
                    className="emil-press shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:border-[#0C52EE] hover:text-[#0C52EE]"
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

                <label className="emil-press flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 cursor-pointer text-xs shadow-2xs">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#0C52EE]"
                  />
                  <span className="text-slate-700 font-light">
                    <span className="font-medium text-slate-900">Urutan ini sudah sesuai prioritas saya.</span>
                  </span>
                </label>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setStep(0)}
                    className="text-xs text-slate-500 hover:text-slate-900 underline"
                  >
                    Kembali ke profil
                  </button>
                  <Button size="sm" onClick={showResult} disabled={!confirmed} className="text-xs gap-1.5">
                    Lihat rekomendasi <RiArrowRightLine className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </section>
            )}

            {/* STEP 2 — Hasil */}
            {step === 2 && activeRanks && (
              <section className="space-y-4">
                {/* Top 3 */}
                <div className="space-y-2.5">
                  <div>
                    <h2 className="text-sm font-medium text-slate-900">Top 3 pekerjaan part-time untukmu</h2>
                    <p className="text-xs text-slate-500 font-light mt-0.5">
                      Diurutkan dari yang paling cocok, berdasarkan jawaban profil dan ranking prioritas yang sudah kamu isi.
                    </p>
                  </div>
                  {ranked.slice(0, 3).map((job, i) => (
                    <article key={job.job_id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0C52EE] text-white text-xs font-medium">
                        {i + 1}
                      </span>
                      <CompanyLogo companyName={job.company_name} logoUrl={job.company_logo} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900 truncate">{job.job_title}</div>
                        <div className="text-[11px] text-slate-500 font-light truncate">
                          {job.company_name} • {job.work_job_location} • {formatRupiah(job.work_salaryperhour)}/jam
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="emil-meter h-full bg-[#0C52EE] rounded-full" style={{ width: `${Math.min(100, job.finalScore * 100)}%` }} />
                          </div>
                          <span className="text-[11px] font-mono font-medium text-slate-700 tabular-nums">
                            {job.finalScore.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                  {ranked.length === 0 && (
                    <p className="text-xs text-slate-500">Belum ada lowongan yang bisa dihitung.</p>
                  )}
                </div>

                <SensitivityPanel scenarios={scenarios} />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button onClick={() => setStep(0)} className="text-xs text-slate-500 hover:text-slate-900 underline">
                    Ulangi isi profil
                  </button>
                  <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.PORTAL)} className="text-xs">
                    Lihat semua di portal
                  </Button>
                </div>
              </section>
            )}
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
    </>
  )
}
