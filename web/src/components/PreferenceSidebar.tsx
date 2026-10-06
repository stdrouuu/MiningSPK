import { useMemo, useRef, useState } from 'react'
import {
  RiRefreshLine,
  RiMapPinLine,
  RiCoinsLine,
  RiTimeLine,
  RiBriefcaseLine,
  RiToolsLine,
  RiArrowUpDownLine,
  RiUserLine,
  RiDraggable,
  RiArrowUpSLine,
  RiArrowDownSLine,
} from 'react-icons/ri'
import { Button } from './ui/Button'
import { Dialog } from './ui/Dialog'
import type { StudentPreferences } from '../types/portal'
import type { StudentProfile } from '../types/data'
import { DEFAULT_STUDENT_PREFERENCES } from '../types/portal'

interface PreferenceSidebarProps {
  open: boolean
  onClose: () => void
  preferences: StudentPreferences
  onUpdatePreferences: (newPrefs: StudentPreferences) => void
  studentPresets: StudentProfile[]
  categories: string[]
}

const LOCATIONS = [
  'Jakarta Barat',
  'Jakarta Selatan',
  'Jakarta Pusat',
  'Jakarta Timur',
  'Jakarta Utara',
  'Tangerang',
  'Tangerang Selatan',
  'Bekasi',
  'Depok',
  'Bogor',
  'Remote',
]

