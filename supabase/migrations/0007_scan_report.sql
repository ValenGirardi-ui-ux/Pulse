-- Pulse: full SEO + GEO audit report for each scan (crawled pages, scores per area, Core Web Vitals,
-- and what couldn't be evaluated).
-- Run this once in the Supabase dashboard (SQL Editor → New query → paste → Run).

alter table public.scans add column if not exists report jsonb;
