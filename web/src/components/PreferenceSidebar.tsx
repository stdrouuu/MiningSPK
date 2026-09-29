import {
  RotateCcw,
  MapPin,
  Coins,
  Clock,
  Briefcase,
  Wrench,
  ArrowUpDown,
  User,
} from 'lucide-react'
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

  // Handle prioritas kriteria
  const handleRankChange = (
    criterionKey: keyof StudentPreferences['priorityRank'],
    newRank: number
  ) => {
    const currentRanks = { ...preferences.priorityRank }
    const oldRank = currentRanks[criterionKey]
    if (oldRank === newRank) return

    // Cari kriteria yang saat ini memiliki newRank lalu tukar
    const otherKey = (
      Object.keys(currentRanks) as Array<keyof StudentPreferences['priorityRank']>
    ).find((k) => currentRanks[k] === newRank)

    if (otherKey) {
      currentRanks[otherKey] = oldRank
    }
    currentRanks[criterionKey] = newRank

    handleChange('priorityRank', currentRanks)
  }

  // Muat data dari profil mahasiswa UKRIDA (52 responden)
  const handleLoadPreset = (studentId: string) => {
    if (studentId === 'custom') return
    const s = studentPresets.find((item) => item.student_id === studentId)
    if (!s) return

    onUpdatePreferences({
      ...preferences,
      name: s.student_name,
      nim: s.student_id,
      major: 'Informatika UKRIDA',
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Atur Preferensi Mahasiswa & Prioritas SPK"
      className="max-w-2xl"
    >
      <div className="space-y-6 text-sm text-zinc-900 dark:text-zinc-100">
        {/* Preset Selector */}
        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-zinc-500" />
              Gunakan Profil Responden UKRIDA (52 Mahasiswa):
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdatePreferences(DEFAULT_STUDENT_PREFERENCES)}
              className="text-[11px] h-7 px-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
          </div>

          <select
            onChange={(e) => handleLoadPreset(e.target.value)}
            className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
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
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
              Nama Mahasiswa
            </label>
            <input
              type="text"
              value={preferences.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              placeholder="Contoh: Brandon Jeremiah"
            />
          </div>

          {/* Lokasi Domisili (C3) */}
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mb-1">
              <MapPin className="h-3.5 w-3.5 text-zinc-500" />
              Lokasi Domisili Mahasiswa
            </label>
            <select
              value={preferences.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 cursor-pointer"
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
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-zinc-500" />
                Target Upah Minimal
              </label>
              <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">
                Rp {preferences.minSalary.toLocaleString('id-ID')} / jam
              </span>
            </div>
            <input
              type="range"
              min="15000"
              max="60000"
              step="1000"
              value={preferences.minSalary}
              onChange={(e) => handleChange('minSalary', parseInt(e.target.value))}
              className="w-full accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
            />
          </div>

          {/* Beban Jam Kerja Maksimal (C4) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                Target Jam per Minggu
              </label>
              <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">
                {preferences.maxHours} jam / minggu
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="30"
              step="1"
              value={preferences.maxHours}
              onChange={(e) => handleChange('maxHours', parseInt(e.target.value))}
              className="w-full accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
            />
          </div>

          {/* Kategori Bidang Minat (C1) */}
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mb-1">
              <Briefcase className="h-3.5 w-3.5 text-zinc-500" />
              Bidang Industri Minat
            </label>
            <select
              value={preferences.preferredCategory}
              onChange={(e) => handleChange('preferredCategory', e.target.value)}
              className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 cursor-pointer"
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
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
              Sistem Kehadiran
            </label>
            <select
              value={preferences.workSystem}
              onChange={(e) => handleChange('workSystem', e.target.value as any)}
              className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 cursor-pointer"
            >
              <option value="ALL">Semua Sistem (Remote, Hybrid, Onsite)</option>
              <option value="Remote">Remote Only (WFH)</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </div>
        </div>

        {/* Keahlian Mahasiswa (C5) */}
        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mb-1">
            <Wrench className="h-3.5 w-3.5 text-zinc-500" />
            Keahlian & Kemampuan yang Anda Miliki (Skills)
          </label>
          <textarea
            rows={2}
            value={preferences.skills}
            onChange={(e) => handleChange('skills', e.target.value)}
            className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            placeholder="Contoh: python, canva, excel, komunikasi ramah, barista, english"
          />
          <span className="text-[10px] text-zinc-500 block mt-1">
            Keahlian ini akan dihitung derajat kecocokannya dengan teks syarat lowongan via Cosine Similarity (TF-IDF).
          </span>
        </div>

        {/* Prioritas Kriteria SPK (ROC Weights) */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500" />
              Urutan Prioritas Kepentingan Kriteria (Metode ROC)
            </h4>
            <span className="text-[11px] text-zinc-500">1 = Paling Penting, 5 = Terendah</span>
          </div>

          <div className="space-y-1.5">
            {priorityLabels.map((item) => {
              const currentRank = preferences.priorityRank[item.key]
              const weightPct = rocWeightsMap[currentRank] || '0%'

              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-500 text-[11px] w-6">
                      {item.code}
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-zinc-500">
                      Bobot ROC: <strong className="text-zinc-800 dark:text-zinc-200">{weightPct}</strong>
                    </span>

                    <select
                      value={currentRank}
                      onChange={(e) => handleRankChange(item.key, parseInt(e.target.value))}
                      className="h-7 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
                    >
                      <option value={1}>Prioritas 1 (45.7%)</option>
                      <option value={2}>Prioritas 2 (25.7%)</option>
                      <option value={3}>Prioritas 3 (15.7%)</option>
                      <option value={4}>Prioritas 4 (9.0%)</option>
                      <option value={5}>Prioritas 5 (4.0%)</option>
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
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
