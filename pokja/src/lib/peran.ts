import type { UserRole } from '@/types'

/**
 * Nama dan warna peran pengguna.
 *
 * Sebelumnya daftar ini disalin di tiga tempat — Header, Master Pengguna, dan
 * Profil — dan ketiganya menyebut peran yang sama dengan nama berbeda:
 * `super_admin` tampil sebagai "Administrator" di header, "Super Admin" di
 * daftar pengguna, dan "Super Administrator" di halaman profil. Orang yang
 * sama melihat tiga nama untuk dirinya sendiri tergantung halaman.
 *
 * Bertipe Record<UserRole, …>, bukan Record<string, …>, supaya menambah peran
 * baru di UserRole langsung menimbulkan galat di sini alih-alih diam-diam
 * tampil sebagai teks mentah "sekretariat".
 */

export const LABEL_PERAN: Record<UserRole, string> = {
  super_admin: 'Administrator',
  sekretariat: 'Sekretariat',
  operator: 'Operator Pokja',
  viewer: 'Viewer',
}

/** Penjelasan satu kalimat untuk tempat yang lapang, seperti halaman Profil. */
export const KETERANGAN_PERAN: Record<UserRole, string> = {
  super_admin: 'Akses penuh ke seluruh data, pengguna, dan master program.',
  sekretariat: 'Membaca seluruh data dan mengelola notulensi rapat.',
  operator: 'Mengelola rencana dan realisasi kegiatan pokjanya sendiri.',
  viewer: 'Hanya membaca. Ditujukan untuk pimpinan.',
}

/**
 * Operator memakai warna merek karena merekalah pengguna utama sistem ini.
 * Viewer sengaja abu-abu, bukan biru: dua biru yang berbeda di satu tabel
 * terbaca seperti kekeliruan, bukan pembedaan.
 */
export const BADGE_PERAN: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
  sekretariat: 'bg-status-warning-tint text-status-warning border-status-warning/25',
  operator: 'bg-pkk-tint text-pkk border-pkk-border',
  viewer: 'bg-slate-100 text-slate-600 border-slate-200',
}
