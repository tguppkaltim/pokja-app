-- Apakah RLS benar-benar menolak sekretariat menyimpan realisasi?
--
-- HANYA MEMBACA — seluruhnya dibungkus begin/rollback, tidak ada yang tersimpan.
--
-- Latar belakang: policy di realisasi_kegiatan ternyata SUDAH versi migrasi 018
-- (realisasi_insert memakai boleh_kelola_kegiatan(kegiatan_id)), dan sebagai
-- super_admin penyimpanan realisasi berhasil. Yang belum terjawab: apakah
-- akun sekretariat masih ditolak, atau penolakan tadi berasal dari keadaan
-- sebelum migrasi 018 dijalankan.
--
-- auth.uid() bernilai null di SQL Editor, jadi identitas sekretariat dipasang
-- dulu lewat request.jwt.claims. Ganti 12 kalau id kegiatan ujinya berbeda.

begin;

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',  (select id from profiles where role = 'sekretariat' limit 1),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

select
  auth.uid()                                                    as saya,
  (select role::text from profiles where id = auth.uid())       as peran,
  (select pokja_id  from profiles where id = auth.uid())        as pokja_saya,
  (select pokja_id  from kegiatan where id = 12)                as pokja_kegiatan,
  boleh_kelola_kegiatan(12)                                     as boleh_kegiatan,
  boleh_kelola_pokja((select pokja_id from kegiatan where id = 12)) as boleh_pokja;

rollback;
