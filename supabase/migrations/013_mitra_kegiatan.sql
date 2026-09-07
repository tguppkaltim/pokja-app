-- Mitra/OPD yang menggandeng kegiatan.
--
-- Satu kegiatan bisa melibatkan beberapa OPD sekaligus — Cek Kesehatan Gratis
-- misalnya menggandeng Dinas Kesehatan dan BKKBN — jadi kaitannya lewat tabel
-- penghubung, bukan satu kolom penunjuk di tabel kegiatan. Hanya bentuk ini
-- yang bisa menjawab "kegiatan apa saja yang melibatkan Dinas Kesehatan"
-- dengan benar.
--
-- Tabel mitra sengaja dibiarkan KOSONG. Daftar OPD Kalimantan Timur diisi
-- sendiri lewat menu Administrasi > Master Mitra; mengarang isinya di sini
-- justru lebih buruk daripada kosong.

begin;

-- ── 1. Daftar mitra ─────────────────────────────────────────────────────────

create table if not exists mitra (
  id serial primary key,
  nama text not null,
  -- Singkatan dipakai di tabel yang sempit; nama panjang disimpan utuh supaya
  -- laporan dan cetakan tetap memakai nama resminya.
  singkatan text not null default '',
  -- Mitra yang tidak lagi bekerja sama dinonaktifkan, bukan dihapus: kegiatan
  -- tahun-tahun sebelumnya tetap perlu menyebut namanya.
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  unique (nama)
);

comment on column mitra.aktif is
  'False berarti tidak muncul lagi sebagai pilihan pada kegiatan baru, tapi kaitan yang sudah ada tetap utuh.';

-- ── 2. Penghubung kegiatan ↔ mitra ──────────────────────────────────────────

create table if not exists kegiatan_mitra (
  kegiatan_id integer not null references kegiatan(id) on delete cascade,
  -- restrict, bukan cascade: menghapus satu OPD tidak boleh diam-diam
  -- memutus kaitannya dari kegiatan yang sudah tercatat. Halaman Master Mitra
  -- menampilkan galat dan menyarankan menonaktifkan alih-alih menghapus.
  mitra_id integer not null references mitra(id) on delete restrict,
  primary key (kegiatan_id, mitra_id)
);

create index if not exists kegiatan_mitra_mitra_idx on kegiatan_mitra(mitra_id);

-- ── 3. RLS ──────────────────────────────────────────────────────────────────

alter table mitra enable row level security;
alter table kegiatan_mitra enable row level security;

drop policy if exists "mitra_select" on mitra;
drop policy if exists "mitra_manage" on mitra;
drop policy if exists "kegiatan_mitra_select" on kegiatan_mitra;
drop policy if exists "kegiatan_mitra_manage" on kegiatan_mitra;

-- Daftar mitra dibaca semua yang login, dikelola super_admin saja —
-- sama seperti master pokja dan master program.
create policy "mitra_select" on mitra
  for select to authenticated using (true);
create policy "mitra_manage" on mitra
  for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'));

-- Pasangan kegiatan–mitra mengikuti hak atas kegiatannya, bukan hak atas
-- daftar mitra: operator boleh menentukan mitra untuk kegiatan pokjanya
-- sendiri meski tidak boleh menyunting daftar OPD-nya. Pola ini sama dengan
-- jadwal_kegiatan di migrasi 006.
create policy "kegiatan_mitra_select" on kegiatan_mitra
  for select to authenticated using (true);

create policy "kegiatan_mitra_manage" on kegiatan_mitra
  for all to authenticated
  using (
    exists (
      select 1 from kegiatan k, profiles p
      where k.id = kegiatan_mitra.kegiatan_id
        and p.id = auth.uid()
        and (p.role = 'super_admin' or (p.role = 'operator' and p.pokja_id = k.pokja_id))
    )
  )
  with check (
    exists (
      select 1 from kegiatan k, profiles p
      where k.id = kegiatan_mitra.kegiatan_id
        and p.id = auth.uid()
        and (p.role = 'super_admin' or (p.role = 'operator' and p.pokja_id = k.pokja_id))
    )
  );

commit;

-- Verifikasi — mitra dan kaitan harus 0, tabel dan policy harus ada.
select
  (select count(*) from mitra)                                            as mitra,
  (select count(*) from kegiatan_mitra)                                   as kaitan,
  (select count(*) from pg_policies where tablename = 'mitra')            as policy_mitra,
  (select count(*) from pg_policies where tablename = 'kegiatan_mitra')   as policy_kaitan;
