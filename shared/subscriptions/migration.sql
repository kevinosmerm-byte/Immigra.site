-- Apply after the preserved CitizenshipAI migrations, in a separate development database.
-- Never run this automatically against the original project's database.
create table if not exists public.immigration_usage (
 user_id uuid not null references auth.users(id) on delete cascade,
 module text not null check(module in ('citizenship','asylum','residency')),
 usage_date date not null default current_date, consumed integer not null default 0 check(consumed>=0),
 primary key(user_id,module,usage_date)
);
alter table public.immigration_usage enable row level security;
revoke all on public.immigration_usage from anon,authenticated;
create or replace function public.immigration_reserve_usage(p_user_id uuid,p_module text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare cap integer; used integer; pro boolean;
begin
 if p_user_id is null or p_module not in ('citizenship','asylum','residency') then raise exception 'INVALID_SCOPE'; end if;
 select exists(select 1 from public.entitlements where user_id=p_user_id and tier='pro' and status in ('active','grace') and (period_end is null or period_end>now())) into pro;
 cap:=case when p_module='residency' then case when pro then 5 else 1 end else case when pro then 30 else 2 end end;
 insert into public.immigration_usage(user_id,module) values(p_user_id,p_module) on conflict do nothing;
 update public.immigration_usage set consumed=consumed+1 where user_id=p_user_id and module=p_module and usage_date=current_date and consumed<cap returning consumed into used;
 return jsonb_build_object('allowed',used is not null,'limit',cap);
end $$;
revoke all on function public.immigration_reserve_usage(uuid,text) from public,anon,authenticated;
grant execute on function public.immigration_reserve_usage(uuid,text) to service_role;
