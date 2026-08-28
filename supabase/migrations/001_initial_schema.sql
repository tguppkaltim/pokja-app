-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enum types
create type user_role as enum ('super_admin', 'operator', 'viewer');
create type status_realisasi as enum ('terlaksana', 'tidak_terlaksana');

-- Pokja table
create table pokja (
  id serial primary key,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

-- Program Pokok table
create table program_pokok (
  id serial primary key,
  pokja_id integer not null references pokja(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Profiles table (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'viewer',
  pokja_id integer references pokja(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Kegiatan table
create table kegiatan (
  id serial primary key,
  pokja_id integer not null references pokja(id) on delete cascade,
  program_pokok_id integer not null references program_pokok(id) on delete cascade,
  nama_kegiatan text not null,
  sasaran text not null default '',
  pelaksana text not null default '',
  anggaran bigint not null default 0,
  tahun integer not null,
  sched_jan boolean not null default false,
  sched_feb boolean not null default false,
  sched_mar boolean not null default false,
  sched_apr boolean not null default false,
  sched_mei boolean not null default false,
  sched_jun boolean not null default false,
  sched_jul boolean not null default false,
  sched_agu boolean not null default false,
  sched_sep boolean not null default false,
  sched_okt boolean not null default false,
  sched_nov boolean not null default false,
  sched_des boolean not null default false,
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- Realisasi Kegiatan table
create table realisasi_kegiatan (
  id serial primary key,
  kegiatan_id integer not null references kegiatan(id) on delete cascade,
  bulan integer not null check (bulan between 1 and 12),
  tahun integer not null,
  status status_realisasi not null,
  tanggal_pelaksanaan date,
  catatan text not null default '',
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique(kegiatan_id, bulan, tahun)
);

-- Evidence Files table
create table evidence_files (
  id serial primary key,
  realisasi_id integer not null references realisasi_kegiatan(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size bigint not null,
  uploaded_by uuid not null references profiles(id) on delete restrict,
  uploaded_at timestamptz not null default now()
);

-- Auto-create profile when user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    'viewer'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS Policies
alter table pokja enable row level security;
alter table program_pokok enable row level security;
alter table profiles enable row level security;
alter table kegiatan enable row level security;
alter table realisasi_kegiatan enable row level security;
alter table evidence_files enable row level security;

-- Pokja: all authenticated users can read
create policy "pokja_select" on pokja for select to authenticated using (true);
create policy "pokja_manage" on pokja for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'));

-- Program Pokok: all authenticated users can read
create policy "program_pokok_select" on program_pokok for select to authenticated using (true);
create policy "program_pokok_manage" on program_pokok for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'));

-- Profiles: users can read all, update own
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_update_own" on profiles for update to authenticated using (id = auth.uid());
create policy "profiles_manage" on profiles for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'super_admin'));

-- Kegiatan: all can read; operator can manage own pokja; super_admin can manage all
create policy "kegiatan_select" on kegiatan for select to authenticated using (true);
create policy "kegiatan_insert" on kegiatan for insert to authenticated
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
    or exists (select 1 from profiles where id = auth.uid() and role = 'operator' and pokja_id = kegiatan.pokja_id)
  );
create policy "kegiatan_update_delete" on kegiatan for update to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
    or exists (select 1 from profiles where id = auth.uid() and role = 'operator' and pokja_id = kegiatan.pokja_id)
  );
create policy "kegiatan_delete" on kegiatan for delete to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
    or (created_by = auth.uid() and exists (select 1 from profiles where id = auth.uid() and role = 'operator'))
  );

-- Realisasi: all can read; operator can manage own pokja's kegiatan; super_admin all
create policy "realisasi_select" on realisasi_kegiatan for select to authenticated using (true);
create policy "realisasi_insert" on realisasi_kegiatan for insert to authenticated
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
    or exists (
      select 1 from profiles p join kegiatan k on k.pokja_id = p.pokja_id
      where p.id = auth.uid() and p.role = 'operator' and k.id = realisasi_kegiatan.kegiatan_id
    )
  );
create policy "realisasi_update" on realisasi_kegiatan for update to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
    or (created_by = auth.uid())
  );

-- Evidence: all can read; uploader can delete own
create policy "evidence_select" on evidence_files for select to authenticated using (true);
create policy "evidence_insert" on evidence_files for insert to authenticated with check (uploaded_by = auth.uid());
create policy "evidence_delete" on evidence_files for delete to authenticated
  using (
    uploaded_by = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
  );
