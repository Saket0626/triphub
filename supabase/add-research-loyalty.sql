-- Additive tables for an existing TripHub project. Safe to run in the SQL editor.
-- Also included in schema.sql for new setups.

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

alter table public.loyalty_wallets enable row level security;
alter table public.destination_research_cache enable row level security;

do $$
declare t text;
begin
  foreach t in array array['loyalty_wallets','destination_research_cache']
  loop
    execute format('drop policy if exists "public read %1$s" on public.%1$s', t);
    execute format('create policy "public read %1$s" on public.%1$s for select using (true)', t);
    execute format('drop policy if exists "public write %1$s" on public.%1$s', t);
    execute format('create policy "public write %1$s" on public.%1$s for insert with check (true)', t);
    execute format('drop policy if exists "public update %1$s" on public.%1$s', t);
    execute format('create policy "public update %1$s" on public.%1$s for update using (true)', t);
  end loop;
end $$;
