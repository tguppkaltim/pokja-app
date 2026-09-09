/**
 * Menyusun ulang pilihan banyak-nilai menurut urutan daftar induknya.
 *
 * Lokus dan Mitra/OPD disimpan sebagai baris penghubung. PostgREST tidak
 * menjanjikan urutan apa pun tanpa ORDER BY, jadi kalau nama-namanya diambil
 * mengikuti urutan baris penghubung, kegiatan yang sama bisa tampil
 * "Samarinda, Berau" sekali muat dan "Berau, Samarinda" pada muat berikutnya.
 *
 * Daftar induknya sudah punya urutan yang berarti — wilayah menurut kolom
 * urutan, mitra menurut abjad — jadi urutan itu yang dipakai.
 */
export function menurutInduk<T extends { id: number }>(
  induk: T[],
  terpilih: Iterable<number>,
): T[] {
  const dipilih = new Set(terpilih)
  return induk.filter(x => dipilih.has(x.id))
}
