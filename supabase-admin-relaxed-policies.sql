-- Run this once in Supabase SQL Editor if the admin page cannot keep a Supabase Auth session.
-- It allows the website's publishable key to manage restaurants and upload restaurant photos.
-- This is convenient for a coursework/admin-demo site. Do not use this policy style for a real public business system.

alter table public.restaurants enable row level security;

drop policy if exists "Website can insert restaurants" on public.restaurants;
drop policy if exists "Website can update restaurants" on public.restaurants;
drop policy if exists "Website can delete restaurants" on public.restaurants;

create policy "Website can insert restaurants"
on public.restaurants for insert
to anon, authenticated
with check (true);

create policy "Website can update restaurants"
on public.restaurants for update
to anon, authenticated
using (true)
with check (true);

create policy "Website can delete restaurants"
on public.restaurants for delete
to anon, authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('restaurant-photos', 'restaurant-photos', true)
on conflict (id) do update
set public = true;

drop policy if exists "Website can view restaurant photos" on storage.objects;
drop policy if exists "Website can upload restaurant photos" on storage.objects;
drop policy if exists "Website can update restaurant photos" on storage.objects;
drop policy if exists "Website can delete restaurant photos" on storage.objects;

create policy "Website can view restaurant photos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'restaurant-photos');

create policy "Website can upload restaurant photos"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'restaurant-photos');

create policy "Website can update restaurant photos"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'restaurant-photos')
with check (bucket_id = 'restaurant-photos');

create policy "Website can delete restaurant photos"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'restaurant-photos');
