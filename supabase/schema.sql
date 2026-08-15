-- TripHub schema. Run this in the Supabase SQL editor (Project > SQL) before flipping off local fallback.
-- Tables: trips, travelers, trip_preferences, hotel_preferences, flight_selections,
-- hotel_selections, ground_selections, activity_selections, bookings.

create extension if not exists "pgcrypto";

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'flights',
  trip_type text not null,
  departure_code text not null,
  departure_label text not null,
  destination_code text not null,
  destination_label text not null,
  additional_cities text,
  departure_date date not null,
  return_date date,
  flexible_dates boolean not null default false,
  flexible_days int,
  trip_purpose text,
  contact_email text not null,
  adult_count int not null default 1,
  child_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.travelers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  full_name text not null,
  date_of_birth date not null,
  type text not null,
  age int,
  loyalty_program text,
  loyalty_number text,
  sort_order int not null default 0
);

create table if not exists public.trip_preferences (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips(id) on delete cascade,
  cabin_class text not null,
  preferred_airlines jsonb not null default '[]'::jsonb,
  no_airline_preference boolean not null default true,
  max_stops text not null,
  outbound_time_window text not null,
  return_time_window text not null,
  budget_min int not null,
  budget_max int not null,
  seat_preference text not null,
  special_assistance text
);

create table if not exists public.hotel_preferences (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips(id) on delete cascade,
  rooms int not null default 1,
  star_rating text not null,
  budget_min int not null,
  budget_max int not null,
  must_haves jsonb not null default '[]'::jsonb
);

create table if not exists public.flight_selections (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips(id) on delete cascade,
  offer jsonb not null,
  confirmed_at timestamptz not null default now()
);

create table if not exists public.hotel_selections (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips(id) on delete cascade,
  offer jsonb not null,
  confirmed_at timestamptz not null default now()
);

create table if not exists public.ground_selections (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips(id) on delete cascade,
  choice text not null,
  option jsonb,
  confirmed_at timestamptz not null default now()
);

create table if not exists public.activity_selections (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips(id) on delete cascade,
  skipped boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  confirmed_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips(id) on delete cascade,
  confirmation_number text not null unique,
  total_price int not null,
  currency text not null default 'USD',
  sandbox boolean not null default true,
  itinerary_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.loyalty_wallets (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  program_id text not null,
  program_label text not null,
  kind text not null default 'other',
  member_number text,
  balance int not null default 0
);

create table if not exists public.destination_research_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  destination_code text not null,
  destination_label text not null,
  departure_date date not null,
  return_date date,
  trip_purpose text,
  payload jsonb not null,
  source text not null default 'mock',
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.trips enable row level security;
alter table public.travelers enable row level security;
alter table public.trip_preferences enable row level security;
alter table public.hotel_preferences enable row level security;
alter table public.flight_selections enable row level security;
alter table public.hotel_selections enable row level security;
alter table public.ground_selections enable row level security;
alter table public.activity_selections enable row level security;
alter table public.bookings enable row level security;
alter table public.loyalty_wallets enable row level security;
alter table public.destination_research_cache enable row level security;

-- Open policies for the sandbox prototype (tighten before going live with auth).
do $$
declare t text;
begin
  foreach t in array array[
    'trips','travelers','trip_preferences','hotel_preferences',
    'flight_selections','hotel_selections','ground_selections',
    'activity_selections','bookings','loyalty_wallets','destination_research_cache'
  ]
  loop
    execute format('drop policy if exists "public read %1$s" on public.%1$s', t);
    execute format('create policy "public read %1$s" on public.%1$s for select using (true)', t);
    execute format('drop policy if exists "public write %1$s" on public.%1$s', t);
    execute format('create policy "public write %1$s" on public.%1$s for insert with check (true)', t);
    execute format('drop policy if exists "public update %1$s" on public.%1$s', t);
    execute format('create policy "public update %1$s" on public.%1$s for update using (true)', t);
  end loop;
end $$;
