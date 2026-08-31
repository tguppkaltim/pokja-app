export type UserRole = 'super_admin' | 'sekretariat' | 'operator' | 'viewer'

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
  created_by: string
  created_at: string
}

export type StatusRealisasi = 'terlaksana' | 'tidak_terlaksana'

export interface JadwalKegiatan {
  id: number
  kegiatan_id: number
  /** Tanggal sesi, format YYYY-MM-DD. */
  tanggal: string
  created_at: string
}

export interface RealisasiKegiatan {
  id: number
  kegiatan_id: number
  /** Sesi terjadwal yang dilaporkan. Satu sesi maksimal satu realisasi. */
  jadwal_id: number
  bulan: number
  tahun: number
  status: StatusRealisasi
  tanggal_pelaksanaan: string | null
  catatan: string
  /** Anggaran terpakai pada sesi bulan ini. 0 bila tidak terlaksana. */
  anggaran_aktual: number
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

export type StatusTindakLanjut = 'open' | 'on_progress' | 'closed' | 'dibatalkan'

export interface Rapat {
  id: number
  /** YYYY-MM-DD */
  tanggal: string
  judul: string
  peserta: string
  ringkasan: string
  created_by: string
  created_at: string
}

export interface TindakLanjut {
  id: number
  rapat_id: number
  uraian: string
  /** 'pokja' berarti pic_pokja_id terisi; 'sekretariat' berarti null. */
  pic: 'pokja' | 'sekretariat'
  pic_pokja_id: number | null
  open_date: string
  target_closed: string | null
  /** Dikelola aplikasi: terisi saat status jadi closed, dikosongkan saat dibatalkan. */
  closed_date: string | null
  status: StatusTindakLanjut
  keterangan: string
  /** Path di bucket `evidence`. Opsional. */
  foto_path: string | null
  created_at: string
  updated_at: string | null
}
