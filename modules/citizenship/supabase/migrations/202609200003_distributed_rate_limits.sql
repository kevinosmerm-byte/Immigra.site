-- Shared abuse controls for multi-instance API deployments.
-- The subject value is an HMAC digest created by the private server; raw IP
-- addresses and account tokens are never stored in this table.

create table if not exists public.api_rate_limit_windows (
  bucket text not null,
  subject_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (bucket, subject_hash)
);

alter table public.api_rate_limit_windows enable row level security;
revoke all on table public.api_rate_limit_windows from anon, authenticated;

create or replace function public.consume_api_rate_limit(
  p_bucket text,
  p_subject_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_row public.api_rate_limit_windows%rowtype;
  v_retry_after integer;
begin
  if length(coalesce(p_bucket, '')) < 1
    or length(coalesce(p_subject_hash, '')) < 32
    or p_limit < 1
    or p_window_seconds < 1 then
    raise exception 'invalid_rate_limit_request';
  end if;

  insert into public.api_rate_limit_windows (bucket, subject_hash, window_started_at, request_count, updated_at)
  values (left(p_bucket, 50), left(p_subject_hash, 128), v_now, 1, v_now)
  on conflict (bucket, subject_hash) do update set
    window_started_at = case
      when public.api_rate_limit_windows.window_started_at + make_interval(secs => p_window_seconds) <= v_now then v_now
      else public.api_rate_limit_windows.window_started_at
    end,
    request_count = case
      when public.api_rate_limit_windows.window_started_at + make_interval(secs => p_window_seconds) <= v_now then 1
      else public.api_rate_limit_windows.request_count + 1
    end,
    updated_at = v_now
  returning * into v_row;

  v_retry_after := greatest(1, ceil(extract(epoch from (
    v_row.window_started_at + make_interval(secs => p_window_seconds) - v_now
  )))::integer);

  return jsonb_build_object(
    'allowed', v_row.request_count <= p_limit,
    'remaining', greatest(0, p_limit - v_row.request_count),
    'retryAfterSeconds', v_retry_after
  );
end;
$$;

revoke all on function public.consume_api_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer) to service_role;

