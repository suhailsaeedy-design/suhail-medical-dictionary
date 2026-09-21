-- Suhail Medical Dictionary v21 aggregate admin metrics (admin role remains disabled until assigned server-side).
-- Prerequisite: Phase 7 user_app_state table.
-- Authorization MUST be assigned server-side in auth.users.raw_app_meta_data, e.g. {"smd_role":"owner"}.
-- Never store service_role/secret credentials in the browser project.

create schema if not exists private;

create or replace function private.smd_admin_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  role_name text;
  result jsonb;
begin
  role_name := coalesce(auth.jwt() -> 'app_metadata' ->> 'smd_role', '');
  if role_name not in ('owner','admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'synced_accounts', count(*),
    'updated_24h', count(*) filter (where updated_at >= now() - interval '24 hours'),
    'updated_7d', count(*) filter (where updated_at >= now() - interval '7 days'),
    'last_sync_at', max(updated_at),
    'approx_state_bytes', coalesce(sum(pg_column_size(state)),0)
  )
  into result
  from public.user_app_state;

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
as $$
  select private.smd_admin_metrics();
$$;

revoke all on function public.smd_admin_metrics() from public, anon;
grant execute on function public.smd_admin_metrics() to authenticated;

comment on function public.smd_admin_metrics() is
'Aggregate-only owner/admin metrics. The private implementation checks auth.jwt().app_metadata.smd_role and never returns raw user state or email addresses.';
