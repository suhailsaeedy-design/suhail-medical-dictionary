-- Suhail Medical Dictionary v21 Phase 21 — one-time owner bootstrap foundation.
-- IMPORTANT: insert a fresh token hash server-side after deployment/setup. Never put the plaintext bootstrap code in the repository.

create schema if not exists private;

create table if not exists private.owner_bootstrap (
  singleton boolean primary key default true check (singleton),
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid,
  created_at timestamptz not null default now()
);
revoke all on table private.owner_bootstrap from public, anon, authenticated;

create or replace function private.smd_claim_owner(p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); boot private.owner_bootstrap%rowtype; supplied_hash text; current_role text;
begin
  if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
  select coalesce(raw_app_meta_data->>'smd_role','') into current_role from auth.users where id=uid;
  if current_role='owner' then return jsonb_build_object('ok',true,'role','owner','already_owner',true); end if;
  if exists(select 1 from auth.users where coalesce(raw_app_meta_data->>'smd_role','')='owner' and id<>uid) then raise exception 'owner already assigned' using errcode='42501'; end if;
  select * into boot from private.owner_bootstrap where singleton=true for update;
  if boot.singleton is null or boot.used_at is not null or boot.expires_at<=now() then raise exception 'owner bootstrap is unavailable' using errcode='42501'; end if;
  supplied_hash:=encode(extensions.digest(coalesce(p_token,''),'sha256'),'hex');
  if supplied_hash<>boot.token_hash then raise exception 'invalid owner bootstrap code' using errcode='42501'; end if;
  update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||jsonb_build_object('smd_role','owner') where id=uid;
  update private.owner_bootstrap set used_at=now(),used_by=uid where singleton=true;
  return jsonb_build_object('ok',true,'role','owner','already_owner',false);
end;$$;
revoke all on function private.smd_claim_owner(text) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.smd_claim_owner(text) to authenticated;

create or replace function public.smd_claim_owner(p_token text) returns jsonb language sql security invoker set search_path='' as $$ select private.smd_claim_owner(p_token); $$;
revoke all on function public.smd_claim_owner(text) from public,anon;
grant execute on function public.smd_claim_owner(text) to authenticated;
