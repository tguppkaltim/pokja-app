import type { User, Pokja, ProgramPokok, Kegiatan, RealisasiKegiatan, EvidenceFile } from '@/types'

export const mockUsers: User[] = [
  {
    id: 'user-admin-1',
    full_name: 'Siti Rahayu, S.Sos',
    email: 'admin@pkk-kaltim.go.id',
    role: 'super_admin',
    pokja_id: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-op-1',
    full_name: 'Dewi Kartika, S.Pd',
    email: 'pokja1@pkk-kaltim.go.id',
    role: 'operator',
    pokja_id: 1,
    is_active: true,
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'user-op-2',
    full_name: 'Rina Susanti, M.Pd',
    email: 'pokja2@pkk-kaltim.go.id',
    role: 'operator',
    pokja_id: 2,
    is_active: true,
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'user-op-3',
    full_name: 'Yuni Pratiwi, S.T',
    email: 'pokja3@pkk-kaltim.go.id',
    role: 'operator',
    pokja_id: 3,
    is_active: true,
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'user-op-4',
    full_name: 'dr. Aminah Wulandari',
    email: 'pokja4@pkk-kaltim.go.id',
    role: 'operator',
    pokja_id: 4,
    is_active: true,
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'user-view-1',
    full_name: 'Hj. Norbaiti Isran, M.Si',
    email: 'ketua@pkk-kaltim.go.id',
    role: 'viewer',
    pokja_id: null,
    is_active: true,
    created_at: '2026-01-05T00:00:00Z',
  },
]

export const mockCredentials: Record<string, string> = {
  'admin@pkk-kaltim.go.id': 'admin123',
  'pokja1@pkk-kaltim.go.id': 'pokja1123',
  'pokja2@pkk-kaltim.go.id': 'pokja2123',
  'pokja3@pkk-kaltim.go.id': 'pokja3123',
  'pokja4@pkk-kaltim.go.id': 'pokja4123',
  'ketua@pkk-kaltim.go.id': 'ketua123',
}

export const mockPokja: Pokja[] = [
  {
    id: 1,
    name: 'Pokja I',
    description: 'Penguatan Pembentukan Karakter Keluarga — Penghayatan Pancasila, Gotong Royong, Karakter Keluarga',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Pokja II',
    description: 'Gelari Pelangi — Pendidikan, PAUD, Literasi, UP2K, Koperasi',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'Pokja III',
    description: 'Ketahanan Keluarga — Pangan, Sandang, Papan, Tata Laksana Rumah Tangga',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 4,
    name: 'Pokja IV',
    description: 'Kesehatan & Perencanaan Sehat — Kesehatan, Lingkungan Sehat, Perencanaan Keuangan',
    created_at: '2026-01-01T00:00:00Z',
  },
]

export const mockProgramPokok: ProgramPokok[] = [
  { id: 1, pokja_id: 1, name: 'Penghayatan & Pengamalan Pancasila', created_at: '2026-01-01T00:00:00Z' },
  { id: 2, pokja_id: 1, name: 'Gotong Royong', created_at: '2026-01-01T00:00:00Z' },
  { id: 3, pokja_id: 1, name: 'Karakter Keluarga', created_at: '2026-01-01T00:00:00Z' },
  { id: 4, pokja_id: 2, name: 'Pendidikan & PAUD', created_at: '2026-01-01T00:00:00Z' },
  { id: 5, pokja_id: 2, name: 'Literasi', created_at: '2026-01-01T00:00:00Z' },
  { id: 6, pokja_id: 2, name: 'UP2K & Koperasi', created_at: '2026-01-01T00:00:00Z' },
  { id: 7, pokja_id: 3, name: 'Ketahanan Pangan', created_at: '2026-01-01T00:00:00Z' },
  { id: 8, pokja_id: 3, name: 'Sandang & Papan', created_at: '2026-01-01T00:00:00Z' },
  { id: 9, pokja_id: 3, name: 'Tata Laksana Rumah Tangga', created_at: '2026-01-01T00:00:00Z' },
  { id: 10, pokja_id: 4, name: 'Kesehatan Keluarga', created_at: '2026-01-01T00:00:00Z' },
  { id: 11, pokja_id: 4, name: 'Lingkungan Sehat', created_at: '2026-01-01T00:00:00Z' },
  { id: 12, pokja_id: 4, name: 'Perencanaan Keuangan Keluarga', created_at: '2026-01-01T00:00:00Z' },
]

