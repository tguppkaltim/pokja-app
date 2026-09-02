export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: 'super_admin' | 'sekretariat' | 'operator' | 'viewer'
          pokja_id: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role: 'super_admin' | 'sekretariat' | 'operator' | 'viewer'
          pokja_id?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: 'super_admin' | 'sekretariat' | 'operator' | 'viewer'
          pokja_id?: number | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      pokja: {
        Row: {
          id: number
          name: string
          description: string
          nama_lengkap: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description: string
          nama_lengkap?: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string
          nama_lengkap?: string
          created_at?: string
        }
        Relationships: []
      }
      program_pokok: {
        Row: {
          id: number
          pokja_id: number
          name: string
          indikator: string
          sasaran: string
          urutan: number
          di_luar_master: boolean
          created_at: string
        }
        Insert: {
          id?: number
          pokja_id: number
          name: string
          indikator?: string
          sasaran?: string
          urutan?: number
          di_luar_master?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          pokja_id?: number
          name?: string
          indikator?: string
          sasaran?: string
          urutan?: number
          di_luar_master?: boolean
          created_at?: string
        }
        Relationships: []
      }
      program_unggulan: {
        Row: {
          id: number
          program_pokok_id: number
          name: string
          asal: string
          urutan: number
          created_at: string
        }
        Insert: {
          id?: number
          program_pokok_id: number
          name: string
          asal?: string
          urutan?: number
          created_at?: string
        }
        Update: {
          id?: number
          program_pokok_id?: number
          name?: string
          asal?: string
          urutan?: number
          created_at?: string
        }
        Relationships: []
      }
      program_prioritas: {
        Row: {
          id: number
          program_unggulan_id: number
          name: string
          contoh_kegiatan: string
          urutan: number
          created_at: string
        }
        Insert: {
          id?: number
          program_unggulan_id: number
          name: string
          contoh_kegiatan?: string
          urutan?: number
          created_at?: string
        }
        Update: {
          id?: number
          program_unggulan_id?: number
          name?: string
          contoh_kegiatan?: string
          urutan?: number
          created_at?: string
        }
        Relationships: []
      }
      kegiatan: {
        Row: {
          id: number
          pokja_id: number
          program_pokok_id: number
          program_prioritas_id: number | null
          nama_kegiatan: string
          sasaran: string
          pelaksana: string
          anggaran: number
          tahun: number
          created_by: string
          created_at: string
        }
        Insert: {
          id?: number
          pokja_id: number
          program_pokok_id: number
          program_prioritas_id?: number | null
          nama_kegiatan: string
          sasaran: string
          pelaksana: string
          anggaran: number
          tahun: number
          created_by: string
          created_at?: string
        }
        Update: {
          id?: number
          pokja_id?: number
          program_pokok_id?: number
          program_prioritas_id?: number | null
          nama_kegiatan?: string
          sasaran?: string
          pelaksana?: string
          anggaran?: number
          tahun?: number
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      jadwal_kegiatan: {
        Row: {
          id: number
          kegiatan_id: number
          tanggal: string
          created_at: string
        }
        Insert: {
          id?: number
          kegiatan_id: number
          tanggal: string
          created_at?: string
        }
        Update: {
          id?: number
          kegiatan_id?: number
          tanggal?: string
          created_at?: string
        }
        Relationships: []
      }
      realisasi_kegiatan: {
        Row: {
          id: number
          kegiatan_id: number
          jadwal_id: number
          bulan: number
          tahun: number
          status: 'terlaksana' | 'tidak_terlaksana'
          tanggal_pelaksanaan: string | null
          catatan: string
          anggaran_aktual: number
          created_by: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          kegiatan_id: number
          jadwal_id: number
          bulan: number
          tahun: number
          status: 'terlaksana' | 'tidak_terlaksana'
          tanggal_pelaksanaan?: string | null
          catatan?: string
          anggaran_aktual?: number
          created_by: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          kegiatan_id?: number
          jadwal_id?: number
          bulan?: number
          tahun?: number
          status?: 'terlaksana' | 'tidak_terlaksana'
          tanggal_pelaksanaan?: string | null
          catatan?: string
          anggaran_aktual?: number
          created_by?: string
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rapat: {
        Row: {
          id: number
          tanggal: string
          judul: string
          peserta: string
          ringkasan: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: number
          tanggal: string
          judul: string
          peserta?: string
          ringkasan?: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: number
          tanggal?: string
          judul?: string
          peserta?: string
          ringkasan?: string
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      tindak_lanjut: {
        Row: {
          id: number
          rapat_id: number
          uraian: string
          pic: 'pokja' | 'sekretariat'
          pic_pokja_id: number | null
          open_date: string
          target_closed: string | null
          closed_date: string | null
          status: 'open' | 'on_progress' | 'closed' | 'dibatalkan'
          keterangan: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          rapat_id: number
          uraian: string
          pic: 'pokja' | 'sekretariat'
          pic_pokja_id?: number | null
          open_date?: string
          target_closed?: string | null
          closed_date?: string | null
          status?: 'open' | 'on_progress' | 'closed' | 'dibatalkan'
          keterangan?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          rapat_id?: number
          uraian?: string
          pic?: 'pokja' | 'sekretariat'
          pic_pokja_id?: number | null
          open_date?: string
          target_closed?: string | null
          closed_date?: string | null
          status?: 'open' | 'on_progress' | 'closed' | 'dibatalkan'
          keterangan?: string
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      progres_tindak_lanjut: {
        Row: {
          id: number
          tindak_lanjut_id: number
          status_baru: 'open' | 'on_progress' | 'closed' | 'dibatalkan'
          catatan: string
          foto_path: string | null
          dibuat_oleh: string
          created_at: string
        }
        Insert: {
          id?: number
          tindak_lanjut_id: number
          status_baru: 'open' | 'on_progress' | 'closed' | 'dibatalkan'
          catatan?: string
          foto_path?: string | null
          dibuat_oleh: string
          created_at?: string
        }
        Update: {
          id?: number
          tindak_lanjut_id?: number
          status_baru?: 'open' | 'on_progress' | 'closed' | 'dibatalkan'
          catatan?: string
          foto_path?: string | null
          dibuat_oleh?: string
          created_at?: string
        }
        Relationships: []
      }
      evidence_files: {
        Row: {
          id: number
          realisasi_id: number
          file_name: string
          file_path: string
          file_type: string
          file_size: number
          uploaded_by: string
          uploaded_at: string
        }
        Insert: {
          id?: number
          realisasi_id: number
          file_name: string
          file_path: string
          file_type: string
          file_size: number
          uploaded_by: string
          uploaded_at?: string
        }
        Update: {
          id?: number
          realisasi_id?: number
          file_name?: string
          file_path?: string
          file_type?: string
          file_size?: number
          uploaded_by?: string
          uploaded_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'super_admin' | 'sekretariat' | 'operator' | 'viewer'
      status_tindak_lanjut: 'open' | 'on_progress' | 'closed' | 'dibatalkan'
      status_realisasi: 'terlaksana' | 'tidak_terlaksana'
    }
  }
}
