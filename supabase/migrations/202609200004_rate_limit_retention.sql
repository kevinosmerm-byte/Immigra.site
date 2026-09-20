-- Keep distributed rate limiting bounded as traffic grows. Every request still
-- updates only its own row; a small sample of calls also removes a bounded
-- batch of windows that have been inactive for more than 24 hours.

create index if not exists api_rate_limit_windows_updated_idx
  on public.api_rate_limit_windows (updated_at);

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

  -- Approximately 2% of calls perform bounded maintenance. This avoids a
  -- dedicated scheduler and prevents an unbounded delete from delaying users.
  if random() < 0.02 then
    delete from public.api_rate_limit_windows
    where ctid in (
      select ctid from public.api_rate_limit_windows
      where updated_at < v_now - interval '24 hours'
      order by updated_at
      limit 1000
    );
  end if;

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

