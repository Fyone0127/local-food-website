-- Run this after creating admin@localfood.test in Supabase Authentication.
-- It marks the matching public profile as an admin.

update public.profiles
set role = 'admin',
    full_name = coalesce(nullif(full_name, ''), 'Admin')
where id = (
  select id
  from auth.users
  where email = 'admin@localfood.test'
);
