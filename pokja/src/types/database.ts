export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: 'super_admin' | 'operator' | 'viewer'
          pokja_id: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role: 'super_admin' | 'operator' | 'viewer'
          pokja_id?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: 'super_admin' | 'operator' | 'viewer'
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
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string
          created_at?: string
        }
        Relationships: []
      }
      program_pokok: {
        Row: {
          id: number
          pokja_id: number
          name: string
          created_at: string
        }
        Insert: {
          id?: number
          pokja_id: number
          name: string
          created_at?: string
        }
        Update: {
          id?: number
          pokja_id?: number
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      kegiatan: {
        Row: {
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
        Insert: {
          id?: number
          pokja_id: number
          program_pokok_id: number
          nama_kegiatan: string
          sasaran: string
          pelaksana: string
          anggaran: number
          tahun: number
          sched_jan?: boolean
          sched_feb?: boolean
          sched_mar?: boolean
          sched_apr?: boolean
          sched_mei?: boolean
          sched_jun?: boolean
          sched_jul?: boolean
          sched_agu?: boolean
          sched_sep?: boolean
          sched_okt?: boolean
          sched_nov?: boolean
          sched_des?: boolean
          created_by: string
          created_at?: string
        }
        Update: {
          id?: number
          pokja_id?: number
          program_pokok_id?: number
          nama_kegiatan?: string
          sasaran?: string
          pelaksana?: string
          anggaran?: number
          tahun?: number
          sched_jan?: boolean
          sched_feb?: boolean
          sched_mar?: boolean
          sched_apr?: boolean
          sched_mei?: boolean
          sched_jun?: boolean
          sched_jul?: boolean
          sched_agu?: boolean
          sched_sep?: boolean
          sched_okt?: boolean
          sched_nov?: boolean
          sched_des?: boolean
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      realisasi_kegiatan: {
        Row: {
          id: number
          kegiatan_id: number
          bulan: number
          tahun: number
          status: 'terlaksana' | 'tidak_terlaksana'
          tanggal_pelaksanaan: string | null
          catatan: string
          created_by: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          kegiatan_id: number
          bulan: number
          tahun: number
          status: 'terlaksana' | 'tidak_terlaksana'
          tanggal_pelaksanaan?: string | null
          catatan?: string
          created_by: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          kegiatan_id?: number
          bulan?: number
          tahun?: number
          status?: 'terlaksana' | 'tidak_terlaksana'
          tanggal_pelaksanaan?: string | null
          catatan?: string
          created_by?: string
          created_at?: string
          updated_at?: string | null
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
      user_role: 'super_admin' | 'operator' | 'viewer'
      status_realisasi: 'terlaksana' | 'tidak_terlaksana'
    }
  }
}
