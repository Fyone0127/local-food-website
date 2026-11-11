-- Local Food Finder KCH Supabase setup
-- This database is based on the Google Sheet columns:
-- restaurant_name, phone_number, description, location, operation_hour,
-- Rating, Review, Price range (RM), Halal/non halal
-- photo_url is added so real shop photos can be shown on the website.

create table if not exists public.restaurants (
  id bigint generated always as identity primary key,
  restaurant_name text not null,
  phone_number text,
  description text,
  location text,
  operation_hour text,
  rating text,
  review text,
  price_range text,
  halal_status text,
  photo_url text,
  google_sheet_row integer,
  import_source text,
  import_row integer,
  synced_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.restaurants
add column if not exists photo_url text;

alter table public.restaurants
add column if not exists rating text;

alter table public.restaurants
add column if not exists google_sheet_row integer;

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

create unique index if not exists restaurants_google_sheet_row_key
on public.restaurants (google_sheet_row);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.restaurants enable row level security;
alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  on conflict (id) do update
  set full_name = excluded.full_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name, role)
select
  id,
  coalesce(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', ''),
  'user'
from auth.users
on conflict (id) do nothing;

drop policy if exists "Anyone can view restaurants" on public.restaurants;
drop policy if exists "Authenticated users can insert restaurants" on public.restaurants;
drop policy if exists "Authenticated users can update restaurants" on public.restaurants;
drop policy if exists "Authenticated users can delete restaurants" on public.restaurants;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Anyone can view restaurants"
on public.restaurants for select
using (true);

-- Simple prototype policies: any logged-in user can manage restaurant data.
-- For a real system, restrict these policies to profiles.role = 'admin'.
create policy "Authenticated users can insert restaurants"
on public.restaurants for insert
to authenticated
with check (true);

create policy "Authenticated users can update restaurants"
on public.restaurants for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete restaurants"
on public.restaurants for delete
to authenticated
using (true);

create policy "Users can view own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

insert into public.restaurants
  (restaurant_name, phone_number, description, location, operation_hour, rating, review, price_range, halal_status, photo_url)
values
  ('Madras Cafe', '014-8899971', 'South Indian cuisine (crispy dosas, idlis, sambar, filter coffee)', '51, India Street Pedestrian Mall', 'Mon-Sun 6am-9pm', '5 Star', 'Affordable', 'RM8-18', 'halal', 'https://images.unsplash.com/photo-1630409346824-4f0e7b080087?auto=format&fit=crop&w=900&q=80'),
  ('Jubilee Restaurant', '082-245626', 'Indian Muslim eatery (authentic Biryani, Roti Canai, Signature Rojak)', '49, India Street Pedestrian Mall', 'Mon-Sat 5am-6pm', '4.1 star', 'Affordable', 'RM10-25', 'halal', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80'),
  ('We Drink', '011-69669886', 'Dessert (ice cream, fruit tea, coffee)', 'India Street Pedestrian Mall', 'Mon-Sun 10.30am-11pm', '2.3 star', 'Low cost', 'RM4-12', 'halal', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80'),
  ('Lava', '016-8657179', 'Fast food (pizza, fries, chicken wings, local cafe-style meals)', 'Lot 90 Section 24 ktld,65, India Street Pedestrian Mall', 'Daily 8.30am-8pm', '5 star', 'Moderate', 'RM12-25', 'halal', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80'),
  ('8 Minit Kopi', '011-57568596', 'Cafe (local kopi, toast, croissants, oden tom yum, roti kahwin)', '41, jalan gambier', 'Daily 8am-8pm', '5 star', 'Affordable', 'RM5-18', 'halal', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80'),
  ('Nam joo', '014-6994493', 'Hipster cafe (balado rice, dakganjeong korean chicken wings, spicy ramen, fried banana cheese)', '21, jalan gambier', 'Mon-Sun 12pm-10pm (Tue closed)', '4.7 star', 'Moderate', 'RM10-28', 'halal', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80')
on conflict do nothing;
