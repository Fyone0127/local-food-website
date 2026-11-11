-- Run this once in Supabase SQL Editor before importing the latest CSV.
-- It updates the existing restaurants table to support the new CSV columns.

alter table public.restaurants
add column if not exists rating text;

alter table public.restaurants
add column if not exists price_range text;

alter table public.restaurants
add column if not exists halal_status text;

alter table public.restaurants
add column if not exists import_source text;

alter table public.restaurants
add column if not exists import_row integer;

alter table public.restaurants
add column if not exists synced_at timestamptz;

update public.restaurants
set rating = coalesce(rating, review)
where rating is null;
