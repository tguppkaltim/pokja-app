-- Lokus pada rencana kegiatan, dan lokasi pada realisasi.
--
-- Dua hal berbeda, sengaja dipisah:
--   lokus  — wilayah SASARAN yang direncanakan, dipilih dari daftar baku
--   lokasi — TEMPAT pelaksanaan sebenarnya, diketik bebas saat melapor
--
-- Lokus terstruktur karena pembagian administratif Kaltim tetap dan terbatas,
-- sehingga rekap per wilayah bisa dipercaya. Lokasi tidak bisa didaftar —
-- nama gedung, balai desa, atau ruang rapat tidak terbatas jumlahnya.

begin;

-- ── 1. Daftar wilayah ───────────────────────────────────────────────────────

create table if not exists wilayah (
  id serial primary key,
  nama text not null,
  jenis text not null check (jenis in ('kabupaten', 'kota')),
  -- Urutan tampil: kabupaten lebih dulu, lalu kota, masing-masing menurut abjad.
  urutan integer not null default 0,
  created_at timestamptz not null default now(),
  unique (nama)
);

comment on table wilayah is
  'Kabupaten/kota Kalimantan Timur. Ditetapkan pembagian administratif, bukan daftar yang ditambah pengurus — karena itu tidak ada halaman admin untuk tabel ini.';

-- Sepuluh kabupaten/kota Kalimantan Timur. Berbeda dari daftar mitra/OPD, ini
-- data administratif publik yang stabil, jadi diisikan langsung.
insert into wilayah (nama, jenis, urutan) values
  ('Kabupaten Berau',               'kabupaten', 1),
  ('Kabupaten Kutai Barat',         'kabupaten', 2),
  ('Kabupaten Kutai Kartanegara',   'kabupaten', 3),
  ('Kabupaten Kutai Timur',         'kabupaten', 4),
  ('Kabupaten Mahakam Ulu',         'kabupaten', 5),
  ('Kabupaten Paser',               'kabupaten', 6),
  ('Kabupaten Penajam Paser Utara', 'kabupaten', 7),
  ('Kota Balikpapan',               'kota',      8),
  ('Kota Bontang',                  'kota',      9),
  ('Kota Samarinda',                'kota',     10)
on conflict (nama) do nothing;

-- ── 2. Lokus: penghubung kegiatan ↔ wilayah ─────────────────────────────────

create table if not exists kegiatan_wilayah (
  kegiatan_id integer not null references kegiatan(id) on delete cascade,
  -- restrict, bukan cascade: menghapus satu wilayah tidak boleh diam-diam
  -- memutus lokus kegiatan yang sudah tercatat.
  wilayah_id integer not null references wilayah(id) on delete restrict,
  primary key (kegiatan_id, wilayah_id)
);

create index if not exists kegiatan_wilayah_wilayah_idx on kegiatan_wilayah(wilayah_id);

-- ── 3. Lokasi pelaksanaan pada realisasi ────────────────────────────────────

-- not null default '' mengikuti kolom teks lain di sistem ini (catatan,
-- sasaran, deskripsi). Kolom yang bisa null memaksa penjagaan tiga keadaan
-- untuk perbedaan yang tidak berarti antara "kosong" dan "belum diisi".
alter table realisasi_kegiatan
  add column if not exists lokasi text not null default '';

comment on column realisasi_kegiatan.lokasi is
  'Tempat pelaksanaan sebenarnya. Opsional; berbeda dari lokus yang merupakan wilayah sasaran pada rencana.';

-- ── 4. RLS ──────────────────────────────────────────────────────────────────

alter table wilayah enable row level security;
alter table kegiatan_wilayah enable row level security;

drop policy if exists "wilayah_select" on wilayah;
drop policy if exists "wilayah_manage" on wilayah;
drop policy if exists "kegiatan_wilayah_select" on kegiatan_wilayah;
drop policy if exists "kegiatan_wilayah_manage" on kegiatan_wilayah;

create policy "wilayah_select" on wilayah
  for select to authenticated using (true);
create policy "wilayah_manage" on wilayah
  for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'));

-- Memakai fungsi penolong dari migrasi 018, jadi aturan siapa boleh mengubah
-- kegiatan hanya perlu didefinisikan di satu tempat.
create policy "kegiatan_wilayah_select" on kegiatan_wilayah
  for select to authenticated using (true);
create policy "kegiatan_wilayah_manage" on kegiatan_wilayah
  for all to authenticated
  using (boleh_kelola_kegiatan(kegiatan_wilayah.kegiatan_id))
  with check (boleh_kelola_kegiatan(kegiatan_wilayah.kegiatan_id));

commit;

-- ── Verifikasi ──────────────────────────────────────────────────────────────
-- wilayah harus 10, kolom_lokasi harus 1, policy_wilayah harus 4.
select
  (select count(*) from wilayah)                                as wilayah_harus_10,
  (select count(*) from wilayah where jenis = 'kabupaten')      as kabupaten_harus_7,
  (select count(*) from wilayah where jenis = 'kota')           as kota_harus_3,
  (select count(*) from information_schema.columns
     where table_name = 'realisasi_kegiatan' and column_name = 'lokasi') as kolom_lokasi_harus_1,
  (select count(*) from pg_policies
     where tablename in ('wilayah', 'kegiatan_wilayah'))        as policy_harus_4;