export function PreferenceSidebar({
  open,
  onClose,
  preferences,
  onUpdatePreferences,
  studentPresets,
  categories,
}: PreferenceSidebarProps) {
  const handleChange = <K extends keyof StudentPreferences>(
    key: K,
    val: StudentPreferences[K]
  ) => {
    onUpdatePreferences({
      ...preferences,
      [key]: val,
    })
  }

  // Drag-to-reorder untuk prioritas kriteria (urutan atas = Prioritas 1)
  const dragFromRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return
    const orderedKeys = [...priorityLabels]
      .sort(
        (a, b) => preferences.priorityRank[a.key] - preferences.priorityRank[b.key]
      )
      .map((item) => item.key)
    const [moved] = orderedKeys.splice(fromIndex, 1)
    orderedKeys.splice(toIndex, 0, moved)
    const nextRanks = { ...preferences.priorityRank }
    orderedKeys.forEach((key, idx) => {
      nextRanks[key] = idx + 1
    })
    handleChange('priorityRank', nextRanks)
  }

  const moveRank = (
    criterionKey: keyof StudentPreferences['priorityRank'],
    direction: -1 | 1
  ) => {
    const orderedKeys = [...priorityLabels]
      .sort(
        (a, b) => preferences.priorityRank[a.key] - preferences.priorityRank[b.key]
      )
      .map((item) => item.key)
    const fromIndex = orderedKeys.indexOf(criterionKey)
    const toIndex = fromIndex + direction
    if (toIndex < 0 || toIndex >= orderedKeys.length) return
    handleReorder(fromIndex, toIndex)
  }

  // Muat data dari profil contoh mahasiswa
  const handleLoadPreset = (studentId: string) => {
    if (studentId === 'custom') return
    const s = studentPresets.find((item) => item.student_id === studentId)
    if (!s) return

    onUpdatePreferences({
      ...preferences,
      name: s.student_name,
      nim: s.student_id,
      major: 'Informatika',
      minSalary: s.min_expected_salary || 35000,
      maxHours: s.student_expected_work_hour || 18,
      location: s.student_location_clean || s.student_location || 'Jakarta Barat',
      preferredCategory: s.preferred_category || categories[0],
      skills: s.clean_student_skills || s.student_skills || '',
    })
  }

  const priorityLabels: Array<{
    key: keyof StudentPreferences['priorityRank']
    title: string
    code: string
  }> = [
    { key: 'C1_kategori', title: 'Kesesuaian Bidang Kategori', code: 'C1' },
    { key: 'C2_gaji', title: 'Tawaran Upah / Jam (Gaji)', code: 'C2' },
    { key: 'C3_lokasi', title: 'Kedekatan Lokasi & Moda Kerja', code: 'C3' },
    { key: 'C4_jam_kerja', title: 'Beban Jam Kerja per Minggu', code: 'C4' },
    { key: 'C5_skill', title: 'Kecocokan Keahlian (Skill Cosine)', code: 'C5' },
  ]

  const rocWeightsMap: { [rank: number]: string } = {
    1: '45.7%',
    2: '25.7%',
    3: '15.7%',
    4: '9.0%',
    5: '4.0%',
  }

  // Urutan tampil = urutan prioritas (index 0 = Prioritas 1)
  const orderedPriorities = useMemo(
    () =>
      [...priorityLabels].sort(
        (a, b) => preferences.priorityRank[a.key] - preferences.priorityRank[b.key]
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preferences.priorityRank]
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Atur Preferensi Mahasiswa & Prioritas SPK"
      className="max-w-2xl"
    >
      <div className="space-y-6 text-sm text-slate-900 dark:text-slate-100">
        <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Profil mahasiswa
        </h3>
        {/* Preset Selector */}
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <RiUserLine className="h-3.5 w-3.5 text-slate-500" />
              Gunakan Profil Contoh Mahasiswa:
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdatePreferences(DEFAULT_STUDENT_PREFERENCES)}
              className="text-[11px] h-7 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 gap-1"
            >
              <RiRefreshLine className="h-3 w-3" /> Reset
            </Button>
          </div>

          <select
            id="pref-preset"
            onChange={(e) => handleLoadPreset(e.target.value)}
            className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100"
          >
            <option value="custom">-- Input Kustom Mahasiswa Baru --</option>
            {studentPresets.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.student_name} ({s.student_id}) — Minat: {s.preferred_category} • {s.student_location_clean}
              </option>
            ))}
          </select>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nama Mahasiswa */}
          <div>
            <label htmlFor="pref-name" className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Nama mahasiswa
            </label>
            <input
              id="pref-name"
              type="text"
              value={preferences.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100"
              placeholder="Contoh: Brandon Jeremiah"
              autoComplete="name"
            />
          </div>

          {/* Lokasi Domisili (C3) */}
          <div>
            <label htmlFor="pref-location" className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
              <RiMapPinLine className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              Domisili
            </label>
            <select
              id="pref-location"
              value={preferences.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100 cursor-pointer"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Ekspektasi Upah Minimal / Jam (C2) */}
          <div>
            <div className="flex justify-between items-center gap-2 mb-1">
              <label htmlFor="pref-salary" className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <RiCoinsLine className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                Target upah / jam
              </label>
              <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 whitespace-nowrap" aria-live="polite">
                Rp {preferences.minSalary.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="pref-salary"
                type="range"
                min="15000"
                max="60000"
                step="1000"
                value={preferences.minSalary}
                onChange={(e) => handleChange('minSalary', parseInt(e.target.value))}
                className="flex-1 accent-[#0C52EE] cursor-pointer"
                aria-describedby="pref-salary-hint"
              />
              <input
                type="number"
                min={15000}
                max={60000}
                step={1000}
                value={preferences.minSalary}
                onChange={(e) => handleChange('minSalary', Math.min(60000, Math.max(15000, Number(e.target.value) || 15000)))}
                aria-label="Target upah per jam dalam rupiah"
                className="w-24 h-8 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100"
              />
            </div>
            <span id="pref-salary-hint" className="sr-only">Rentang 15 ribu sampai 60 ribu rupiah per jam</span>
          </div>

          {/* Beban Jam Kerja Maksimal (C4) */}
          <div>
            <div className="flex justify-between items-center gap-2 mb-1">
              <label htmlFor="pref-hours" className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <RiTimeLine className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                Batas jam / minggu
              </label>
              <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 whitespace-nowrap" aria-live="polite">
                {preferences.maxHours} jam
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="pref-hours"
                type="range"
                min="8"
                max="30"
                step="1"
                value={preferences.maxHours}
                onChange={(e) => handleChange('maxHours', parseInt(e.target.value))}
                className="flex-1 accent-[#0C52EE] cursor-pointer"
              />
              <input
                type="number"
                min={8}
                max={30}
                step={1}
                value={preferences.maxHours}
                onChange={(e) => handleChange('maxHours', Math.min(30, Math.max(8, Number(e.target.value) || 8)))}
                aria-label="Batas jam kerja per minggu"
                className="w-16 h-8 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100"
              />
            </div>
          </div>

          {/* Kategori Bidang Minat (C1) */}
          <div>
            <label htmlFor="pref-category" className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
              <RiBriefcaseLine className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              Bidang minat
            </label>
            <select
              id="pref-category"
              value={preferences.preferredCategory}
              onChange={(e) => handleChange('preferredCategory', e.target.value)}
              className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100 cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sistem Kehadiran Kerja */}
          <div>
            <label htmlFor="pref-system" className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Moda kerja
            </label>
            <select
              id="pref-system"
              value={preferences.workSystem}
              onChange={(e) => handleChange('workSystem', e.target.value as any)}
              className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100 cursor-pointer"
            >
              <option value="ALL">Semua moda (Remote, Hybrid, Onsite)</option>
              <option value="Remote">Remote saja</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </div>
        </div>

        {/* Keahlian Mahasiswa (C5) */}
        <div>
          <label htmlFor="pref-skills" className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
            <RiToolsLine className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            Keahlian Anda (pisahkan koma)
          </label>
          <textarea
            id="pref-skills"
            rows={2}
            value={preferences.skills}
            onChange={(e) => handleChange('skills', e.target.value)}
            className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100"
            placeholder="Contoh: python, canva, excel, komunikasi, barista, english"
            aria-describedby="pref-skills-hint"
          />
          <span id="pref-skills-hint" className="text-[11px] text-slate-500 block mt-1">
            Dihitung otomatis dengan cosine similarity TF-IDF terhadap deskripsi lowongan.
          </span>
        </div>

        {/* Prioritas Kriteria SPK (ROC Weights) — drag-to-reorder */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2" role="group" aria-labelledby="roc-legend">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p id="roc-legend" className="text-xs font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <RiArrowUpDownLine className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              Urutan prioritas kriteria (ROC)
            </p>
            <span className="text-[11px] text-slate-500">
              Atas = paling penting • bobot otomatis
            </span>
          </div>

          <div className="space-y-1.5">
            {orderedPriorities.map((item, index) => {
              const currentRank = index + 1
              const weightPct = rocWeightsMap[currentRank] || '0%'
              const isDropTarget = dragOverIndex === index && isDragging

              return (
                <div
                  key={item.key}
                  draggable
                  onDragStart={(e) => {
                    dragFromRef.current = index
                    setIsDragging(true)
                    e.dataTransfer.effectAllowed = 'move'
                    try {
                      e.dataTransfer.setData('text/plain', String(index))
                    } catch {
                      /* abaikan */
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    if (dragOverIndex !== index) setDragOverIndex(index)
                  }}
                  onDragLeave={() => {
                    if (dragOverIndex === index) setDragOverIndex(null)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    const from =
                      dragFromRef.current ??
                      Number(e.dataTransfer.getData('text/plain'))
                    if (!Number.isNaN(from)) handleReorder(from, index)
                    dragFromRef.current = null
                    setDragOverIndex(null)
                    setIsDragging(false)
                  }}
                  onDragEnd={() => {
                    dragFromRef.current = null
                    setDragOverIndex(null)
                    setIsDragging(false)
                  }}
                  className={`emil-press flex items-center gap-2 p-2.5 rounded-lg border text-xs select-none ${
                    isDropTarget
                      ? 'border-dashed border-slate-500 bg-slate-100 dark:bg-slate-800/70 -translate-y-px shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                  }`}
                >
                  {/* Drag handle */}
                  <span
                    title="Seret untuk memindahkan"
                    className="flex h-8 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-grab active:cursor-grabbing touch-none"
                  >
                    <RiDraggable className="h-4 w-4" />
                  </span>

                  {/* Nomor prioritas */}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0C52EE] text-white font-medium text-xs font-mono">
                    {currentRank}
                  </span>

                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="font-mono font-bold text-slate-500 text-[11px] w-6 shrink-0">
                      {item.code}
                    </span>
                    <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-medium text-white bg-[#0C52EE] px-2.5 py-1 rounded-md text-xs shadow-2xs">
                      {weightPct}
                    </span>
                    {/* Fallback tombol untuk mobile / keyboard */}
                    <span className="flex flex-col -space-y-0.5">
                      <button
                        type="button"
                        aria-label={`Naikkan ${item.code}`}
                        disabled={index === 0}
                        onClick={() => moveRank(item.key, -1)}
                        className="p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <RiArrowUpSLine className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Turunkan ${item.code}`}
                        disabled={index === orderedPriorities.length - 1}
                        onClick={() => moveRank(item.key, 1)}
                        className="p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <RiArrowDownSLine className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-slate-500">
            Posisi paling atas = Prioritas 1 (bobot 45.7%). Bobot ROC terhitung otomatis
            dari urutan.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Batal
          </Button>
          <Button variant="default" size="sm" onClick={onClose} className="text-xs">
            Terapkan & Perbarui Rekomendasi
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
