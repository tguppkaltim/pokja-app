-- Riwayat progress penyelesaian tindak lanjut.
--
-- Aman dijalankan berulang.

-- ── Tabel ───────────────────────────────────────────────────────────────────
create table if not exists progres_tindak_lanjut (
  id serial primary key,
  tindak_lanjut_id integer not null references tindak_lanjut(id) on delete cascade,
  status_baru text not null check (status_baru in ('open', 'on_progress', 'closed', 'dibatalkan')),
  catatan text not null default '',
  foto_path text,
  dibuat_oleh uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists progres_tindak_lanjut_idx
  on progres_tindak_lanjut (tindak_lanjut_id, created_at);

alter table progres_tindak_lanjut enable row level security;

-- ── Trigger sinkronisasi ────────────────────────────────────────────────────
-- Status dan closed_date pada tindak_lanjut diturunkan dari entri progres
-- terakhir. Ditaruh di database, bukan aplikasi, supaya keduanya tidak mungkin
-- melenceng dari riwayatnya dan logikanya tidak terduplikasi di dua tempat.
--
-- Sengaja BUKAN security definer: RLS tindak_lanjut tetap berlaku bagi
-- pemanggil. Bila RLS menolak, insert entri ikut gagal — gagal keras lebih baik
-- daripada riwayat tersimpan tanpa status berubah.
create or replace function sync_status_dari_progres()
returns trigger as $$
begin
  update tindak_lanjut
  set status = new.status_baru,
      -- now() adalah UTC. Di WITA, 1 September pukul 00:30 lokal masih
      -- 31 Agustus menurut UTC — pergeseran hari yang sama seperti bug
      -- toISOString() dulu. Jadi dikonversi dulu ke zona lokal.
      closed_date = case
        when new.status_baru = 'closed'
        then (new.created_at at time zone 'Asia/Makassar')::date
        else null
      end,
      updated_at = new.created_at
  where id = new.tindak_lanjut_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_sync_status_dari_progres on progres_tindak_lanjut;
create trigger trg_sync_status_dari_progres
  after insert on progres_tindak_lanjut
  for each row execute function sync_status_dari_progres();

-- ── Isi riwayat awal dari data yang sudah ada ───────────────────────────────
-- Supaya tindak lanjut yang sudah ada tidak berriwayat kosong. Pembuatnya
-- diambil dari rapat.created_by karena tindak_lanjut tidak menyimpan pembuat.
--
-- Trigger di atas akan menulis ulang status dan closed_date dengan nilai yang
-- sama, jadi tidak ada yang berubah.
insert into progres_tindak_lanjut (tindak_lanjut_id, status_baru, catatan, foto_path, dibuat_oleh, created_at)
select t.id, t.status, 'Entri awal dari migrasi riwayat progress.', t.foto_path, r.created_by, t.created_at
from tindak_lanjut t
join rapat r on r.id = t.rapat_id
where not exists (select 1 from progres_tindak_lanjut p where p.tindak_lanjut_id = t.id);

-- ── Policy ──────────────────────────────────────────────────────────────────
drop policy if exists "progres_select" on progres_tindak_lanjut;
drop policy if exists "progres_insert" on progres_tindak_lanjut;
drop policy if exists "progres_delete" on progres_tindak_lanjut;

create policy "progres_select" on progres_tindak_lanjut
  for select to authenticated using (true);

-- Boleh menambah bila boleh mengubah tindak lanjut induknya.
create policy "progres_insert" on progres_tindak_lanjut
  for insert to authenticated
  with check (
    exists (
      select 1 from tindak_lanjut t, profiles p
      where t.id = progres_tindak_lanjut.tindak_lanjut_id
        and p.id = auth.uid()
        and (
          p.role in ('super_admin', 'sekretariat')
          or (p.role = 'operator' and t.pic = 'pokja' and t.pic_pokja_id = p.pokja_id)
        )
    )
  );

-- Sengaja TIDAK ADA policy update: riwayat yang bisa disunting kehilangan
-- maknanya. Hapus hanya untuk super_admin, untuk kasus salah input.
create policy "progres_delete" on progres_tindak_lanjut
  for delete to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin'));

-- ── Verifikasi ──────────────────────────────────────────────────────────────
select
  (select count(*) from progres_tindak_lanjut) as jumlah_entri,
  (select count(*) from tindak_lanjut) as jumlah_tindak_lanjut,
  (select count(*) from tindak_lanjut t
     where not exists (select 1 from progres_tindak_lanjut p where p.tindak_lanjut_id = t.id))
    as tanpa_riwayat,
  (select count(*) from pg_policies where tablename = 'progres_tindak_lanjut') as jumlah_policy;
