-- Insert profiles untuk auth users yang belum punya profil
insert into profiles (id, full_name, email, role)
select
  u.id,
  u.email,
  u.email,
  'viewer'::user_role
from auth.users u
left join profiles p on p.id = u.id
where p.id is null;

-- Update data profil yang benar
update profiles set
  full_name = 'Siti Rahayu, S.Sos',
  role      = 'super_admin',
  pokja_id  = null
where email = 'admin@pkk-kaltim.go.id';

update profiles set
  full_name = 'Dewi Kartika, S.Pd',
  role      = 'operator',
  pokja_id  = 1
where email = 'pokja1@pkk-kaltim.go.id';

update profiles set
  full_name = 'Rina Susanti, M.Pd',
  role      = 'operator',
  pokja_id  = 2
where email = 'pokja2@pkk-kaltim.go.id';

update profiles set
  full_name = 'Yuni Pratiwi, S.T',
  role      = 'operator',
  pokja_id  = 3
where email = 'pokja3@pkk-kaltim.go.id';

update profiles set
  full_name = 'dr. Aminah Wulandari',
  role      = 'operator',
  pokja_id  = 4
where email = 'pokja4@pkk-kaltim.go.id';

update profiles set
  full_name = 'Hj. Norbaiti Isran, M.Si',
  role      = 'viewer',
  pokja_id  = null
where email = 'ketua@pkk-kaltim.go.id';

-- Verifikasi
select full_name, email, role, pokja_id from profiles order by role, pokja_id;
