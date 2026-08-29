-- Buang 12 kolom sched_* yang digantikan tabel jadwal_kegiatan.
--
-- JALANKAN SETELAH kode versi terbaru sudah ter-deploy. Sebelum itu, form
-- Rencana Kegiatan masih menulis kolom ini; menjalankan migrasi lebih dulu
-- akan membuat penyimpanan kegiatan gagal.
--
-- TIDAK BISA DIBATALKAN. Isi kolom ini sudah dipindahkan ke jadwal_kegiatan
-- oleh migrasi 006, tapi setelah di-drop tidak ada jalan kembali.

-- Penjaga: batalkan kalau masih ada kegiatan yang punya bulan tercentang
-- tapi tidak punya satu pun sesi di jadwal_kegiatan. Itu berarti migrasi 006
-- belum tuntas dan datanya akan hilang.
do $$
declare
  tertinggal integer;
begin
  select count(*) into tertinggal
  from kegiatan k
  where (k.sched_jan or k.sched_feb or k.sched_mar or k.sched_apr
      or k.sched_mei or k.sched_jun or k.sched_jul or k.sched_agu
      or k.sched_sep or k.sched_okt or k.sched_nov or k.sched_des)
    and not exists (select 1 from jadwal_kegiatan j where j.kegiatan_id = k.id);

  if tertinggal > 0 then
    raise exception 'Dibatalkan: % kegiatan punya jadwal bulanan tapi belum punya sesi di jadwal_kegiatan. Jalankan migrasi 006 lebih dulu.', tertinggal;
  end if;
end $$;

alter table kegiatan
  drop column sched_jan,
  drop column sched_feb,
  drop column sched_mar,
  drop column sched_apr,
  drop column sched_mei,
  drop column sched_jun,
  drop column sched_jul,
  drop column sched_agu,
  drop column sched_sep,
  drop column sched_okt,
  drop column sched_nov,
  drop column sched_des;

-- Verifikasi: harus 0
select count(*) as sisa_kolom_sched
from information_schema.columns
where table_name = 'kegiatan' and column_name like 'sched_%';
