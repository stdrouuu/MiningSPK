import {
  RiRefreshLine,
  RiMapPinLine,
  RiCoinsLine,
  RiTimeLine,
  RiBriefcaseLine,
  RiToolsLine,
  RiUserLine,
  RiLockLine,
} from 'react-icons/ri'
import { PriorityEditor } from './kuesioner/PriorityEditor'
import { Button } from './ui/Button'
import { Dialog } from './ui/Dialog'
import { StudentPresetDropdown } from './StudentPresetDropdown'
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
  /** Mode profil: data = dropdown responden GForm; user = kartu kosong + CTA kuesioner. */
  mode: 'user' | 'data'
  onFillQuestionnaire: () => void
}

const LOCATIONS = [
  'Bekasi',
  'Bogor',
  'Depok',
  'Jakarta Barat',
  'Jakarta Pusat',
  'Jakarta Selatan',
  'Jakarta Timur',
  'Jakarta Utara',
  'Remote',
  'Tangerang',
  'Tangerang Selatan',
]

export function PreferenceSidebar({
  open,
  onClose,
  preferences,
  onUpdatePreferences,
  studentPresets,
  categories,
  mode,
  onFillQuestionnaire,
}: PreferenceSidebarProps) {
  // Mode data: nilai preferensi milik responden GForm — form dibekukan (baca-saja).
  const isLocked = mode === 'data'

  const handleChange = <K extends keyof StudentPreferences>(
    key: K,
    val: StudentPreferences[K]
  ) => {
    onUpdatePreferences({
      ...preferences,
      [key]: val,
    })
  }

  // Muat data dari profil contoh mahasiswa
  // workSystem mengikuti clean dataset (preferred_work_system) agar tiap
  // mahasiswa tampil beda (Remote/Hybrid/Onsite), bukan selalu "Semua sistem".
  const normalizeWorkSystem = (
    v: unknown
  ): StudentPreferences['workSystem'] => {
    const s = String(v ?? '').trim().toLowerCase()
    if (s === 'remote') return 'Remote'
    if (s === 'hybrid') return 'Hybrid'
    if (s === 'onsite') return 'Onsite'
    return 'ALL'
  }

  const handleLoadPreset = (s: StudentProfile) => {
    onUpdatePreferences({
      ...preferences,
      name: s.student_name,
      nim: s.student_id,
      major: 'Informatika',
      minSalary: s.min_expected_salary || 35000,
      maxHours: s.student_expected_work_hour || 18,
      location: s.student_location_clean || s.student_location || 'Jakarta Barat',
      workSystem: normalizeWorkSystem(
        (s as StudentProfile).preferred_work_system
      ),
      preferredCategory: s.preferred_category || categories[0],
      skills: s.clean_student_skills || s.student_skills || '',
      avatarSeed: s.student_id,
      // biarkan avatarStyle apa adanya bila user sudah custom? tidak —
      // reset ke otomatis agar tiap mahasiswa beda, user bisa ganti lagi via picker
      avatarStyle: '',
      profileComplete: true,
    })
  }

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
        {mode === 'data' ? (
          /* Mode demo: profil = dropdown data preferensi responden (avatar DiceBear) */
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

            <StudentPresetDropdown
              students={studentPresets}
              selectedId={studentPresets.some((s) => s.student_id === preferences.nim) ? preferences.nim : undefined}
              onSelect={handleLoadPreset}
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light flex items-center gap-1.5">
              <RiLockLine className="h-3 w-3 shrink-0" aria-hidden="true" />
              Form preferensi terkunci — mengikuti data responden yang dipilih.
            </p>
          </div>
        ) : (
          /* Mode user baru: tampilkan status profil & CTA kuesioner */
          <div className="p-3.5 rounded-xl border border-[#0C52EE]/30 bg-[#0C52EE]/[0.04] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <RiUserLine className="h-3.5 w-3.5 text-slate-500" />
                {preferences.name.trim()
                  ? `Profil: ${preferences.name.trim()}`
                  : preferences.profileComplete
                    ? 'Profil kuesioner aktif'
                    : 'Belum ada profil'}
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
            <p className="text-[11px] text-slate-500 font-light">
              {preferences.profileComplete
                ? 'Kamu bisa mengubah preferensi langsung di form bawah, atau mengulangi kuesioner dari awal.'
                : 'Ceritakan preferensimu lewat kuesioner singkat (±3 menit) — hasilnya langsung dipakai menyusun rekomendasi yang pas buatmu.'}
            </p>
            <Button size="sm" onClick={onFillQuestionnaire} className="text-xs w-full">
              {preferences.profileComplete ? 'Ulangi kuesioner' : 'Mulai kuesioner'}
            </Button>
          </div>
        )}

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
              onChange={(e) => {
                const v = e.target.value
                onUpdatePreferences({
                  ...preferences,
                  name: v,
                  // Mengetik nama = profil milik user sendiri -> skor boleh tampil.
                  profileComplete: v.trim() ? true : preferences.profileComplete,
                })
              }}
              disabled={isLocked}
              className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100/80 dark:disabled:bg-slate-900 disabled:text-slate-500 dark:disabled:text-slate-400"
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
              disabled={isLocked}
              className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100 cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-100/80 dark:disabled:bg-slate-900 disabled:text-slate-500 dark:disabled:text-slate-400"
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
                disabled={isLocked}
                className="flex-1 accent-[#0C52EE] cursor-pointer disabled:cursor-not-allowed disabled:accent-slate-300"
                aria-describedby="pref-salary-hint"
              />
              <input
                type="number"
                min={15000}
                max={60000}
                step={1000}
                value={preferences.minSalary}
                onChange={(e) => handleChange('minSalary', Math.min(60000, Math.max(15000, Number(e.target.value) || 15000)))}
                disabled={isLocked}
                aria-label="Target upah per jam dalam rupiah"
                className="w-24 h-8 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100/80 dark:disabled:bg-slate-900 disabled:text-slate-500 dark:disabled:text-slate-400"
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
                disabled={isLocked}
                className="flex-1 accent-[#0C52EE] cursor-pointer disabled:cursor-not-allowed disabled:accent-slate-300"
              />
              <input
                type="number"
                min={8}
                max={30}
                step={1}
                value={preferences.maxHours}
                onChange={(e) => handleChange('maxHours', Math.min(30, Math.max(8, Number(e.target.value) || 8)))}
                disabled={isLocked}
                aria-label="Batas jam kerja per minggu"
                className="w-16 h-8 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100/80 dark:disabled:bg-slate-900 disabled:text-slate-500 dark:disabled:text-slate-400"
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
              disabled={isLocked}
              className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100 cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-100/80 dark:disabled:bg-slate-900 disabled:text-slate-500 dark:disabled:text-slate-400"
            >
              {[...categories]
                .sort((a, b) => a.localeCompare(b, 'id'))
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>

          {/* Sistem Kehadiran Kerja */}
          <div>
            <label htmlFor="pref-system" className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Sistem kerja
            </label>
            <select
              id="pref-system"
              value={preferences.workSystem}
              onChange={(e) => handleChange('workSystem', e.target.value as any)}
              disabled={isLocked}
              className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100 cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-100/80 dark:disabled:bg-slate-900 disabled:text-slate-500 dark:disabled:text-slate-400"
            >
              <option value="ALL">Semua sistem (Hybrid, Onsite, Remote)</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>

        {/* Keahlian Mahasiswa (C5) */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <label htmlFor="pref-skills" className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <RiToolsLine className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              Keahlian Anda (pisahkan koma)
            </label>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 tabular-nums">
              {preferences.skills.length}/300
            </span>
          </div>
          <textarea
            id="pref-skills"
            rows={2}
            maxLength={300}
            value={preferences.skills}
            onChange={(e) => handleChange('skills', e.target.value.slice(0, 300))}
            disabled={isLocked}
            className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100/80 dark:disabled:bg-slate-900 disabled:text-slate-500 dark:disabled:text-slate-400"
            placeholder="Contoh: python, canva, excel, komunikasi, barista, english"
            aria-describedby="pref-skills-hint"
          />
          <span id="pref-skills-hint" className="text-[11px] text-slate-500 block mt-1">
            Dihitung otomatis dengan cosine similarity TF-IDF terhadap deskripsi lowongan.
          </span>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">
            Urutkan kriteria dari yang paling penting buatmu
          </h3>
          <PriorityEditor
            ranks={preferences.priorityRank}
            onChange={(ranks) => handleChange('priorityRank', ranks)}
            onReset={() => handleChange('priorityRank', { ...DEFAULT_STUDENT_PREFERENCES.priorityRank })}
          />
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Batal
          </Button>
          <Button variant="default" size="sm" onClick={onClose} className="text-xs">
            Terapkan &amp; Perbarui Rekomendasi
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
