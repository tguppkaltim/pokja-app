import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format tanggal ke YYYY-MM-DD memakai komponen waktu LOKAL.
 *
 * Jangan pakai toISOString(): fungsi itu mengonversi ke UTC, sehingga di WITA
 * (UTC+8) tanggal 1 Oktober pukul 00:00 lokal tersimpan sebagai 30 September —
 * dan 1 Januari tersimpan dengan tahun sebelumnya.
 */
export function toTanggalLokal(d: Date): string {
  const bulan = String(d.getMonth() + 1).padStart(2, '0')
  const hari = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${bulan}-${hari}`
}

/** Ubah 'YYYY-MM-DD' jadi Date lokal, bukan UTC. */
export function dariTanggalLokal(t: string): Date {
  const [y, m, d] = t.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

/** '2026-10-01' -> '1 Oktober 2026' */
export function formatTanggalPanjang(t: string): string {
  const [y, m, d] = t.split('-').map(Number)
  return `${d} ${BULAN_ID[m - 1]} ${y}`
}

/** '2026-10-01' -> '1 Okt 2026' */
export function formatTanggalPendek(t: string): string {
  const [y, m, d] = t.split('-').map(Number)
  return `${d} ${BULAN_ID[m - 1].slice(0, 3)} ${y}`
}
