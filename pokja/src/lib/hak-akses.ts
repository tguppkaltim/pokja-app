import type { User, UserRole } from '@/types'

/**
 * Siapa boleh mengubah data pokja mana.
 *
 * Sebelumnya pertanyaan ini dijawab lewat `user.role === 'operator' &&
 * user.pokja_id` yang ditulis ulang di sekitar 25 tempat. Menambahkan satu
 * peran berarti menyunting semuanya, dan satu yang terlewat bukan sekadar
 * tampilan keliru — itu kebocoran hak akses.
 *
 * PENTING: berkas ini hanya mengatur apa yang TAMPIL. Batas yang sebenarnya
 * ada di RLS basis data (migrasi 018), yang menegakkan aturan sama persis.
 * Menyembunyikan tombol tidak menghentikan siapa pun yang memanggil API
 * langsung; RLS-lah yang menghentikannya. Keduanya harus dijaga sejalan.
 */

/**
 * Peran yang terikat pada satu pokja. Sekretariat masuk ke sini karena
 * Sekretariat adalah pokja tersendiri sejak migrasi 012 — perlakuannya sama
 * seperti operator, hanya pokjanya yang berbeda.
 */
const PERAN_TERIKAT_POKJA: readonly UserRole[] = ['operator', 'sekretariat']

/** Pokja yang mengikat pengguna, atau null kalau perannya tidak terikat. */
export function pokjaTerikat(user: User | null | undefined): number | null {
  if (!user) return null
  return PERAN_TERIKAT_POKJA.includes(user.role) ? user.pokja_id : null
}

/** Peran ini wajib punya pokja; dipakai form Master Pengguna. */
export function wajibPilihPokja(role: UserRole | string): boolean {
  return PERAN_TERIKAT_POKJA.includes(role as UserRole)
}

/** Boleh membuat atau mengubah kegiatan sama sekali? */
export function bolehKelolaKegiatan(user: User | null | undefined): boolean {
  if (!user) return false
  return user.role === 'super_admin' || pokjaTerikat(user) !== null
}

/**
 * Boleh mengubah data milik pokja tertentu?
 *
 * super_admin selalu boleh. Peran terikat hanya boleh untuk pokjanya sendiri.
 * Peran lain tidak pernah boleh.
 */
export function bolehKelolaPokja(
  user: User | null | undefined,
  pokjaId: number | null | undefined,
): boolean {
  if (!user) return false
  if (user.role === 'super_admin') return true
  const terikat = pokjaTerikat(user)
  return terikat !== null && terikat === pokjaId
}

/**
 * Daftar pokja yang boleh dilihat pengguna ini.
 *
 * Peran terikat hanya melihat pokjanya sendiri pada filter dan form; peran
 * lain melihat semuanya. Dashboard dan Laporan tetap memakai ini agar operator
 * tidak melihat angka pokja lain di tempat yang seharusnya miliknya sendiri.
 */
export function saringPokja<T extends { id: number }>(
  user: User | null | undefined,
  daftar: T[],
): T[] {
  const terikat = pokjaTerikat(user)
  return terikat === null ? daftar : daftar.filter(p => p.id === terikat)
}
