-- Sekretariat diperlakukan seperti pokja: boleh menyusun rencana kegiatan dan
-- mengisi realisasi, tapi hanya untuk pokjanya sendiri.
--
-- Sejak migrasi 012, Sekretariat adalah pokja tersendiri. Yang kurang hanyalah
-- hak menulis: policy lama hanya menyebut 'operator'.
--
-- Aturannya TIDAK ditulis ulang di sembilan tempat. Dua fungsi penolong di
-- bawah ini memegang definisinya, dan seluruh policy memanggilnya. Menambah
-- peran terikat berikutnya cukup menyunting satu baris — bukan menyisir
-- sembilan policy dan berharap tidak ada yang terlewat.
--
-- Cerminannya di aplikasi ada di pokja/src/lib/hak-akses.ts. Keduanya harus
-- dijaga sejalan, tapi hanya yang di sini yang benar-benar menegakkan aturan:
-- menyembunyikan tombol tidak menghentikan siapa pun yang memanggil API
-- langsung.
--
-- TIDAK menyentuh notulensi (migrasi 009 dan 010): di sana sekretariat sudah
-- punya hak penuh atas seluruh tindak lanjut, dan itu memang disengaja.
-- Juga tidak menyentuh evidence_files, yang aturannya berbasis pengunggah.

begin;

-- ── 1. Definisi tunggal ─────────────────────────────────────────────────────

create or replace function boleh_kelola_pokja(target_pokja integer)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and (
        p.role = 'super_admin'
        -- Peran yang terikat pada satu pokja. Tambahkan di sini saja.
        or (p.role in ('operator', 'sekretariat') and p.pokja_id = target_pokja)
      )
  );
$$;

comment on function boleh_kelola_pokja(integer) is
  'Boleh mengubah data milik pokja ini? super_admin selalu boleh; operator dan sekretariat hanya untuk pokjanya sendiri.';

create or replace function boleh_kelola_kegiatan(target_kegiatan integer)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from kegiatan k
    where k.id = target_kegiatan and boleh_kelola_pokja(k.pokja_id)
  );
$$;

comment on function boleh_kelola_kegiatan(integer) is
  'Boleh mengubah kegiatan ini beserta turunannya (jadwal, realisasi, kaitan mitra)?';

-- ── 2. Kegiatan ─────────────────────────────────────────────────────────────

-- Setiap nama yang dibuat di bawah ikut dihapus lebih dulu, supaya migrasi ini
-- aman dijalankan ulang. `kegiatan_update` juga dihapus meski tidak ada di
-- berkas migrasi mana pun: basis data ternyata memakainya, bukan
-- `kegiatan_update_delete` seperti yang ditulis migrasi 001. Keduanya
-- disebutkan agar migrasi ini berlaku pada kedua keadaan.
drop policy if exists "kegiatan_insert" on kegiatan;
drop policy if exists "kegiatan_update" on kegiatan;
drop policy if exists "kegiatan_update_delete" on kegiatan;
drop policy if exists "kegiatan_delete" on kegiatan;

create policy "kegiatan_insert" on kegiatan
  for insert to authenticated
  with check (boleh_kelola_pokja(kegiatan.pokja_id));

create policy "kegiatan_update" on kegiatan
  for update to authenticated
  using (boleh_kelola_pokja(kegiatan.pokja_id))
  with check (boleh_kelola_pokja(kegiatan.pokja_id));

-- Penghapusan tetap lebih ketat daripada penyuntingan, seperti sebelumnya:
-- peran terikat hanya boleh menghapus kegiatan yang dibuatnya sendiri.
create policy "kegiatan_delete" on kegiatan
  for delete to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
    or (kegiatan.created_by = auth.uid() and boleh_kelola_pokja(kegiatan.pokja_id))
  );

-- ── 3. Realisasi ────────────────────────────────────────────────────────────

drop policy if exists "realisasi_insert" on realisasi_kegiatan;
drop policy if exists "realisasi_update" on realisasi_kegiatan;

create policy "realisasi_insert" on realisasi_kegiatan
  for insert to authenticated
  with check (boleh_kelola_kegiatan(realisasi_kegiatan.kegiatan_id));

create policy "realisasi_update" on realisasi_kegiatan
  for update to authenticated
  using (boleh_kelola_kegiatan(realisasi_kegiatan.kegiatan_id))
  with check (boleh_kelola_kegiatan(realisasi_kegiatan.kegiatan_id));

-- ── 4. Jadwal dan kaitan mitra ──────────────────────────────────────────────

drop policy if exists "jadwal_manage" on jadwal_kegiatan;
create policy "jadwal_manage" on jadwal_kegiatan
  for all to authenticated
  using (boleh_kelola_kegiatan(jadwal_kegiatan.kegiatan_id))
  with check (boleh_kelola_kegiatan(jadwal_kegiatan.kegiatan_id));

drop policy if exists "kegiatan_mitra_manage" on kegiatan_mitra;
create policy "kegiatan_mitra_manage" on kegiatan_mitra
  for all to authenticated
  using (boleh_kelola_kegiatan(kegiatan_mitra.kegiatan_id))
  with check (boleh_kelola_kegiatan(kegiatan_mitra.kegiatan_id));

-- ── 5. Tautkan akun sekretariat ke Pokja Sekretariat ────────────────────────
-- Tanpa pokja_id, pembatasan di atas tidak punya pegangan dan sekretariat
-- tidak bisa menyentuh apa pun.
do $$
declare
  id_sekretariat integer;
  jumlah integer;
begin
  select id into id_sekretariat from pokja where name = 'Sekretariat';
  if id_sekretariat is null then
    raise exception 'Pokja bernama "Sekretariat" tidak ditemukan; jalankan migrasi 012 lebih dulu.';
  end if;

  update profiles set pokja_id = id_sekretariat
  where role = 'sekretariat' and pokja_id is distinct from id_sekretariat;
  get diagnostics jumlah = row_count;
  raise notice '% akun sekretariat ditautkan ke pokja id %.', jumlah, id_sekretariat;
end $$;

commit;

-- ── Verifikasi ──────────────────────────────────────────────────────────────
-- akun_sekretariat_tanpa_pokja harus 0, dan kelima policy harus ada.
select
  (select count(*) from profiles
    where role = 'sekretariat' and pokja_id is null)          as akun_sekretariat_tanpa_pokja,
  (select count(*) from pg_policies
    where tablename = 'kegiatan'
      and policyname in ('kegiatan_insert','kegiatan_update','kegiatan_delete')) as policy_kegiatan,
  (select count(*) from pg_policies
    where tablename = 'realisasi_kegiatan'
      and policyname in ('realisasi_insert','realisasi_update'))                 as policy_realisasi;