export const mockKegiatan: Kegiatan[] = [
  // Pokja I - Program 1
  {
    id: 1, pokja_id: 1, program_pokok_id: 1,
    nama_kegiatan: 'Pelatihan Penguatan Nilai-nilai Pancasila bagi Kader PKK',
    sasaran: 'Kader PKK Kecamatan', pelaksana: 'Tim Pokja I',
    anggaran: 15000000, tahun: 2026,
    sched_jan: true, sched_feb: false, sched_mar: false, sched_apr: true, sched_mei: false,
    sched_jun: false, sched_jul: false, sched_agu: true, sched_sep: false, sched_okt: false,
    sched_nov: false, sched_des: false,
    created_by: 'user-op-1', created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 2, pokja_id: 1, program_pokok_id: 1,
    nama_kegiatan: 'Sosialisasi Bela Negara dalam Keluarga',
    sasaran: 'Ibu Rumah Tangga', pelaksana: 'Tim Pokja I',
    anggaran: 8000000, tahun: 2026,
    sched_jan: false, sched_feb: true, sched_mar: false, sched_apr: false, sched_mei: true,
    sched_jun: false, sched_jul: false, sched_agu: false, sched_sep: true, sched_okt: false,
    sched_nov: false, sched_des: false,
    created_by: 'user-op-1', created_at: '2026-01-10T00:00:00Z',
  },
  // Pokja I - Program 2
  {
    id: 3, pokja_id: 1, program_pokok_id: 2,
    nama_kegiatan: 'Kerja Bakti Lingkungan Bersama',
    sasaran: 'Masyarakat RT/RW', pelaksana: 'Tim Pokja I bersama RT/RW',
    anggaran: 5000000, tahun: 2026,
    sched_jan: false, sched_feb: false, sched_mar: true, sched_apr: false, sched_mei: false,
    sched_jun: true, sched_jul: false, sched_agu: false, sched_sep: false, sched_okt: true,
    sched_nov: false, sched_des: false,
    created_by: 'user-op-1', created_at: '2026-01-10T00:00:00Z',
  },
  // Pokja II - Program 4
  {
    id: 4, pokja_id: 2, program_pokok_id: 4,
    nama_kegiatan: 'Pembinaan dan Monitoring PAUD se-Kaltim',
    sasaran: '50 Lembaga PAUD', pelaksana: 'Tim Pokja II',
    anggaran: 25000000, tahun: 2026,
    sched_jan: false, sched_feb: true, sched_mar: false, sched_apr: false, sched_mei: false,
    sched_jun: true, sched_jul: false, sched_agu: false, sched_sep: false, sched_okt: false,
    sched_nov: true, sched_des: false,
    created_by: 'user-op-2', created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 5, pokja_id: 2, program_pokok_id: 4,
    nama_kegiatan: 'Workshop Parenting untuk Orang Tua Anak Usia Dini',
    sasaran: '200 Orang Tua', pelaksana: 'Tim Pokja II',
    anggaran: 12000000, tahun: 2026,
    sched_jan: false, sched_feb: false, sched_mar: true, sched_apr: false, sched_mei: false,
    sched_jun: false, sched_jul: true, sched_agu: false, sched_sep: false, sched_okt: true,
    sched_nov: false, sched_des: false,
    created_by: 'user-op-2', created_at: '2026-01-10T00:00:00Z',
  },
  // Pokja II - Program 5
  {
    id: 6, pokja_id: 2, program_pokok_id: 5,
    nama_kegiatan: 'Gerakan Literasi Keluarga — Pojok Baca Desa',
    sasaran: 'Keluarga di Pedesaan', pelaksana: 'Tim Pokja II',
    anggaran: 18000000, tahun: 2026,
    sched_jan: true, sched_feb: false, sched_mar: false, sched_apr: true, sched_mei: false,
    sched_jun: false, sched_jul: true, sched_agu: false, sched_sep: false, sched_okt: false,
    sched_nov: false, sched_des: true,
    created_by: 'user-op-2', created_at: '2026-01-10T00:00:00Z',
  },
  // Pokja III - Program 7
  {
    id: 7, pokja_id: 3, program_pokok_id: 7,
    nama_kegiatan: 'Pelatihan Pengolahan Pangan Lokal Kalimantan',
    sasaran: '100 Ibu PKK', pelaksana: 'Tim Pokja III',
    anggaran: 20000000, tahun: 2026,
    sched_jan: false, sched_feb: true, sched_mar: false, sched_apr: false, sched_mei: true,
    sched_jun: false, sched_jul: false, sched_agu: true, sched_sep: false, sched_okt: false,
    sched_nov: true, sched_des: false,
    created_by: 'user-op-3', created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 8, pokja_id: 3, program_pokok_id: 7,
    nama_kegiatan: 'Lomba Masakan Berbahan Pangan Lokal',
    sasaran: 'Tim PKK Kabupaten/Kota', pelaksana: 'Tim Pokja III',
    anggaran: 30000000, tahun: 2026,
    sched_jan: false, sched_feb: false, sched_mar: false, sched_apr: false, sched_mei: false,
    sched_jun: false, sched_jul: false, sched_agu: false, sched_sep: false, sched_okt: true,
    sched_nov: false, sched_des: false,
    created_by: 'user-op-3', created_at: '2026-01-10T00:00:00Z',
  },
  // Pokja III - Program 9
  {
    id: 9, pokja_id: 3, program_pokok_id: 9,
    nama_kegiatan: 'Pelatihan Manajemen Rumah Tangga Sehat',
    sasaran: '150 Ibu Rumah Tangga', pelaksana: 'Tim Pokja III',
    anggaran: 10000000, tahun: 2026,
    sched_jan: false, sched_feb: false, sched_mar: true, sched_apr: false, sched_mei: false,
    sched_jun: true, sched_jul: false, sched_agu: false, sched_sep: true, sched_okt: false,
    sched_nov: false, sched_des: false,
    created_by: 'user-op-3', created_at: '2026-01-10T00:00:00Z',
  },
  // Pokja IV - Program 10
  {
    id: 10, pokja_id: 4, program_pokok_id: 10,
    nama_kegiatan: 'Penyuluhan Kesehatan Ibu dan Anak (KIA)',
    sasaran: '500 Ibu dan Anak', pelaksana: 'Tim Pokja IV bersama Dinkes',
    anggaran: 35000000, tahun: 2026,
    sched_jan: true, sched_feb: false, sched_mar: true, sched_apr: false, sched_mei: true,
    sched_jun: false, sched_jul: true, sched_agu: false, sched_sep: true, sched_okt: false,
    sched_nov: true, sched_des: false,
    created_by: 'user-op-4', created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 11, pokja_id: 4, program_pokok_id: 10,
    nama_kegiatan: 'Pemeriksaan Kesehatan Gratis Kader PKK',
    sasaran: '300 Kader PKK', pelaksana: 'Tim Pokja IV bersama Puskesmas',
    anggaran: 22000000, tahun: 2026,
    sched_jan: false, sched_feb: true, sched_mar: false, sched_apr: false, sched_mei: false,
    sched_jun: true, sched_jul: false, sched_agu: false, sched_sep: false, sched_okt: false,
    sched_nov: false, sched_des: true,
    created_by: 'user-op-4', created_at: '2026-01-10T00:00:00Z',
  },
  // Pokja IV - Program 11
  {
    id: 12, pokja_id: 4, program_pokok_id: 11,
    nama_kegiatan: 'Gerakan Desa Bersih dan Sehat',
    sasaran: 'Seluruh Desa di Kaltim', pelaksana: 'Tim Pokja IV',
    anggaran: 18000000, tahun: 2026,
    sched_jan: false, sched_feb: false, sched_mar: false, sched_apr: true, sched_mei: false,
    sched_jun: false, sched_jul: false, sched_agu: true, sched_sep: false, sched_okt: false,
    sched_nov: false, sched_des: false,
    created_by: 'user-op-4', created_at: '2026-01-10T00:00:00Z',
  },
]

