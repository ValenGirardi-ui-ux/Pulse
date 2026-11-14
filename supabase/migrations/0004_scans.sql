-- Pulse: scan results.
-- Run this once in the Supabase dashboard (SQL Editor → New query → paste → Run).

-- One row per scan of a site: the score, what was found and what changed since the previous scan.
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source text not null default 'manual' check (source in ('manual', 'scheduled')),
  score integer not null check (score between 0 and 100),
  pages integer not null default 0,
  duration_ms integer not null default 0,
  response_ms integer,
  status_code integer,
  issues jsonb not null default '[]'::jsonb,
  changes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists scans_site_created_idx on public.scans (site_id, created_at desc);

-- Every user only sees and adds scans of their own sites.
alter table public.scans enable row level security;

drop policy if exists "Scans are readable by their owner" on public.scans;
create policy "Scans are readable by their owner" on public.scans
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Scans can be added by their owner" on public.scans;
create policy "Scans can be added by their owner" on public.scans
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.sites where sites.id = site_id and sites.user_id = (select auth.uid()))
  );

drop policy if exists "Scans can be removed by their owner" on public.scans;
create policy "Scans can be removed by their owner" on public.scans
  for delete to authenticated using ((select auth.uid()) = user_id);
