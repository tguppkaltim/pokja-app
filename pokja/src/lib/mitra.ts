import type { Mitra } from '@/types'

/**
 * Golongan dan cakupan mitra.
 *
 * Nilainya disimpan dalam bentuk kode (`OPD_PROVINSI`), bukan kalimat yang
 * dibaca manusia, supaya penyuntingan label tidak mengubah data. Terjemahannya
 * ada di sini saja — kalau tersebar, satu golongan bisa tertulis berbeda di
 * halaman yang berbeda, seperti yang dulu terjadi pada nama peran pengguna.
 *
 * Daftar ini harus sejalan dengan constraint mitra_kategori_sah dan
 * mitra_tingkat_sah pada migrasi 020. Urutannya sengaja bukan abjad: yang
 * paling sering dipakai TP PKK Kaltim ditaruh lebih dulu.
 */
export const LABEL_KATEGORI_MITRA: Record<string, string> = {
  OPD_PROVINSI: 'OPD Provinsi',
  OPD_KAB_KOTA: 'OPD Kabupaten/Kota',
  INSTANSI_VERTIKAL: 'Instansi Vertikal',
  MITRA_KELEMBAGAAN_PKK: 'Mitra Kelembagaan PKK',
  AKADEMISI: 'Akademisi',
  BUMN_BUMD_PERBANKAN: 'BUMN / BUMD / Perbankan',
  ORG_PROFESI: 'Organisasi Profesi',
  ORG_MASYARAKAT: 'Organisasi Masyarakat',
  SWASTA_DUNIA_USAHA: 'Swasta / Dunia Usaha',
  PEMERINTAH_DESA: 'Pemerintah Desa/Kelurahan',
}

/** Cakupan wilayah kerja. Nilainya sudah berupa kalimat, jadi tidak perlu peta. */
export const TINGKAT_MITRA = [
  'Nasional',
  'Provinsi',
  'Provinsi & Kab/Kota',
  'Kab/Kota',
  'Kecamatan',
  'Desa/Kelurahan',
] as const

/** Kategori yang belum ditentukan tampil apa adanya, bukan hilang. */
export function labelKategori(kategori: string): string {
  if (!kategori) return '—'
  return LABEL_KATEGORI_MITRA[kategori] ?? kategori
}

/**
 * Nama yang ditampilkan di ruang sempit: singkatan kalau ada, kalau tidak nama
 * resminya. Dipakai tabel kegiatan, chip pemilih, dan pengurutan daftar —
 * ketiganya harus menyebut mitra yang sama dengan kata yang sama.
 */
export function labelMitra(m: Pick<Mitra, 'nama' | 'singkatan'>): string {
  return m.singkatan || m.nama
}
