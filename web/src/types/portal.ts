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
  /** Gaya avatar DiceBear (https://github.com/dicebear/dicebear). Kosong = otomatis per NIM. */
  avatarStyle: string
  /** Seed avatar DiceBear — default diisi NIM mahasiswa. */
  avatarSeed: string
  /**
   * True bila profil sudah diisi user (selesai kuesioner / isi nama manual).
   * Selama false, semua skor % kecocokan & chip preferensi DISEMBUNYIKAN
   * karena Dihitung dari nilai default, bukan data user (menyesatkan).
   */
  profileComplete: boolean
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
  name: '',
  nim: '',
  major: 'Informatika',
  minSalary: 35000,
  maxHours: 18,
  location: 'Jakarta Barat',
  workSystem: 'ALL',
  preferredCategory: 'Education & Tutoring',
  skills: '',
  avatarStyle: '',
  avatarSeed: '',
  profileComplete: false,
  priorityRank: {
    C1_kategori: 1, // Kategori prioritas 1
    C2_gaji: 2,     // Gaji prioritas 2
    C3_lokasi: 3,   // Lokasi prioritas 3
    C4_jam_kerja: 4,// Jam kerja prioritas 4
    C5_skill: 5,    // Skill prioritas 5
  },
}
