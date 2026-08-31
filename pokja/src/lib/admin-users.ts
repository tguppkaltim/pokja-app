import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'

/**
 * Pembungkus Edge Function `kelola-pengguna`.
 *
 * Semua operasi ini butuh service_role, yang tidak boleh ada di frontend.
 * Fungsi di sisi server memeriksa sendiri bahwa pemanggilnya super_admin
 * dengan membaca profiles dari database — pemeriksaan di UI hanya untuk
 * menyembunyikan tombol, bukan penegakan.
 */
async function panggil<T = unknown>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('kelola-pengguna', { body })

  // Edge Function mengembalikan pesan kesalahan di body, dan supabase-js
  // membungkusnya jadi FunctionsHttpError tanpa isi. Dibaca ulang supaya
  // pengguna melihat sebabnya, bukan "Edge Function returned a non-2xx".
  if (error) {
    const pesan = await bacaPesanError(error)
    throw new Error(pesan)
  }
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(String((data as { error: unknown }).error))
  }
  return data as T
}

async function bacaPesanError(error: unknown): Promise<string> {
  const konteks = (error as { context?: Response })?.context
  if (konteks && typeof konteks.json === 'function') {
    try {
      const isi = await konteks.json()
      if (isi?.error) return String(isi.error)
    } catch {
      // biarkan jatuh ke pesan bawaan
    }
  }
  return error instanceof Error ? error.message : 'Gagal menghubungi layanan pengguna.'
}

export function buatPengguna(data: {
  email: string
  password: string
  full_name: string
  role: UserRole
  pokja_id: number | null
}) {
  return panggil<{ ok: true; user_id: string }>({ aksi: 'buat', ...data })
}

export function setAktifPengguna(userId: string, aktif: boolean) {
  return panggil({ aksi: aktif ? 'aktifkan' : 'nonaktifkan', user_id: userId })
}

export function resetPasswordPengguna(userId: string, password: string) {
  return panggil({ aksi: 'reset_password', user_id: userId, password })
}
