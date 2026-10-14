begin;
create table if not exists public.native_store_purchases (
  provider text not null check (provider in ('apple','google_play')),
  reference_hash text not null check (length(reference_hash) = 64),
  user_id uuid not null references auth.users(id) on delete cascade,
  encrypted_reference text not null,
  updated_at timestamptz not null default now(),
  primary key (provider, reference_hash)
);
create index if not exists native_store_purchases_user_id on public.native_store_purchases(user_id);
alter table public.native_store_purchases enable row level security;
revoke all on public.native_store_purchases from public, anon, authenticated;
grant all on public.native_store_purchases to service_role;
create table if not exists public.ai_feedback_reports (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  reason text not null check (reason in ('incorrect','offensive','legal_advice','other')),
  response_text text not null check (length(response_text) between 1 and 6000),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);
create index if not exists ai_feedback_reports_expiry on public.ai_feedback_reports(expires_at);
alter table public.ai_feedback_reports enable row level security;
revoke all on public.ai_feedback_reports from public, anon, authenticated;
grant all on public.ai_feedback_reports to service_role;
grant usage, select on sequence public.ai_feedback_reports_id_seq to service_role;
create or replace function public.purge_expired_ai_feedback()
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare v_deleted integer;
begin
  delete from public.ai_feedback_reports where id in (
    select id from public.ai_feedback_reports where expires_at <= now() order by expires_at limit 500
  );
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;
revoke all on function public.purge_expired_ai_feedback() from public, anon, authenticated;
grant execute on function public.purge_expired_ai_feedback() to service_role;
commit;
