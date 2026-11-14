-- Pulse: automatic scans and email alerts preferences.
-- Run this once in the Supabase dashboard (SQL Editor → New query → paste → Run).

alter table public.profiles add column if not exists auto_scans boolean not null default true;
alter table public.profiles add column if not exists alerts_email text
  check (alerts_email is null or char_length(alerts_email) between 3 and 255);
alter table public.profiles add column if not exists alert_new_critical boolean not null default true;
alter table public.profiles add column if not exists alert_site_down boolean not null default true;
