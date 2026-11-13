-- Pulse: accounts and sites.
-- Run this once in the Supabase dashboard (SQL Editor → New query → paste → Run),
-- or with the Supabase CLI: supabase db push

-- Profiles: one row per user, created automatically on sign up.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- Sites: the websites each user checks with Pulse.
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  url text not null check (char_length(url) between 3 and 255),
  created_at timestamptz not null default now(),
  unique (user_id, url)
);

create index if not exists sites_user_id_idx on public.sites (user_id);

-- Row Level Security: every user only sees and changes their own rows.
alter table public.profiles enable row level security;
alter table public.sites enable row level security;

drop policy if exists "Profiles are readable by their owner" on public.profiles;
create policy "Profiles are readable by their owner" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "Profiles are editable by their owner" on public.profiles;
create policy "Profiles are editable by their owner" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Sites are readable by their owner" on public.sites;
create policy "Sites are readable by their owner" on public.sites
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Sites can be added by their owner" on public.sites;
create policy "Sites can be added by their owner" on public.sites
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Sites are editable by their owner" on public.sites;
create policy "Sites are editable by their owner" on public.sites
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Sites can be removed by their owner" on public.sites;
create policy "Sites can be removed by their owner" on public.sites
  for delete to authenticated using (auth.uid() = user_id);

-- On sign up: create the profile and, if the user entered a website, their first site.
-- The app already validates and normalizes `website` and `site_name` before sending them.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  website text := nullif(trim(new.raw_user_meta_data ->> 'website'), '');
  site_name text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'site_name'), ''), website);
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'));

  if website is not null then
    insert into public.sites (user_id, name, url)
    values (new.id, left(site_name, 80), left(website, 255))
    on conflict (user_id, url) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
