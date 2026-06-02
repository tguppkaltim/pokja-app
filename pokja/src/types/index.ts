export type UserRole = 'super_admin' | 'operator' | 'viewer'

export interface User {
  id: string
  full_name: string
  email: string
  role: UserRole
  pokja_id: number | null
  is_active: boolean
  created_at: string
}

export interface Pokja {
  id: number
  name: string
  description: string
  created_at: string
}

export interface ProgramPokok {
  id: number
  pokja_id: number
  name: string
  created_at: string
}

export interface Kegiatan {
  id: number
  pokja_id: number
  program_pokok_id: number
  nama_kegiatan: string
  sasaran: string
  pelaksana: string
  anggaran: number
  tahun: number
  sched_jan: boolean
  sched_feb: boolean
  sched_mar: boolean
  sched_apr: boolean
  sched_mei: boolean
  sched_jun: boolean
  sched_jul: boolean
  sched_agu: boolean
  sched_sep: boolean
  sched_okt: boolean
  sched_nov: boolean
  sched_des: boolean
  created_by: string
  created_at: string
}

export type StatusRealisasi = 'terlaksana' | 'tidak_terlaksana'

export interface RealisasiKegiatan {
  id: number
  kegiatan_id: number
  bulan: number
  tahun: number
  status: StatusRealisasi
  tanggal_pelaksanaan: string | null
  catatan: string
  created_by: string
  created_at: string
  updated_at: string | null
}

export interface EvidenceFile {
  id: number
  realisasi_id: number
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_by: string
  uploaded_at: string
}
