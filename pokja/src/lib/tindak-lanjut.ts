import type { Pokja, StatusTindakLanjut, TindakLanjut } from '@/types'
import { toTanggalLokal } from '@/lib/utils'

export const STATUS_LABEL: Record<StatusTindakLanjut, string> = {
  open: 'Open',
  on_progress: 'On Progress',
  closed: 'Closed',
  dibatalkan: 'Dibatalkan',
}

export const STATUS_BADGE: Record<StatusTindakLanjut, string> = {
  open: 'bg-red-100 text-red-700 border-red-200',
  on_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  closed: 'bg-green-100 text-green-700 border-green-200',
  dibatalkan: 'bg-gray-100 text-gray-500 border-gray-200',
}

export const STATUS_ITEMS = (Object.keys(STATUS_LABEL) as StatusTindakLanjut[])
  .map(value => ({ value, label: STATUS_LABEL[value] }))

/**
 * Keterlambatan dihitung, tidak disimpan sebagai status tersendiri.
 * Status yang harus diperbarui manual pasti ada yang lupa; yang dihitung
 * selalu mencerminkan keadaan hari ini.
 */
export function terlambat(t: TindakLanjut, hariIni = toTanggalLokal(new Date())): boolean {
  if (t.status === 'closed' || t.status === 'dibatalkan') return false
  if (!t.target_closed) return false
  return t.target_closed < hariIni
}

/** 'Sekretariat' atau nama pokja yang dirujuk. */
export function labelPic(t: Pick<TindakLanjut, 'pic' | 'pic_pokja_id'>, daftarPokja: Pokja[]): string {
  if (t.pic === 'sekretariat') return 'Sekretariat'
  return daftarPokja.find(p => p.id === t.pic_pokja_id)?.name ?? '-'
}

/**
 * Daftar pilihan PIC: seluruh pokja plus Sekretariat.
 * Nilai 'sekretariat' dibedakan dari id pokja lewat prefix supaya keduanya
 * muat dalam satu dropdown tanpa bisa tertukar.
 */
export const PIC_SEKRETARIAT = 'sekretariat'

export function picItems(daftarPokja: Pokja[]) {
  return [
    ...daftarPokja.map(p => ({ value: `pokja:${p.id}`, label: p.name })),
    { value: PIC_SEKRETARIAT, label: 'Sekretariat' },
  ]
}

export function picKeValue(t: Pick<TindakLanjut, 'pic' | 'pic_pokja_id'>): string {
  return t.pic === 'sekretariat' ? PIC_SEKRETARIAT : `pokja:${t.pic_pokja_id}`
}

export function valueKePic(value: string): Pick<TindakLanjut, 'pic' | 'pic_pokja_id'> {
  if (value === PIC_SEKRETARIAT) return { pic: 'sekretariat', pic_pokja_id: null }
  return { pic: 'pokja', pic_pokja_id: parseInt(value.slice('pokja:'.length)) }
}

/** Apakah pengguna boleh mengubah baris ini. Cerminan policy RLS di database. */
export function bolehUbah(
  t: Pick<TindakLanjut, 'pic' | 'pic_pokja_id'>,
  user: { role: string; pokja_id: number | null } | null
): boolean {
  if (!user) return false
  if (user.role === 'super_admin' || user.role === 'sekretariat') return true
  return user.role === 'operator' && t.pic === 'pokja' && t.pic_pokja_id === user.pokja_id
}
