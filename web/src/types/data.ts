export interface CleanJob {
  job_id: string
  job_title: string
  company_name: string
  company_logo?: string
  job_category: string
  work_salaryperhour: number
  work_job_location: string
  work_hours: number
  work_system: string
  work_system_encoded: number
  work_required_skills: string
  clean_required_skills: string
  source_portal: string
  url: string
  date_posted: string
}

export interface StudentProfile {
  student_id: string
  student_name: string
  student_job_category: string
  preferred_category: string
  min_expected_salary: number
  student_location: string
  student_expected_work_hour: number
  preferred_work_system: string
  student_skills: string
  student_location_clean: string
  clean_student_skills: string
}

export interface DecisionMatrixRow {
  job_id: string
  job_title: string
  company_name: string
  company_logo?: string
  job_category: string
  work_job_location: string
  work_system: string
  work_salaryperhour: number
  work_hours: number
  C1_kategori: number
  C2_rasio_gaji: number
  C3_lokasi: number
  C4_jam_kerja: number
  C5_kemiripan_skill: number
  url?: string
  source_portal?: string
  date_posted?: string
  work_required_skills?: string
  clean_required_skills?: string
}

export interface CriterionInfo {
  id: 'C1' | 'C2' | 'C3' | 'C4' | 'C5'
  code: string
  name: string
  attribute: string
  nature: 'Benefit' | 'Cost'
  formula: string
  description: string
  defaultPriority: number
}

export interface RankedJobResult extends DecisionMatrixRow {
  u1: number
  u2: number
  u3: number
  u4: number
  u5: number
  finalScore: number
  rank: number
}

