-- Suhail Medical Dictionary v21.19.0 pre-production Supabase cleanup.
-- Idempotent cleanup for the current v21 cloud architecture.
-- Keeps auth.users / Google identities, removes unused legacy application schema.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.consume_ai_quota(uuid, text, integer);

drop function if exists public.admin_chat_messages(uuid);
drop function if exists public.admin_dashboard_stats();
drop function if exists public.admin_recent_events(integer);
drop function if exists public.admin_user_chats(uuid);
drop function if exists public.admin_user_summaries();
drop function if exists public.set_owner_review_consent(boolean);
drop function if exists public.touch_last_seen();
drop function if exists public.is_owner();

drop table if exists public.ai_messages;
drop table if exists public.chats;
drop table if exists public.user_events;
drop table if exists public.ai_usage_daily;
drop table if exists public.profiles;
drop table if exists public.term_translation_cache;

create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_app_state enable row level security;

drop policy if exists "Users can read own app state" on public.user_app_state;
create policy "Users can read own app state" on public.user_app_state for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own app state" on public.user_app_state;
create policy "Users can insert own app state" on public.user_app_state for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own app state" on public.user_app_state;
create policy "Users can update own app state" on public.user_app_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own app state" on public.user_app_state;
create policy "Users can delete own app state" on public.user_app_state for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.user_app_state from public, anon, authenticated;
grant select, insert, update, delete on table public.user_app_state to authenticated;

create schema if not exists private;
create or replace function private.smd_admin_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare role_name text; result jsonb;
begin
  role_name := coalesce(auth.jwt() -> 'app_metadata' ->> 'smd_role', '');
  if role_name not in ('owner','admin') then raise exception 'not authorized' using errcode = '42501'; end if;
  select jsonb_build_object(
    'synced_accounts', count(*),
    'updated_24h', count(*) filter (where updated_at >= now() - interval '24 hours'),
    'updated_7d', count(*) filter (where updated_at >= now() - interval '7 days'),
    'last_sync_at', max(updated_at),
    'approx_state_bytes', coalesce(sum(pg_column_size(state)),0)
  ) into result from public.user_app_state;
  return result;
end;
$$;
revoke all on function private.smd_admin_metrics() from public;
grant usage on schema private to authenticated;
grant execute on function private.smd_admin_metrics() to authenticated;

create or replace function public.smd_admin_metrics()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$ select private.smd_admin_metrics(); $$;
revoke all on function public.smd_admin_metrics() from public, anon;
grant execute on function public.smd_admin_metrics() to authenticated;
