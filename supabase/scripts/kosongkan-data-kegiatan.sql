-- SKRIP SEKALI PAKAI — BUKAN MIGRASI. TIDAK BISA DIBATALKAN.
--
-- Sengaja diletakkan di supabase/scripts/, bukan supabase/migrations/. Kalau
-- ditaruh bersama migrasi, ia akan ikut berjalan setiap kali basis data
-- dipasang dari nol dan menghapus data yang baru saja diisi.
--
-- Mengosongkan data transaksi untuk diganti data sebenarnya.
--
--   DIPERTAHANKAN : pokja, program pokok/unggulan/prioritas, mitra beserta
--                   bidang pokjanya, wilayah, dan seluruh akun pengguna
--
-- Terbagi dua bagian yang berdiri sendiri. Jalankan bagian yang memang
-- dimaksud saja — "kosongkan data kegiatan" tidak otomatis berarti notulensi
-- rapat ikut dibuang.
--
--   BAGIAN A : kegiatan, jadwal, realisasi, bukti, kaitan mitra, lokus
--   BAGIAN B : rapat, tindak lanjut, dan riwayat progresnya
--
-- CATATAN STORAGE: menghapus baris evidence_files TIDAK menghapus berkasnya
-- di bucket `evidence`. Berkasnya tertinggal sebagai yatim dan hanya bisa
-- dibuang lewat Dashboard Supabase > Storage > evidence.


-- ── 1. Hitung dulu apa yang akan hilang ─────────────────────────────────────
-- Jalankan ini SENDIRIAN lebih dulu dan baca angkanya. Editor SQL Supabase
-- hanya menampilkan hasil statement terakhir yang mengembalikan baris.
select
  (select count(*) from kegiatan)              as a_kegiatan,
  (select count(*) from jadwal_kegiatan)       as a_jadwal,
  (select count(*) from realisasi_kegiatan)    as a_realisasi,
  (select count(*) from evidence_files)        as a_bukti,
  (select count(*) from kegiatan_mitra)        as a_kaitan_mitra,
  (select count(*) from kegiatan_wilayah)      as a_lokus,
  (select count(*) from rapat)                 as b_rapat,
  (select count(*) from tindak_lanjut)         as b_tindak_lanjut,
  (select count(*) from progres_tindak_lanjut) as b_progres;


-- ── 2. BAGIAN A — data kegiatan ─────────────────────────────────────────────
-- Sebagian besar tabel anak sudah memakai on delete cascade, tapi urutannya
-- ditulis lengkap dan eksplisit: yang menghapus data produksi sebaiknya
-- terbaca apa adanya, bukan mengandalkan perilaku yang tak terlihat.
begin;

delete from evidence_files;
delete from realisasi_kegiatan;
delete from kegiatan_mitra;
delete from kegiatan_wilayah;
delete from jadwal_kegiatan;
delete from kegiatan;

-- Penomoran diulang dari 1 supaya data sebenarnya tidak mulai dari id 23.
-- Aman karena seluruh baris yang merujuk ke id lama sudah terhapus di atas.
select setval('kegiatan_id_seq', 1, false);
select setval('jadwal_kegiatan_id_seq', 1, false);
select setval('realisasi_kegiatan_id_seq', 1, false);
select setval('evidence_files_id_seq', 1, false);

commit;


-- ── 3. BAGIAN B — notulensi rapat ───────────────────────────────────────────
-- Berdiri sendiri. Lewati kalau notulensi yang sudah ada masih dipakai.
/*
begin;

delete from progres_tindak_lanjut;
delete from tindak_lanjut;
delete from rapat;

select setval('rapat_id_seq', 1, false);
select setval('tindak_lanjut_id_seq', 1, false);
select setval('progres_tindak_lanjut_id_seq', 1, false);

commit;
*/


-- ── 4. Verifikasi ───────────────────────────────────────────────────────────
-- Kolom "harus nol" wajib 0; kolom "harus tetap" wajib > 0. Angka rapat hanya
-- nol kalau Bagian B ikut dijalankan.
select
  (select count(*) from kegiatan)           as kegiatan_harus_nol,
  (select count(*) from realisasi_kegiatan) as realisasi_harus_nol,
  (select count(*) from kegiatan_wilayah)   as lokus_harus_nol,
  (select count(*) from evidence_files)     as bukti_harus_nol,
  (select count(*) from rapat)              as rapat,
  (select count(*) from pokja)              as pokja_harus_tetap,
  (select count(*) from program_prioritas)  as prioritas_harus_tetap,
  (select count(*) from mitra)              as mitra_harus_102,
  (select count(*) from mitra_pokja)        as bidang_pokja_harus_179,
  (select count(*) from wilayah)            as wilayah_harus_10,
  (select count(*) from profiles)           as akun_harus_tetap;
