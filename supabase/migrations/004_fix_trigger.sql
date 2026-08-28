-- Ganti trigger dengan versi yang tidak memblokir pembuatan user jika insert profiles gagal
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, ''),
    coalesce(new.email, ''),
    'viewer'
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  return new;
end;
$$ language plpgsql security definer;
