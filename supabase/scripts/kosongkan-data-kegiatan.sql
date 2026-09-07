-- SKRIP SEKALI PAKAI — BUKAN MIGRASI. TIDAK BISA DIBATALKAN.
--
-- Sengaja diletakkan di supabase/scripts/, bukan supabase/migrations/. Kalau
-- ditaruh bersama migrasi, ia akan ikut berjalan setiap kali basis data
-- dipasang dari nol dan menghapus data yang baru saja diisi.
--
-- Mengosongkan data transaksi untuk diganti data sebenarnya.
--
--   DIHAPUS       : kegiatan, jadwal, realisasi, bukti kegiatan, kaitan mitra,
--                   rapat, tindak lanjut, dan riwayat progresnya
--   DIPERTAHANKAN : pokja, program pokok/unggulan/prioritas, mitra, dan
--                   seluruh akun pengguna
--
-- PERIKSA ANGKA "sebelum" DI BAWAH SEBELUM MENJALANKAN BAGIAN HAPUS.

-- ── 1. Hitung dulu apa yang akan hilang ─────────────────────────────────────
select 'sebelum' as tahap,
  (select count(*) from kegiatan)              as kegiatan,
  (select count(*) from jadwal_kegiatan)       as jadwal,
  (select count(*) from realisasi_kegiatan)    as realisasi,
  (select count(*) from evidence_files)        as bukti,
  (select count(*) from kegiatan_mitra)        as kaitan_mitra,
  (select count(*) from rapat)                 as rapat,
  (select count(*) from tindak_lanjut)         as tindak_lanjut,
  (select count(*) from progres_tindak_lanjut) as progres;

-- ── 2. Hapus ────────────────────────────────────────────────────────────────
-- Sebagian besar tabel anak sudah memakai on delete cascade, tapi urutannya
-- ditulis lengkap dan eksplisit: yang menghapus data produksi sebaiknya
-- terbaca apa adanya, bukan mengandalkan perilaku yang tak terlihat.
begin;

delete from evidence_files;
delete from realisasi_kegiatan;
delete from kegiatan_mitra;
delete from jadwal_kegiatan;
delete from kegiatan;

delete from progres_tindak_lanjut;
delete from tindak_lanjut;
delete from rapat;

-- Penomoran diulang dari 1 supaya data sebenarnya tidak mulai dari id 23.
-- Aman karena seluruh baris yang merujuk ke id lama sudah terhapus di atas.
select setval('kegiatan_id_seq', 1, false);
select setval('jadwal_kegiatan_id_seq', 1, false);
select setval('realisasi_kegiatan_id_seq', 1, false);
select setval('evidence_files_id_seq', 1, false);
select setval('rapat_id_seq', 1, false);
select setval('tindak_lanjut_id_seq', 1, false);
select setval('progres_tindak_lanjut_id_seq', 1, false);

commit;

-- ── 3. Verifikasi ───────────────────────────────────────────────────────────
-- Semua kolom "harus nol" wajib 0; semua kolom "harus tetap" wajib > 0.
select 'sesudah' as tahap,
  (select count(*) from kegiatan)              as kegiatan_harus_nol,
  (select count(*) from realisasi_kegiatan)    as realisasi_harus_nol,
  (select count(*) from evidence_files)        as bukti_harus_nol,
  (select count(*) from rapat)                 as rapat_harus_nol,
  (select count(*) from pokja)                 as pokja_harus_tetap,
  (select count(*) from program_pokok)         as program_pokok_harus_tetap,
  (select count(*) from program_prioritas)     as prioritas_harus_tetap,
  (select count(*) from profiles)              as akun_harus_tetap;
