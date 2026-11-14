-- Pulse: let people delete their own account.
-- Run this once in the Supabase dashboard (SQL Editor → New query → paste → Run).

-- Deletes the signed-in user. Their profile, sites and scans go with it (on delete cascade).
-- It only ever deletes the caller (auth.uid()), so nobody can delete someone else.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
