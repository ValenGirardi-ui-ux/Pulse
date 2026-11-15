-- Pulse: real monitors (websites and servers) and their check history.
-- Run this once in the Supabase dashboard (SQL Editor → New query → paste → Run).

create table if not exists public.monitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('website', 'server')),
  target text not null check (char_length(target) between 3 and 255),
  interval_minutes integer not null default 5 check (interval_minutes in (1, 5, 15)),
  ports integer[] not null default '{}',
  last_checked_at timestamptz,
  last_status text,
  last_result jsonb,
  created_at timestamptz not null default now()
);

create index if not exists monitors_user_idx on public.monitors (user_id);

create table if not exists public.monitor_checks (
  id bigint generated always as identity primary key,
  monitor_id uuid not null references public.monitors (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  checked_at timestamptz not null default now(),
  ok boolean not null,
  status text not null,
  response_ms integer
);

create index if not exists monitor_checks_monitor_idx on public.monitor_checks (monitor_id, checked_at desc);
create index if not exists monitor_checks_time_idx on public.monitor_checks (checked_at);

-- Every user only sees and changes their own monitors and checks.
alter table public.monitors enable row level security;
alter table public.monitor_checks enable row level security;

drop policy if exists "Monitors are readable by their owner" on public.monitors;
create policy "Monitors are readable by their owner" on public.monitors
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Monitors can be added by their owner" on public.monitors;
create policy "Monitors can be added by their owner" on public.monitors
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Monitors are editable by their owner" on public.monitors;
create policy "Monitors are editable by their owner" on public.monitors
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Monitors can be removed by their owner" on public.monitors;
create policy "Monitors can be removed by their owner" on public.monitors
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Monitor checks are readable by their owner" on public.monitor_checks;
create policy "Monitor checks are readable by their owner" on public.monitor_checks
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Monitor checks can be added by their owner" on public.monitor_checks;
create policy "Monitor checks can be added by their owner" on public.monitor_checks
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Availability of each monitor of the signed-in user over the last 30 days.
create or replace function public.monitor_stats()
returns table (monitor_id uuid, total bigint, ok_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select monitor_id, count(*) as total, count(*) filter (where ok) as ok_count
  from public.monitor_checks
  where user_id = (select auth.uid()) and checked_at > now() - interval '30 days'
  group by monitor_id
$$;

grant execute on function public.monitor_stats() to authenticated;
