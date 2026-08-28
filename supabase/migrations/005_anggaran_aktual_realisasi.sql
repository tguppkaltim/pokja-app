-- Anggaran yang benar-benar terpakai pada satu sesi realisasi.
-- Anggaran aktual sebuah kegiatan = jumlah kolom ini dari seluruh barisnya.
--
-- bigint menyamai kegiatan.anggaran (rupiah bulat, bukan desimal).
-- not null default 0 membuat migrasi aman dijalankan kapan pun:
-- baris realisasi yang sudah ada otomatis terisi 0.
alter table realisasi_kegiatan
  add column anggaran_aktual bigint not null default 0;

comment on column realisasi_kegiatan.anggaran_aktual is
  'Anggaran terpakai pada sesi bulan ini (rupiah). 0 bila status tidak_terlaksana.';

-- Verifikasi
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_name = 'realisasi_kegiatan' and column_name = 'anggaran_aktual';
