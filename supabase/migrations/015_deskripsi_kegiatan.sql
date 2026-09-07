-- Deskripsi kegiatan: penjelasan panjang yang sifatnya opsional.
--
-- Berbeda dari nama_kegiatan, yang sudah ada dan wajib diisi. nama_kegiatan
-- adalah judul yang muncul di daftar, laporan, dan tabel; deskripsi menampung
-- latar belakang, rincian pelaksanaan, atau catatan yang terlalu panjang untuk
-- sebuah judul.
--
-- default '' dan not null, bukan nullable: seluruh kode yang sudah ada
-- memperlakukan kolom teks kegiatan sebagai string biasa (sasaran, pelaksana),
-- dan menambahkan satu kolom yang bisa null memaksa penjagaan null tersebar di
-- form, daftar, dan detail untuk perbedaan yang tidak berarti — string kosong
-- dan "belum diisi" sama saja di sini.

alter table kegiatan
  add column if not exists deskripsi text not null default '';

comment on column kegiatan.deskripsi is
  'Penjelasan panjang, opsional. Judul singkatnya ada di nama_kegiatan.';

-- Verifikasi: harus 1 baris, is_nullable NO, default string kosong.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_name = 'kegiatan' and column_name = 'deskripsi';
