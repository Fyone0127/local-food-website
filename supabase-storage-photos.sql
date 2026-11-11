-- Run this once in Supabase SQL Editor.
-- It creates a public bucket for restaurant photos and allows logged-in admins/users to upload.

insert into storage.buckets (id, name, public)
values ('restaurant-photos', 'restaurant-photos', true)
on conflict (id) do update
set public = true;

drop policy if exists "Anyone can view restaurant photos" on storage.objects;
drop policy if exists "Authenticated users can upload restaurant photos" on storage.objects;
drop policy if exists "Authenticated users can update restaurant photos" on storage.objects;
drop policy if exists "Authenticated users can delete restaurant photos" on storage.objects;

create policy "Anyone can view restaurant photos"
on storage.objects for select
using (bucket_id = 'restaurant-photos');

create policy "Authenticated users can upload restaurant photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'restaurant-photos');

create policy "Authenticated users can update restaurant photos"
on storage.objects for update
to authenticated
using (bucket_id = 'restaurant-photos')
with check (bucket_id = 'restaurant-photos');

create policy "Authenticated users can delete restaurant photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'restaurant-photos');
