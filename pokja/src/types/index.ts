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
  /** Label ringkas untuk antarmuka, mis. "Pokja I". */
  name: string
  description: string
  /** Nama resmi sesuai master program, mis. "Pembinaan Karakter Keluarga (POKJA I)". */
  nama_lengkap: string
  created_at: string
}

export interface ProgramPokok {
  id: number
  pokja_id: number
  name: string
  /** Daftar indikator dari master. Berbaris banyak; tampilkan apa adanya. */
  indikator: string
  /** Daftar sasaran dari master. Berbaris banyak; tampilkan apa adanya. */
  sasaran: string
  /** Nomor urut baku 10 Program Pokok PKK; 0 bila di luar daftar baku. */
  urutan: number
  /** Tidak ada di master resmi, tapi masih dipakai kegiatan lama. */
  di_luar_master: boolean
  created_at: string
}

export interface ProgramUnggulan {
  id: number
  program_pokok_id: number
  name: string
  /** "Pusat" atau "Daerah". */
  asal: string
  urutan: number
  created_at: string
}

export interface ProgramPrioritas {
  id: number
  program_unggulan_id: number
  name: string
  /** Contoh kegiatan acuan dari master, bukan kegiatan yang direncanakan. */
  contoh_kegiatan: string
  urutan: number
  created_at: string
}

export interface Kegiatan {
  id: number
  pokja_id: number
  program_pokok_id: number
  /**
   * Program Prioritas yang diacu. Nullable karena kegiatan yang dibuat sebelum
   * master program diadopsi belum dipetakan — antarmuka menandainya "belum
   * dipetakan". Kegiatan baru wajib mengisinya.
   */
  program_prioritas_id: number | null
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
  created_at: string
  updated_at: string | null
}

export interface ProgresTindakLanjut {
  id: number
  tindak_lanjut_id: number
  status_baru: StatusTindakLanjut
  catatan: string
  /** Path di bucket `evidence`. Opsional. */
  foto_path: string | null
  dibuat_oleh: string
  created_at: string
}