export const mockRealisasi: RealisasiKegiatan[] = [
  // Kegiatan 1 (sched Jan, Apr, Agu)
  { id: 1, kegiatan_id: 1, bulan: 1, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-01-20', catatan: 'Kegiatan berjalan lancar dihadiri 45 kader', anggaran_aktual: 4550000, created_by: 'user-op-1', created_at: '2026-01-21T00:00:00Z', updated_at: null },
  { id: 2, kegiatan_id: 1, bulan: 4, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-04-15', catatan: 'Kegiatan terlaksana, dihadiri 30 peserta dari target 50', anggaran_aktual: 4700000, created_by: 'user-op-1', created_at: '2026-04-16T00:00:00Z', updated_at: null },
  // Kegiatan 2 (sched Feb, Mei, Sep)
  { id: 3, kegiatan_id: 2, bulan: 2, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-02-14', catatan: 'Sosialisasi berjalan sukses', anggaran_aktual: 2587000, created_by: 'user-op-1', created_at: '2026-02-15T00:00:00Z', updated_at: null },
  { id: 4, kegiatan_id: 2, bulan: 5, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-05-10', catatan: 'Antusias peserta sangat tinggi', anggaran_aktual: 2667000, created_by: 'user-op-1', created_at: '2026-05-11T00:00:00Z', updated_at: null },
  // Kegiatan 3 (sched Mar, Jun, Okt)
  { id: 5, kegiatan_id: 3, bulan: 3, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-03-22', catatan: '200 warga berpartisipasi', anggaran_aktual: 1467000, created_by: 'user-op-1', created_at: '2026-03-23T00:00:00Z', updated_at: null },
  // Kegiatan 4 (sched Feb, Jun, Nov)
  { id: 6, kegiatan_id: 4, bulan: 2, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-02-20', catatan: 'Monitoring 52 lembaga PAUD', anggaran_aktual: 7583000, created_by: 'user-op-2', created_at: '2026-02-21T00:00:00Z', updated_at: null },
  // Kegiatan 5 (sched Mar, Jul, Okt)
  { id: 7, kegiatan_id: 5, bulan: 3, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-03-18', catatan: 'Workshop terlaksana, dihadiri 150 dari 200 target', anggaran_aktual: 3760000, created_by: 'user-op-2', created_at: '2026-03-19T00:00:00Z', updated_at: null },
  // Kegiatan 6 (sched Jan, Apr, Jul, Des)
  { id: 8, kegiatan_id: 6, bulan: 1, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-01-25', catatan: 'Pembukaan pojok baca di 3 desa', anggaran_aktual: 4365000, created_by: 'user-op-2', created_at: '2026-01-26T00:00:00Z', updated_at: null },
  { id: 9, kegiatan_id: 6, bulan: 4, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-04-10', catatan: 'Penambahan 5 desa baru', anggaran_aktual: 4500000, created_by: 'user-op-2', created_at: '2026-04-11T00:00:00Z', updated_at: null },
  // Kegiatan 7 (sched Feb, Mei, Agu, Nov)
  { id: 10, kegiatan_id: 7, bulan: 2, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-02-28', catatan: 'Pelatihan masak pangan lokal: singkong, ubi, sagu', anggaran_aktual: 4400000, created_by: 'user-op-3', created_at: '2026-03-01T00:00:00Z', updated_at: null },
  { id: 11, kegiatan_id: 7, bulan: 5, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-05-22', catatan: 'Sesi ke-2 fokus pengolahan ikan air tawar', anggaran_aktual: 4550000, created_by: 'user-op-3', created_at: '2026-05-23T00:00:00Z', updated_at: null },
  // Kegiatan 9 (sched Mar, Jun, Sep)
  { id: 12, kegiatan_id: 9, bulan: 3, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-03-15', catatan: 'Pelatihan diikuti 155 ibu rumah tangga', anggaran_aktual: 3133000, created_by: 'user-op-3', created_at: '2026-03-16T00:00:00Z', updated_at: null },
  // Kegiatan 10 (sched Jan, Mar, Mei, Jul, Sep, Nov)
  { id: 13, kegiatan_id: 10, bulan: 1, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-01-18', catatan: 'Penyuluhan di 5 Puskesmas', anggaran_aktual: 5658000, created_by: 'user-op-4', created_at: '2026-01-19T00:00:00Z', updated_at: null },
  { id: 14, kegiatan_id: 10, bulan: 3, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-03-20', catatan: 'Penyuluhan di 7 Puskesmas, total 520 peserta', anggaran_aktual: 5833000, created_by: 'user-op-4', created_at: '2026-03-21T00:00:00Z', updated_at: null },
  { id: 15, kegiatan_id: 10, bulan: 5, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-05-15', catatan: 'Penyuluhan terlaksana di 4 Puskesmas', anggaran_aktual: 5133000, created_by: 'user-op-4', created_at: '2026-05-16T00:00:00Z', updated_at: null },
  // Kegiatan 11 (sched Feb, Jun, Des)
  { id: 16, kegiatan_id: 11, bulan: 2, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-02-22', catatan: 'Pemeriksaan 320 kader, semua sehat', anggaran_aktual: 6673000, created_by: 'user-op-4', created_at: '2026-02-23T00:00:00Z', updated_at: null },
  // Kegiatan 12 (sched Apr, Agu)
  { id: 17, kegiatan_id: 12, bulan: 4, tahun: 2026, status: 'terlaksana', tanggal_pelaksanaan: '2026-04-22', catatan: 'Gerakan dimulai di 10 desa percontohan', anggaran_aktual: 8460000, created_by: 'user-op-4', created_at: '2026-04-23T00:00:00Z', updated_at: null },
]

export const mockEvidence: EvidenceFile[] = [
  { id: 1, realisasi_id: 1, file_name: 'foto-pelatihan-pancasila-jan.jpg', file_path: 'evidence/realisasi-1/foto1.jpg', file_type: 'image/jpeg', file_size: 1245000, uploaded_by: 'user-op-1', uploaded_at: '2026-01-21T00:00:00Z' },
  { id: 2, realisasi_id: 1, file_name: 'laporan-pelatihan-jan.pdf', file_path: 'evidence/realisasi-1/laporan.pdf', file_type: 'application/pdf', file_size: 850000, uploaded_by: 'user-op-1', uploaded_at: '2026-01-21T00:00:00Z' },
  { id: 3, realisasi_id: 6, file_name: 'monitoring-paud-feb.jpg', file_path: 'evidence/realisasi-6/foto1.jpg', file_type: 'image/jpeg', file_size: 980000, uploaded_by: 'user-op-2', uploaded_at: '2026-02-21T00:00:00Z' },
  { id: 4, realisasi_id: 13, file_name: 'penyuluhan-kia-jan.jpg', file_path: 'evidence/realisasi-13/foto1.jpg', file_type: 'image/jpeg', file_size: 1102000, uploaded_by: 'user-op-4', uploaded_at: '2026-01-19T00:00:00Z' },
]

export const BULAN_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
export const BULAN_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export const SCHED_KEYS: (keyof Kegiatan)[] = [
  'sched_jan', 'sched_feb', 'sched_mar', 'sched_apr', 'sched_mei', 'sched_jun',
  'sched_jul', 'sched_agu', 'sched_sep', 'sched_okt', 'sched_nov', 'sched_des',
]
