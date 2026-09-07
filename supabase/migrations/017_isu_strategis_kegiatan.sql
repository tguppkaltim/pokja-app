-- Penanda isu strategis pada kegiatan.
--
-- Kegiatan yang ditandai isu strategis DAN belum punya satu pun realisasi
-- diangkat ke bagian atas daftar Rencana Kegiatan. Begitu sesi pertamanya
-- dilaporkan, kegiatan turun ke urutan biasa — penandanya berarti "belum
-- tersentuh", bukan "belum selesai".
--
-- Pengurutannya dikerjakan di aplikasi, bukan di sini: syaratnya menggabungkan
-- kolom ini dengan ada-tidaknya baris di realisasi_kegiatan, dan halaman daftar
-- sudah memuat keduanya untuk keperluan lain.
--
-- not null default false, bukan nullable: "belum diisi" dan "bukan isu
-- strategis" tidak berbeda artinya, dan kolom boolean yang bisa null memaksa
-- penjagaan tiga keadaan di form, daftar, dan pengurutan tanpa alasan.

alter table kegiatan
  add column if not exists isu_strategis boolean not null default false;

comment on column kegiatan.isu_strategis is
  'True bila kegiatan ditandai sebagai isu strategis. Yang bertanda dan belum punya realisasi tampil di atas daftar Rencana Kegiatan.';

-- Verifikasi: 1 baris, is_nullable NO, default false, dan semua kegiatan yang
-- sudah ada bernilai false.
select
  (select count(*) from information_schema.columns
     where table_name = 'kegiatan' and column_name = 'isu_strategis'
       and is_nullable = 'NO')                              as kolom_ada_dan_not_null,
  (select count(*) from kegiatan)                           as total_kegiatan,
  (select count(*) from kegiatan where isu_strategis)       as ditandai_harus_nol;
