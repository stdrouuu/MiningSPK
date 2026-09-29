export interface StudentPreferences {
  name: string
  nim: string
  major: string
  minSalary: number
  maxHours: number
  location: string
  workSystem: 'ALL' | 'Remote' | 'Hybrid' | 'Onsite'
  preferredCategory: string
  skills: string
  // Prioritas 1 sampai 5 untuk kriteria SPK
  priorityRank: {
    C1_kategori: number
    C2_gaji: number
    C3_lokasi: number
    C4_jam_kerja: number
    C5_skill: number
  }
}

export const DEFAULT_STUDENT_PREFERENCES: StudentPreferences = {
  name: 'David Santoso',
  nim: '412024001',
  major: 'Informatika UKRIDA',
  minSalary: 35000,
  maxHours: 18,
  location: 'Jakarta Barat',
  workSystem: 'ALL',
  preferredCategory: 'Education & Tutoring',
  skills: 'hospitality, espresso machine, manual brew, kebersihan bar, pelayanan ramah, komunikasi',
  priorityRank: {
    C1_kategori: 1, // Kategori prioritas 1
    C2_gaji: 2,     // Gaji prioritas 2
    C3_lokasi: 3,   // Lokasi prioritas 3
    C4_jam_kerja: 4,// Jam kerja prioritas 4
    C5_skill: 5,    // Skill prioritas 5
  },
}
