-- Notulensi rapat dan pelacakan tindak lanjut.
--
-- JALANKAN SETELAH 008 SELESAI. Policy di bawah menyebut role 'sekretariat',
-- dan Postgres menolak nilai enum baru dipakai di transaksi yang sama dengan
-- statement yang menambahkannya.
--
-- Aman dijalankan berulang.

-- ── Rapat ───────────────────────────────────────────────────────────────────
create table if not exists rapat (
  id serial primary key,
  tanggal date not null,
  judul text not null,
  peserta text not null default '',
  ringkasan text not null default '',
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists rapat_tanggal_idx on rapat (tanggal desc);

-- ── Tindak lanjut ───────────────────────────────────────────────────────────
-- PIC dipecah dua kolom, bukan satu teks 'Pokja I': Master Pokja mengizinkan
-- nama pokja diubah, dan teks yang tersimpan akan jadi basi. Foreign key
-- membuat namanya selalu ikut.
create table if not exists tindak_lanjut (
  id serial primary key,
  rapat_id integer not null references rapat(id) on delete cascade,
  uraian text not null,
  pic text not null check (pic in ('pokja', 'sekretariat')),
  pic_pokja_id integer references pokja(id) on delete restrict,
  open_date date not null default current_date,
  target_closed date,
  closed_date date,
  status text not null default 'open'
    check (status in ('open', 'on_progress', 'closed', 'dibatalkan')),
  keterangan text not null default '',
  foto_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  -- Mencegah kondisi mustahil: Sekretariat tidak punya pokja, dan PIC pokja
  -- wajib menyebut pokjanya.
  constraint pic_konsisten check (
    (pic = 'pokja' and pic_pokja_id is not null) or
    (pic = 'sekretariat' and pic_pokja_id is null)
  )
);

create index if not exists tindak_lanjut_rapat_idx on tindak_lanjut (rapat_id);
create index if not exists tindak_lanjut_status_idx on tindak_lanjut (status);
create index if not exists tindak_lanjut_pic_idx on tindak_lanjut (pic, pic_pokja_id);

alter table rapat enable row level security;
alter table tindak_lanjut enable row level security;

-- ── Policy ──────────────────────────────────────────────────────────────────
-- Semua yang login boleh membaca; menulis dibatasi peran.
drop policy if exists "rapat_select" on rapat;
drop policy if exists "rapat_manage" on rapat;
drop policy if exists "tindak_lanjut_select" on tindak_lanjut;
drop policy if exists "tindak_lanjut_manage" on tindak_lanjut;

create policy "rapat_select" on rapat for select to authenticated using (true);

-- Sekretariat adalah pemilik notulensi, jadi hak tulisnya setara super_admin
-- untuk modul ini.
create policy "rapat_manage" on rapat for all to authenticated
  using (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('super_admin', 'sekretariat'))
  )
  with check (
    exists (select 1 from profiles p where p.id = auth.uid()
            and p.role in ('super_admin', 'sekretariat'))
  );

create policy "tindak_lanjut_select" on tindak_lanjut for select to authenticated using (true);

-- super_admin dan sekretariat: seluruh baris.
-- operator: hanya baris ber-PIC pokjanya sendiri.
create policy "tindak_lanjut_manage" on tindak_lanjut for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (
          p.role in ('super_admin', 'sekretariat')
          or (p.role = 'operator'
              and tindak_lanjut.pic = 'pokja'
              and tindak_lanjut.pic_pokja_id = p.pokja_id)
        )
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (
          p.role in ('super_admin', 'sekretariat')
          or (p.role = 'operator'
              and tindak_lanjut.pic = 'pokja'
              and tindak_lanjut.pic_pokja_id = p.pokja_id)
        )
    )
  );

-- ── Verifikasi ──────────────────────────────────────────────────────────────
-- enum_range dipanggil di sini, bukan di 008: membaca nilai enum di transaksi
-- yang sama dengan yang menambahkannya ditolak Postgres.
select
  (select enum_range(null::user_role)::text) as nilai_role,
  (select count(*) from pg_policies where tablename = 'rapat') as policy_rapat,
  (select count(*) from pg_policies where tablename = 'tindak_lanjut') as policy_tindak_lanjut,
  (select count(*) from rapat) as jumlah_rapat,
  (select count(*) from tindak_lanjut) as jumlah_tindak_lanjut;
