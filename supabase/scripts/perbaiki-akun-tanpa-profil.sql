-- Perbaiki akun yang ada di auth.users tapi tidak punya baris di profiles.
--
-- SKRIP SEKALI PAKAI — BUKAN MIGRASI. Diletakkan di supabase/scripts/ supaya
-- tidak ikut berjalan setiap kali basis data dipasang dari nol.
--
-- Latar belakang: versi lama Edge Function kelola-pengguna memakai update()
-- pada baris profiles yang diasumsikan sudah dibuat trigger handle_new_user.
-- Trigger itu sengaja menelan galatnya (migrasi 004), dan update() pada nol
-- baris bukan galat bagi PostgREST — sehingga akun bisa tercatat di auth.users
-- tanpa profil, dan aplikasi tetap melaporkan sukses. Akun seperti itu tidak
-- muncul di daftar Pengguna dan tidak bisa login.
--
-- Edge Function sudah diperbaiki memakai upsert, jadi ini hanya membereskan
-- akun yang terlanjur cacat.

-- ── 1. Lihat dulu akun mana saja yang cacat ─────────────────────────────────
select
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data ->> 'full_name' as nama_dari_metadata
from auth.users u
left join profiles p on p.id = u.id
where p.id is null
order by u.created_at;

-- ── 2. Perbaiki ─────────────────────────────────────────────────────────────
-- Peran TIDAK bisa ditebak dari data yang ada, jadi harus disebut satu per
-- satu. Ganti ISI_EMAIL_DARI_LANGKAH_1 dengan email dari hasil langkah 1,
-- sesuaikan nama dan perannya, lalu jalankan; ulangi kalau akun cacatnya
-- lebih dari satu.
--
-- Emailnya sengaja tidak ditulis di berkas ini: repositori ini publik.
--
-- pokja_id wajib diisi untuk peran yang terikat pokja ('operator' dan
-- 'sekretariat'); peran lain harus null. Lihat migrasi 018.

insert into profiles (id, full_name, email, role, pokja_id, is_active)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), 'Sekretariat'),
  u.email,
  'sekretariat'::user_role,
  (select id from pokja where name = 'Sekretariat'),
  true
from auth.users u
where u.email = 'ISI_EMAIL_DARI_LANGKAH_1'
  and not exists (select 1 from profiles p where p.id = u.id);

-- ── 3. Verifikasi ───────────────────────────────────────────────────────────
-- akun_tanpa_profil harus 0, dan barisnya harus muncul dengan peran yang benar.
select
  (select count(*)
     from auth.users u
     left join profiles p on p.id = u.id
    where p.id is null) as akun_tanpa_profil,
  (select count(*) from auth.users) as total_akun_auth,
  (select count(*) from profiles)   as total_profil;

select email, role, is_active, pokja_id
from profiles
where email = 'ISI_EMAIL_DARI_LANGKAH_1';
