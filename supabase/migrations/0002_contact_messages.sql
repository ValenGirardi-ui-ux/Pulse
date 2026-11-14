-- Pulse: messages sent from the contact form on the landing page.
-- Run this once in the Supabase dashboard (SQL Editor → New query → paste → Run).
-- Read the messages in Table Editor → contact_messages.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 255),
  message text not null check (char_length(message) between 1 and 5000),
  created_at timestamptz not null default now()
);

-- Anyone can send a message, but nobody can read them through the API.
-- You read them from the Supabase dashboard, which bypasses these rules.
alter table public.contact_messages enable row level security;

drop policy if exists "Anyone can send a contact message" on public.contact_messages;
create policy "Anyone can send a contact message" on public.contact_messages
  for insert to anon, authenticated with check (true);
