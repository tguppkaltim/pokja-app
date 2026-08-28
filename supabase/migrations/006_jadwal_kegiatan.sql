-- Jadwal kegiatan per tanggal, menggantikan 12 kolom boolean sched_*.
--
-- Tabel terpisah, bukan kolom date[], karena realisasi perlu menunjuk satu
-- sesi tertentu dan kolom array tidak bisa jadi target foreign key.
--
-- Kolom sched_* SENGAJA TIDAK di-drop di migrasi ini. Penghapusan kolom di
-- produksi tidak bisa dibatalkan; menyusul di migrasi terpisah setelah semua
-- kode pindah dan terbukti stabil.
--
-- SELURUH SKRIP INI AMAN DIJALANKAN BERULANG. Percobaan pertama berhenti
-- setelah tabel terbuat, jadi setiap langkah dibuat idempoten dan pembuatan
-- policy ditaruh paling akhir supaya kegagalan di sana tidak memblokir
-- perpindahan data.

-- ── 1. Tabel jadwal ─────────────────────────────────────────────────────────
create table if not exists jadwal_kegiatan (
  id serial primary key,
  kegiatan_id integer not null references kegiatan(id) on delete cascade,
  tanggal date not null,
  created_at timestamptz not null default now(),
  unique (kegiatan_id, tanggal)
);

create index if not exists jadwal_kegiatan_kegiatan_id_idx on jadwal_kegiatan (kegiatan_id);
create index if not exists jadwal_kegiatan_tanggal_idx on jadwal_kegiatan (tanggal);

alter table jadwal_kegiatan enable row level security;

-- ── 2. Isi jadwal dari kolom sched_* yang ada ───────────────────────────────
-- Tiap bulan yang dicentang jadi satu sesi bertanggal 1 bulan tersebut.
-- Sengaja union all, bukan cross join lateral (values ...): konstruksi itu
-- merujuk kolom dari relasi luar dan jadi tersangka utama gagalnya percobaan
-- pertama. Bentuk ini lebih panjang tapi tidak ambigu.
insert into jadwal_kegiatan (kegiatan_id, tanggal)
select id, make_date(tahun,  1, 1) from kegiatan where sched_jan
union all select id, make_date(tahun,  2, 1) from kegiatan where sched_feb
union all select id, make_date(tahun,  3, 1) from kegiatan where sched_mar
union all select id, make_date(tahun,  4, 1) from kegiatan where sched_apr
union all select id, make_date(tahun,  5, 1) from kegiatan where sched_mei
union all select id, make_date(tahun,  6, 1) from kegiatan where sched_jun
union all select id, make_date(tahun,  7, 1) from kegiatan where sched_jul
union all select id, make_date(tahun,  8, 1) from kegiatan where sched_agu
union all select id, make_date(tahun,  9, 1) from kegiatan where sched_sep
union all select id, make_date(tahun, 10, 1) from kegiatan where sched_okt
union all select id, make_date(tahun, 11, 1) from kegiatan where sched_nov
union all select id, make_date(tahun, 12, 1) from kegiatan where sched_des
on conflict (kegiatan_id, tanggal) do nothing;

-- ── 3. Sambungkan realisasi ke sesi ─────────────────────────────────────────
alter table realisasi_kegiatan
  add column if not exists jadwal_id integer references jadwal_kegiatan(id) on delete cascade;

-- Realisasi yang bulannya cocok dengan sesi terjadwal.
update realisasi_kegiatan r
set jadwal_id = j.id
from jadwal_kegiatan j
where r.jadwal_id is null
  and j.kegiatan_id = r.kegiatan_id
  and extract(month from j.tanggal) = r.bulan
  and extract(year from j.tanggal) = r.tahun;

-- Realisasi yang dilaporkan di luar rencana belum punya sesi. Dibuatkan
-- sesinya supaya tidak menggantung tanpa jadwal_id.
insert into jadwal_kegiatan (kegiatan_id, tanggal)
select distinct r.kegiatan_id,
       coalesce(r.tanggal_pelaksanaan, make_date(r.tahun, r.bulan, 1))
from realisasi_kegiatan r
where r.jadwal_id is null
on conflict (kegiatan_id, tanggal) do nothing;

update realisasi_kegiatan r
set jadwal_id = j.id
from jadwal_kegiatan j
where r.jadwal_id is null
  and j.kegiatan_id = r.kegiatan_id
  and j.tanggal = coalesce(r.tanggal_pelaksanaan, make_date(r.tahun, r.bulan, 1));

-- ── 4. Ganti kunci keunikan ─────────────────────────────────────────────────
-- unique(kegiatan_id, bulan, tahun) justru yang membuat dua sesi di bulan sama
-- mustahil punya realisasi masing-masing, jadi harus dibuang.
alter table realisasi_kegiatan
  drop constraint if exists realisasi_kegiatan_kegiatan_id_bulan_tahun_key;

-- Satu sesi maksimal satu realisasi. Inilah yang mencegah double input di
-- level database, bukan sekadar di UI.
alter table realisasi_kegiatan
  drop constraint if exists realisasi_satu_per_sesi;
alter table realisasi_kegiatan
  add constraint realisasi_satu_per_sesi unique (jadwal_id);

-- ── 5. Policy, sengaja paling akhir ─────────────────────────────────────────
-- Mengikuti pola kegiatan di migrasi 001. Kalau bagian ini gagal, langkah
-- 1-4 sudah selesai dan aplikasi tetap berfungsi untuk super_admin;
-- laporkan errornya supaya policy-nya bisa ditulis ulang.
drop policy if exists "jadwal_select" on jadwal_kegiatan;
drop policy if exists "jadwal_manage" on jadwal_kegiatan;

create policy "jadwal_select" on jadwal_kegiatan for select to authenticated using (true);

create policy "jadwal_manage" on jadwal_kegiatan for all to authenticated
  using (
    exists (
      select 1 from kegiatan k, profiles p
      where k.id = jadwal_kegiatan.kegiatan_id
        and p.id = auth.uid()
        and (p.role = 'super_admin' or (p.role = 'operator' and p.pokja_id = k.pokja_id))
    )
  )
  with check (
    exists (
      select 1 from kegiatan k, profiles p
      where k.id = jadwal_kegiatan.kegiatan_id
        and p.id = auth.uid()
        and (p.role = 'super_admin' or (p.role = 'operator' and p.pokja_id = k.pokja_id))
    )
  );

-- ── 6. Verifikasi ───────────────────────────────────────────────────────────
select
  (select count(*) from jadwal_kegiatan) as jumlah_sesi,
  (select count(*) from realisasi_kegiatan) as jumlah_realisasi,
  (select count(*) from realisasi_kegiatan where jadwal_id is null) as realisasi_tanpa_sesi,
  (select count(*) from pg_policies where tablename = 'jadwal_kegiatan') as jumlah_policy;
