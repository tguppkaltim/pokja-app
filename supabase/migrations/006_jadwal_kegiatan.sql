-- Jadwal kegiatan per tanggal, menggantikan 12 kolom boolean sched_*.
--
-- Tabel terpisah, bukan kolom date[], karena realisasi perlu menunjuk satu
-- sesi tertentu dan kolom array tidak bisa jadi target foreign key.
--
-- Kolom sched_* SENGAJA TIDAK di-drop di migrasi ini. Penghapusan kolom di
-- produksi tidak bisa dibatalkan; menyusul di migrasi terpisah setelah semua
-- kode pindah dan terbukti stabil.

-- ── 1. Tabel jadwal ─────────────────────────────────────────────────────────
create table jadwal_kegiatan (
  id serial primary key,
  kegiatan_id integer not null references kegiatan(id) on delete cascade,
  tanggal date not null,
  created_at timestamptz not null default now(),
  unique (kegiatan_id, tanggal)
);

create index jadwal_kegiatan_kegiatan_id_idx on jadwal_kegiatan (kegiatan_id);
create index jadwal_kegiatan_tanggal_idx on jadwal_kegiatan (tanggal);

alter table jadwal_kegiatan enable row level security;

-- Mengikuti pola kegiatan: semua yang login boleh membaca; hanya super_admin
-- atau operator pokja pemilik yang boleh mengubah.
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

-- ── 2. Isi jadwal dari kolom sched_* yang ada ───────────────────────────────
-- Tiap bulan yang dicentang jadi satu sesi bertanggal 1 bulan tersebut.
insert into jadwal_kegiatan (kegiatan_id, tanggal)
select k.id, make_date(k.tahun, b.bulan, 1)
from kegiatan k
cross join lateral (values
  (1, k.sched_jan), (2, k.sched_feb), (3, k.sched_mar), (4, k.sched_apr),
  (5, k.sched_mei), (6, k.sched_jun), (7, k.sched_jul), (8, k.sched_agu),
  (9, k.sched_sep), (10, k.sched_okt), (11, k.sched_nov), (12, k.sched_des)
) as b(bulan, dijadwalkan)
where b.dijadwalkan
on conflict (kegiatan_id, tanggal) do nothing;

-- ── 3. Sambungkan realisasi ke sesi ─────────────────────────────────────────
alter table realisasi_kegiatan
  add column jadwal_id integer references jadwal_kegiatan(id) on delete cascade;

-- Realisasi yang bulannya cocok dengan sesi terjadwal.
update realisasi_kegiatan r
set jadwal_id = j.id
from jadwal_kegiatan j
where j.kegiatan_id = r.kegiatan_id
  and extract(month from j.tanggal) = r.bulan
  and extract(year from j.tanggal) = r.tahun;

-- Realisasi yang tidak punya sesi terjadwal (mis. dilaporkan di luar rencana)
-- dibuatkan sesinya, supaya tidak menggantung tanpa jadwal_id.
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
  add constraint realisasi_satu_per_sesi unique (jadwal_id);

-- ── 5. Verifikasi ───────────────────────────────────────────────────────────
select
  (select count(*) from jadwal_kegiatan) as jumlah_sesi,
  (select count(*) from realisasi_kegiatan) as jumlah_realisasi,
  (select count(*) from realisasi_kegiatan where jadwal_id is null) as realisasi_tanpa_sesi;
