-- Buang kolom tindak_lanjut.foto_path yang digantikan
-- progres_tindak_lanjut.foto_path sejak migrasi 010.
--
-- JALANKAN SETELAH kode versi terbaru ter-deploy. Selama versi lama masih
-- berjalan, form masih mengirim kolom ini dan menjalankan migrasi lebih dulu
-- akan membuat penyimpanan tindak lanjut gagal.
--
-- TIDAK BISA DIBATALKAN.

-- Penjaga: batalkan kalau masih ada foto di tindak_lanjut yang belum terwakili
-- di riwayat progres. Migrasi 010 memindahkannya, tapi kalau ada baris yang
-- lolos, menjalankan drop akan menghilangkan penunjuk satu-satunya ke file itu
-- di storage — filenya tetap ada tapi tidak lagi bisa ditemukan dari aplikasi.
do $$
declare
  tertinggal integer;
begin
  select count(*) into tertinggal
  from tindak_lanjut t
  where t.foto_path is not null
    and not exists (
      select 1 from progres_tindak_lanjut p
      where p.tindak_lanjut_id = t.id and p.foto_path = t.foto_path
    );

  if tertinggal > 0 then
    raise exception
      'Dibatalkan: % tindak lanjut punya foto yang belum terwakili di riwayat progres. Periksa dulu sebelum drop.',
      tertinggal;
  end if;
end $$;

alter table tindak_lanjut drop column foto_path;

-- Verifikasi: harus 0
select count(*) as sisa_kolom
from information_schema.columns
where table_name = 'tindak_lanjut' and column_name = 'foto_path';
