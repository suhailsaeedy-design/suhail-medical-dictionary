-- v19 final AI/admin migration. Safe to run after the main schema.

create or replace function public.admin_ai_usage_today()
returns table(chat_requests bigint,translation_requests bigint,ai_users bigint)
language plpgsql security definer set search_path=public as $$
begin
 if not public.is_owner() then raise exception 'Owner access required'; end if;
 return query select coalesce(sum(a.chat_count),0)::bigint,coalesce(sum(a.translation_count),0)::bigint,count(*)::bigint
 from public.ai_usage_daily a where a.usage_day=current_date and (a.chat_count>0 or a.translation_count>0);
end;$$;
revoke all on function public.admin_ai_usage_today() from public;
grant execute on function public.admin_ai_usage_today() to authenticated;
