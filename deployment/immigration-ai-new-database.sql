-- ONLY for the NEW ImmigrationAI Supabase project oehhhbmrgefzodofgjtr.
BEGIN;
-- Source: 202609200001_ai_entitlements.sql
-- Citizenship AI: server-authoritative accounts, entitlements and AI sessions.
-- Apply through the Supabase migration workflow before setting Render secrets.

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'grace', 'expired', 'revoked')),
  provider text,
  provider_customer_id text,
  provider_entitlement_id text,
  period_start timestamptz,
  period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_feature_config (
  feature text primary key,
  enabled boolean not null default true,
  free_session_limit integer not null default 2 check (free_session_limit >= 0),
  pro_monthly_limit integer check (pro_monthly_limit is null or pro_monthly_limit >= 0),
  rewarded_ads_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.ai_feature_config (feature, enabled, free_session_limit, pro_monthly_limit, rewarded_ads_enabled)
values
  ('coach', true, 2, null, true),
  ('classicInterview', true, 2, null, true),
  ('writing', true, 2, null, true),
  ('speaking', true, 2, null, true),
  ('realInterview', true, 2, null, false)
on conflict (feature) do nothing;

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('launch_promotion', '{"active":true,"allowContinueWithoutPayment":true}'::jsonb)
on conflict (key) do nothing;

create table if not exists public.ai_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null references public.ai_feature_config(feature),
  idempotency_key text not null,
  source text not null check (source in ('free_allowance', 'pro_allowance', 'reward_credit', 'launch_promotion', 'admin')),
  status text not null default 'started' check (status in ('reserved', 'started', 'completed', 'failed', 'refunded')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  request_count integer not null default 0 check (request_count >= 0),
  input_tokens bigint not null default 0 check (input_tokens >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  transcription_seconds numeric(12,3) not null default 0 check (transcription_seconds >= 0),
  provider text,
  model text,
  provider_metadata jsonb not null default '{}'::jsonb,
  unique (user_id, idempotency_key)
);

create index if not exists ai_sessions_user_feature_started_idx
  on public.ai_sessions (user_id, feature, started_at desc);

create table if not exists public.reward_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null references public.ai_feature_config(feature),
  source text not null default 'rewarded_ad',
  verification_id text not null unique,
  credits_granted integer not null default 1 check (credits_granted > 0),
  credits_remaining integer not null default 1 check (credits_remaining >= 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  consumed_at timestamptz
);

create index if not exists reward_credits_available_idx
  on public.reward_credits (user_id, feature, created_at)
  where credits_remaining > 0;

create table if not exists public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  session_id uuid references public.ai_sessions(id) on delete set null,
  event_name text not null,
  feature text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- All account and billing records are server-only. The API validates the JWT,
-- then uses its private secret key. No browser receives direct table access.
alter table public.user_profiles enable row level security;
alter table public.entitlements enable row level security;
alter table public.ai_feature_config enable row level security;
alter table public.app_settings enable row level security;
alter table public.ai_sessions enable row level security;
alter table public.reward_credits enable row level security;
alter table public.usage_events enable row level security;

revoke all on table public.user_profiles from anon, authenticated;
revoke all on table public.entitlements from anon, authenticated;
revoke all on table public.ai_feature_config from anon, authenticated;
revoke all on table public.app_settings from anon, authenticated;
revoke all on table public.ai_sessions from anon, authenticated;
revoke all on table public.reward_credits from anon, authenticated;
revoke all on table public.usage_events from anon, authenticated;

create or replace function public.get_ai_usage_snapshot(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'tier', coalesce((select tier from public.entitlements where user_id = p_user_id and status in ('active', 'grace')), 'free'),
    'features', coalesce(jsonb_object_agg(c.feature, jsonb_build_object(
      'enabled', c.enabled,
      'freeLimit', c.free_session_limit,
      'freeUsed', (
        select count(*) from public.ai_sessions s
        where s.user_id = p_user_id and s.feature = c.feature
          and s.source = 'free_allowance' and s.status in ('reserved', 'started', 'completed')
      ),
      'proMonthlyLimit', c.pro_monthly_limit,
      'rewardCredits', (
        select coalesce(sum(r.credits_remaining), 0) from public.reward_credits r
        where r.user_id = p_user_id and r.feature = c.feature
          and r.credits_remaining > 0 and (r.expires_at is null or r.expires_at > now())
      ),
      'rewardedAdsEnabled', c.rewarded_ads_enabled
    )), '{}'::jsonb)
  )
  from public.ai_feature_config c;
$$;

create or replace function public.start_ai_session(
  p_user_id uuid,
  p_feature text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_config public.ai_feature_config%rowtype;
  v_existing public.ai_sessions%rowtype;
  v_entitlement public.entitlements%rowtype;
  v_reward public.reward_credits%rowtype;
  v_session public.ai_sessions%rowtype;
  v_source text;
  v_used integer := 0;
  v_promotion jsonb := '{}'::jsonb;
  v_remaining integer;
begin
  if p_user_id is null or length(coalesce(p_idempotency_key, '')) < 12 then
    raise exception 'invalid_session_request';
  end if;

  -- Serializes starts for one user and feature, preventing rapid-tap credit reuse.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_feature, 0));

  select * into v_existing from public.ai_sessions
  where user_id = p_user_id and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('allowed', true, 'sessionId', v_existing.id, 'source', v_existing.source, 'idempotent', true);
  end if;

  select * into v_config from public.ai_feature_config where feature = p_feature;
  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_feature', 'canWatchAd', false, 'canUpgrade', false);
  end if;
  if not v_config.enabled then
    return jsonb_build_object('allowed', false, 'reason', 'feature_unavailable', 'canWatchAd', false, 'canUpgrade', false);
  end if;

  insert into public.user_profiles (user_id) values (p_user_id) on conflict (user_id) do nothing;
  select * into v_entitlement from public.entitlements
  where user_id = p_user_id and status in ('active', 'grace') and (period_end is null or period_end > now());

  if found and v_entitlement.tier = 'pro' and v_config.pro_monthly_limit is not null then
    select count(*) into v_used from public.ai_sessions
    where user_id = p_user_id and feature = p_feature and source = 'pro_allowance'
      and status in ('reserved', 'started', 'completed')
      and started_at >= coalesce(v_entitlement.period_start, date_trunc('month', now()));
    if v_used < v_config.pro_monthly_limit then
      v_source := 'pro_allowance';
      v_remaining := greatest(0, v_config.pro_monthly_limit - v_used - 1);
    end if;
  end if;

  if v_source is null then
    select count(*) into v_used from public.ai_sessions
    where user_id = p_user_id and feature = p_feature and source = 'free_allowance'
      and status in ('reserved', 'started', 'completed');
    if v_used < v_config.free_session_limit then
      v_source := 'free_allowance';
      v_remaining := greatest(0, v_config.free_session_limit - v_used - 1);
    end if;
  end if;

  if v_source is null and v_config.rewarded_ads_enabled then
    select * into v_reward from public.reward_credits
    where user_id = p_user_id and feature = p_feature and credits_remaining > 0
      and (expires_at is null or expires_at > now())
    order by created_at for update skip locked limit 1;
    if found then
      update public.reward_credits
      set credits_remaining = credits_remaining - 1,
          consumed_at = case when credits_remaining = 1 then now() else consumed_at end
      where id = v_reward.id;
      v_source := 'reward_credit';
      v_remaining := greatest(0, v_reward.credits_remaining - 1);
    end if;
  end if;

  select value into v_promotion from public.app_settings where key = 'launch_promotion';
  if v_source is null and coalesce((v_promotion->>'active')::boolean, false)
    and coalesce((v_promotion->>'allowContinueWithoutPayment')::boolean, false) then
    v_source := 'launch_promotion';
    v_remaining := 0;
  end if;

  if v_source is null then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'quota_exhausted',
      'canWatchAd', v_config.rewarded_ads_enabled,
      'canUpgrade', true
    );
  end if;

  insert into public.ai_sessions (user_id, feature, idempotency_key, source, status)
  values (p_user_id, p_feature, p_idempotency_key, v_source, 'started')
  returning * into v_session;

  insert into public.usage_events (user_id, session_id, event_name, feature, metadata)
  values (p_user_id, v_session.id, 'ai_session_started', p_feature, jsonb_build_object('source', v_source));

  return jsonb_build_object('allowed', true, 'sessionId', v_session.id, 'source', v_source, 'remaining', v_remaining, 'idempotent', false);
end;
$$;

create or replace function public.finish_ai_session(
  p_user_id uuid,
  p_session_id uuid,
  p_outcome text,
  p_telemetry jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session public.ai_sessions%rowtype;
begin
  if p_outcome not in ('completed', 'failed', 'refunded') then
    raise exception 'invalid_session_outcome';
  end if;

  select * into v_session from public.ai_sessions
  where id = p_session_id and user_id = p_user_id for update;
  if not found then raise exception 'session_not_found'; end if;

  if v_session.status in ('completed', 'failed', 'refunded') then
    return jsonb_build_object('sessionId', v_session.id, 'status', v_session.status, 'idempotent', true);
  end if;

  update public.ai_sessions set
    status = p_outcome,
    completed_at = case when p_outcome = 'completed' then now() else null end,
    failed_at = case when p_outcome in ('failed', 'refunded') then now() else null end,
    provider = nullif(left(coalesce(p_telemetry->>'provider', ''), 40), ''),
    model = nullif(left(coalesce(p_telemetry->>'model', ''), 80), ''),
    request_count = greatest(0, least(500, coalesce((p_telemetry->>'requestCount')::integer, 0))),
    input_tokens = greatest(0, coalesce((p_telemetry->>'inputTokens')::bigint, 0)),
    output_tokens = greatest(0, coalesce((p_telemetry->>'outputTokens')::bigint, 0)),
    transcription_seconds = greatest(0, coalesce((p_telemetry->>'transcriptionSeconds')::numeric, 0))
  where id = p_session_id;

  insert into public.usage_events (user_id, session_id, event_name, feature)
  values (p_user_id, p_session_id, 'ai_session_' || p_outcome, v_session.feature);

  return jsonb_build_object('sessionId', p_session_id, 'status', p_outcome, 'idempotent', false);
end;
$$;

revoke all on function public.get_ai_usage_snapshot(uuid) from public, anon, authenticated;
revoke all on function public.start_ai_session(uuid, text, text) from public, anon, authenticated;
revoke all on function public.finish_ai_session(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.get_ai_usage_snapshot(uuid) to service_role;
grant execute on function public.start_ai_session(uuid, text, text) to service_role;
grant execute on function public.finish_ai_session(uuid, uuid, text, jsonb) to service_role;


-- Source: 202609200002_usage_metering_snapshot.sql
-- Add server-recorded provider consumption to each user's private usage snapshot.
-- Values are usage units only; provider pricing is intentionally not stored here.

create or replace function public.get_ai_usage_snapshot(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'tier', coalesce((select tier from public.entitlements where user_id = p_user_id and status in ('active', 'grace')), 'free'),
    'features', coalesce((
      select jsonb_object_agg(c.feature, jsonb_build_object(
        'enabled', c.enabled,
        'freeLimit', c.free_session_limit,
        'freeUsed', (
          select count(*) from public.ai_sessions s
          where s.user_id = p_user_id and s.feature = c.feature
            and s.source = 'free_allowance' and s.status in ('reserved', 'started', 'completed')
        ),
        'proMonthlyLimit', c.pro_monthly_limit,
        'rewardCredits', (
          select coalesce(sum(r.credits_remaining), 0) from public.reward_credits r
          where r.user_id = p_user_id and r.feature = c.feature
            and r.credits_remaining > 0 and (r.expires_at is null or r.expires_at > now())
        ),
        'rewardedAdsEnabled', c.rewarded_ads_enabled
      )) from public.ai_feature_config c
    ), '{}'::jsonb),
    'metering', jsonb_build_object(
      'total', (
        select jsonb_build_object(
          'requests', coalesce(sum(s.request_count), 0),
          'inputTokens', coalesce(sum(s.input_tokens), 0),
          'outputTokens', coalesce(sum(s.output_tokens), 0),
          'transcriptionSeconds', coalesce(sum(s.transcription_seconds), 0)
        ) from public.ai_sessions s where s.user_id = p_user_id
      ),
      'features', coalesce((
        select jsonb_object_agg(m.feature, jsonb_build_object(
          'requests', m.requests,
          'inputTokens', m.input_tokens,
          'outputTokens', m.output_tokens,
          'transcriptionSeconds', m.transcription_seconds
        ))
        from (
          select s.feature,
            coalesce(sum(s.request_count), 0) as requests,
            coalesce(sum(s.input_tokens), 0) as input_tokens,
            coalesce(sum(s.output_tokens), 0) as output_tokens,
            coalesce(sum(s.transcription_seconds), 0) as transcription_seconds
          from public.ai_sessions s
          where s.user_id = p_user_id
          group by s.feature
        ) m
      ), '{}'::jsonb)
    )
  );
$$;

revoke all on function public.get_ai_usage_snapshot(uuid) from public, anon, authenticated;
grant execute on function public.get_ai_usage_snapshot(uuid) to service_role;

-- Source: 202609200003_distributed_rate_limits.sql
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


-- Source: 202609200004_rate_limit_retention.sql
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


-- Source: 202609200005_verified_reward_credits.sql
-- Server-only foundation for rewarded-ad credits.
-- A future provider verifier must validate the reward callback before invoking
-- this function. The client application never receives execute permission.

create or replace function public.grant_verified_reward_credit(
  p_user_id uuid,
  p_feature text,
  p_verification_id text,
  p_provider text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_config public.ai_feature_config%rowtype;
  v_credit public.reward_credits%rowtype;
begin
  if p_user_id is null
    or length(coalesce(p_verification_id, '')) < 12
    or length(coalesce(p_verification_id, '')) > 200
    or length(coalesce(p_provider, '')) < 1
    or length(coalesce(p_provider, '')) > 40 then
    raise exception 'invalid_reward_verification';
  end if;

  select * into v_config
  from public.ai_feature_config
  where feature = p_feature
  for update;

  if not found or not v_config.enabled or not v_config.rewarded_ads_enabled then
    raise exception 'reward_not_available_for_feature';
  end if;

  insert into public.reward_credits (
    user_id,
    feature,
    source,
    verification_id,
    credits_granted,
    credits_remaining
  ) values (
    p_user_id,
    p_feature,
    'rewarded_ad',
    left(p_verification_id, 200),
    1,
    1
  )
  on conflict (verification_id) do nothing
  returning * into v_credit;

  if not found then
    select * into v_credit
    from public.reward_credits
    where verification_id = left(p_verification_id, 200);

    if v_credit.user_id <> p_user_id or v_credit.feature <> p_feature then
      raise exception 'reward_verification_conflict';
    end if;
  else
    insert into public.usage_events (user_id, event_name, feature, metadata)
    values (
      p_user_id,
      'reward_credit_granted',
      p_feature,
      jsonb_build_object('provider', left(p_provider, 40))
    );
  end if;

  return jsonb_build_object(
    'granted', v_credit.credits_remaining > 0,
    'creditId', v_credit.id,
    'feature', v_credit.feature,
    'creditsRemaining', v_credit.credits_remaining
  );
end;
$$;

revoke all on function public.grant_verified_reward_credit(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.grant_verified_reward_credit(uuid, text, text, text) to service_role;

-- Source: 202609200006_verified_entitlements.sql
-- Provider-neutral subscription entitlement synchronization.
-- Google Play, Apple, or RevenueCat webhooks must be verified by the server
-- before this service-role-only function is called.

alter table public.entitlements
  add column if not exists provider_event_at timestamptz;

create table if not exists public.subscription_events (
  id bigint generated always as identity primary key,
  provider text not null,
  provider_event_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

alter table public.subscription_events enable row level security;
revoke all on table public.subscription_events from anon, authenticated;

create or replace function public.apply_verified_entitlement_event(
  p_provider text,
  p_provider_event_id text,
  p_user_id uuid,
  p_event_type text,
  p_tier text,
  p_status text,
  p_provider_customer_id text,
  p_provider_entitlement_id text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_occurred_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event_id bigint;
  v_applied boolean := false;
  v_row_count integer := 0;
begin
  if p_user_id is null
    or length(coalesce(p_provider, '')) < 1
    or length(coalesce(p_provider, '')) > 40
    or length(coalesce(p_provider_event_id, '')) < 8
    or length(coalesce(p_provider_event_id, '')) > 200
    or length(coalesce(p_event_type, '')) < 1
    or length(coalesce(p_event_type, '')) > 80
    or p_tier not in ('free', 'pro')
    or p_status not in ('active', 'grace', 'expired', 'revoked')
    or p_occurred_at is null then
    raise exception 'invalid_entitlement_event';
  end if;

  insert into public.subscription_events (
    provider, provider_event_id, user_id, event_type, occurred_at
  ) values (
    left(p_provider, 40), left(p_provider_event_id, 200), p_user_id,
    left(p_event_type, 80), p_occurred_at
  )
  on conflict (provider, provider_event_id) do nothing
  returning id into v_event_id;

  if not found then
    return jsonb_build_object('applied', false, 'duplicate', true);
  end if;

  insert into public.entitlements (
    user_id, tier, status, provider, provider_customer_id,
    provider_entitlement_id, period_start, period_end,
    provider_event_at, updated_at
  ) values (
    p_user_id, p_tier, p_status, left(p_provider, 40),
    nullif(left(coalesce(p_provider_customer_id, ''), 200), ''),
    nullif(left(coalesce(p_provider_entitlement_id, ''), 200), ''),
    p_period_start, p_period_end, p_occurred_at, now()
  )
  on conflict (user_id) do update set
    tier = excluded.tier,
    status = excluded.status,
    provider = excluded.provider,
    provider_customer_id = excluded.provider_customer_id,
    provider_entitlement_id = excluded.provider_entitlement_id,
    period_start = excluded.period_start,
    period_end = excluded.period_end,
    provider_event_at = excluded.provider_event_at,
    updated_at = now()
  where public.entitlements.provider_event_at is null
    or excluded.provider_event_at >= public.entitlements.provider_event_at;

  get diagnostics v_row_count = row_count;
  v_applied := v_row_count > 0;

  if v_applied and p_tier = 'pro' and p_status in ('active', 'grace') then
    insert into public.usage_events (user_id, event_name, metadata)
    values (
      p_user_id,
      'subscription_activated',
      jsonb_build_object('provider', left(p_provider, 40))
    );
  end if;

  return jsonb_build_object('applied', v_applied, 'duplicate', false);
end;
$$;

revoke all on function public.apply_verified_entitlement_event(
  text, text, uuid, text, text, text, text, text,
  timestamptz, timestamptz, timestamptz
) from public, anon, authenticated;

grant execute on function public.apply_verified_entitlement_event(
  text, text, uuid, text, text, text, text, text,
  timestamptz, timestamptz, timestamptz
) to service_role;

-- Source: 202609200007_reward_credit_failure_refunds.sql
-- Restore a consumed rewarded-ad credit when a session fails before any paid
-- provider request. The credit reference makes both consumption and refund
-- atomic and makes repeated finish calls idempotent.

alter table public.ai_sessions
  add column if not exists reward_credit_id uuid references public.reward_credits(id) on delete set null;

create or replace function public.start_ai_session(
  p_user_id uuid,
  p_feature text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_config public.ai_feature_config%rowtype;
  v_existing public.ai_sessions%rowtype;
  v_entitlement public.entitlements%rowtype;
  v_reward public.reward_credits%rowtype;
  v_session public.ai_sessions%rowtype;
  v_source text;
  v_reward_credit_id uuid;
  v_used integer := 0;
  v_promotion jsonb := '{}'::jsonb;
  v_remaining integer;
begin
  if p_user_id is null or length(coalesce(p_idempotency_key, '')) < 12 then
    raise exception 'invalid_session_request';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_feature, 0));

  select * into v_existing from public.ai_sessions
  where user_id = p_user_id and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('allowed', true, 'sessionId', v_existing.id, 'source', v_existing.source, 'idempotent', true);
  end if;

  select * into v_config from public.ai_feature_config where feature = p_feature;
  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_feature', 'canWatchAd', false, 'canUpgrade', false);
  end if;
  if not v_config.enabled then
    return jsonb_build_object('allowed', false, 'reason', 'feature_unavailable', 'canWatchAd', false, 'canUpgrade', false);
  end if;

  insert into public.user_profiles (user_id) values (p_user_id) on conflict (user_id) do nothing;
  select * into v_entitlement from public.entitlements
  where user_id = p_user_id and status in ('active', 'grace') and (period_end is null or period_end > now());

  if found and v_entitlement.tier = 'pro' and v_config.pro_monthly_limit is not null then
    select count(*) into v_used from public.ai_sessions
    where user_id = p_user_id and feature = p_feature and source = 'pro_allowance'
      and status in ('reserved', 'started', 'completed')
      and started_at >= coalesce(v_entitlement.period_start, date_trunc('month', now()));
    if v_used < v_config.pro_monthly_limit then
      v_source := 'pro_allowance';
      v_remaining := greatest(0, v_config.pro_monthly_limit - v_used - 1);
    end if;
  end if;

  if v_source is null then
    select count(*) into v_used from public.ai_sessions
    where user_id = p_user_id and feature = p_feature and source = 'free_allowance'
      and status in ('reserved', 'started', 'completed');
    if v_used < v_config.free_session_limit then
      v_source := 'free_allowance';
      v_remaining := greatest(0, v_config.free_session_limit - v_used - 1);
    end if;
  end if;

  if v_source is null and v_config.rewarded_ads_enabled then
    select * into v_reward from public.reward_credits
    where user_id = p_user_id and feature = p_feature and credits_remaining > 0
      and (expires_at is null or expires_at > now())
    order by created_at for update skip locked limit 1;
    if found then
      update public.reward_credits
      set credits_remaining = credits_remaining - 1,
          consumed_at = case when credits_remaining = 1 then now() else consumed_at end
      where id = v_reward.id;
      v_source := 'reward_credit';
      v_reward_credit_id := v_reward.id;
      v_remaining := greatest(0, v_reward.credits_remaining - 1);
    end if;
  end if;

  select value into v_promotion from public.app_settings where key = 'launch_promotion';
  if v_source is null and coalesce((v_promotion->>'active')::boolean, false)
    and coalesce((v_promotion->>'allowContinueWithoutPayment')::boolean, false) then
    v_source := 'launch_promotion';
    v_remaining := 0;
  end if;

  if v_source is null then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'quota_exhausted',
      'canWatchAd', v_config.rewarded_ads_enabled,
      'canUpgrade', true
    );
  end if;

  insert into public.ai_sessions (user_id, feature, idempotency_key, source, status, reward_credit_id)
  values (p_user_id, p_feature, p_idempotency_key, v_source, 'started', v_reward_credit_id)
  returning * into v_session;

  insert into public.usage_events (user_id, session_id, event_name, feature, metadata)
  values (p_user_id, v_session.id, 'ai_session_started', p_feature, jsonb_build_object('source', v_source));

  return jsonb_build_object('allowed', true, 'sessionId', v_session.id, 'source', v_source, 'remaining', v_remaining, 'idempotent', false);
end;
$$;

create or replace function public.finish_ai_session(
  p_user_id uuid,
  p_session_id uuid,
  p_outcome text,
  p_telemetry jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session public.ai_sessions%rowtype;
  v_request_count integer;
  v_credit_refunded boolean := false;
begin
  if p_outcome not in ('completed', 'failed', 'refunded') then
    raise exception 'invalid_session_outcome';
  end if;

  select * into v_session from public.ai_sessions
  where id = p_session_id and user_id = p_user_id for update;
  if not found then raise exception 'session_not_found'; end if;

  if v_session.status in ('completed', 'failed', 'refunded') then
    return jsonb_build_object('sessionId', v_session.id, 'status', v_session.status, 'idempotent', true, 'creditRefunded', false);
  end if;

  v_request_count := greatest(0, least(500, coalesce((p_telemetry->>'requestCount')::integer, 0)));

  if p_outcome in ('failed', 'refunded')
    and v_request_count = 0
    and v_session.source = 'reward_credit'
    and v_session.reward_credit_id is not null then
    update public.reward_credits
    set credits_remaining = least(credits_granted, credits_remaining + 1),
        consumed_at = null
    where id = v_session.reward_credit_id
      and user_id = p_user_id
      and feature = v_session.feature;
    v_credit_refunded := found;
  end if;

  update public.ai_sessions set
    status = p_outcome,
    completed_at = case when p_outcome = 'completed' then now() else null end,
    failed_at = case when p_outcome in ('failed', 'refunded') then now() else null end,
    provider = nullif(left(coalesce(p_telemetry->>'provider', ''), 40), ''),
    model = nullif(left(coalesce(p_telemetry->>'model', ''), 80), ''),
    request_count = v_request_count,
    input_tokens = greatest(0, coalesce((p_telemetry->>'inputTokens')::bigint, 0)),
    output_tokens = greatest(0, coalesce((p_telemetry->>'outputTokens')::bigint, 0)),
    transcription_seconds = greatest(0, coalesce((p_telemetry->>'transcriptionSeconds')::numeric, 0))
  where id = p_session_id;

  insert into public.usage_events (user_id, session_id, event_name, feature, metadata)
  values (
    p_user_id,
    p_session_id,
    'ai_session_' || p_outcome,
    v_session.feature,
    jsonb_build_object('creditRefunded', v_credit_refunded)
  );

  return jsonb_build_object('sessionId', p_session_id, 'status', p_outcome, 'idempotent', false, 'creditRefunded', v_credit_refunded);
end;
$$;

revoke all on function public.start_ai_session(uuid, text, text) from public, anon, authenticated;
revoke all on function public.finish_ai_session(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.start_ai_session(uuid, text, text) to service_role;
grant execute on function public.finish_ai_session(uuid, uuid, text, jsonb) to service_role;

-- Source: 202609270001_pro_plan_limits.sql
-- Approved Citizenship AI Pro fair-use limits.
-- Billing remains inactive until a verified store provider is connected.

update public.ai_feature_config
set pro_monthly_limit = case feature
  when 'coach' then 30
  when 'classicInterview' then 15
  when 'writing' then 30
  when 'speaking' then 30
  when 'realInterview' then 1
  else pro_monthly_limit
end,
updated_at = now()
where feature in ('coach', 'classicInterview', 'writing', 'speaking', 'realInterview');

-- Source: 202609300001_saved_questions.sql
-- Apply through the normal reviewed migration process; never run from the client.
create table if not exists public.saved_questions (
  user_id uuid not null references auth.users(id) on delete cascade,
  test_version text not null,
  question_id integer not null check (question_id > 0),
  saved boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, test_version, question_id)
);
alter table public.saved_questions enable row level security;
revoke all on public.saved_questions from anon, authenticated;
grant all on public.saved_questions to service_role;

-- Source: 202610050001_brain_profiles.sql
-- Reviewed, opt-in encrypted profile snapshots. Apply using the normal migration
-- workflow. The API encrypts each domain using PROFILE_ENCRYPTION_KEY; never
-- place this key in Supabase tables or expose it through a VITE_ variable.
alter table public.user_profiles add column if not exists private_profile jsonb;
alter table public.user_profiles add column if not exists profile_consent_at timestamptz;

create table if not exists public.immigration_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  private_profile jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.n400_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  private_profile jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.case_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  private_profile jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.immigration_profiles enable row level security;
alter table public.n400_profiles enable row level security;
alter table public.case_profiles enable row level security;
-- Existing account architecture denies direct browser table access. The server
-- verifies the bearer JWT and derives user_id; no client-supplied owner is used.
revoke all on public.immigration_profiles, public.n400_profiles, public.case_profiles from public, anon, authenticated;
grant all on public.immigration_profiles, public.n400_profiles, public.case_profiles to service_role;
grant all on public.user_profiles to service_role;

create or replace function public.save_brain_profile(p_user_id uuid, p_user jsonb, p_immigration jsonb, p_n400 jsonb, p_case jsonb)
returns timestamptz language plpgsql security definer set search_path = public, pg_temp as $$
declare v_now timestamptz := now();
begin
  if p_user_id is null then raise exception 'invalid_profile_owner'; end if;
  if p_user->>'version' is distinct from '1' or p_immigration->>'version' is distinct from '1'
    or p_n400->>'version' is distinct from '1' or p_case->>'version' is distinct from '1'
    or not (p_user ?& array['iv','tag','ciphertext']) or not (p_immigration ?& array['iv','tag','ciphertext'])
    or not (p_n400 ?& array['iv','tag','ciphertext']) or not (p_case ?& array['iv','tag','ciphertext']) then
    raise exception 'encrypted_profile_required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':brain-profile', 0));
  insert into public.user_profiles(user_id, private_profile, profile_consent_at, updated_at)
    values(p_user_id, p_user, v_now, v_now)
    on conflict(user_id) do update set private_profile = excluded.private_profile, profile_consent_at = excluded.profile_consent_at, updated_at = excluded.updated_at;
  insert into public.immigration_profiles(user_id, private_profile, updated_at) values(p_user_id, p_immigration, v_now)
    on conflict(user_id) do update set private_profile = excluded.private_profile, updated_at = excluded.updated_at;
  insert into public.n400_profiles(user_id, private_profile, updated_at) values(p_user_id, p_n400, v_now)
    on conflict(user_id) do update set private_profile = excluded.private_profile, updated_at = excluded.updated_at;
  insert into public.case_profiles(user_id, private_profile, updated_at) values(p_user_id, p_case, v_now)
    on conflict(user_id) do update set private_profile = excluded.private_profile, updated_at = excluded.updated_at;
  return v_now;
end; $$;

create or replace function public.delete_brain_profile(p_user_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_user_id is null then raise exception 'invalid_profile_owner'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':brain-profile', 0));
  update public.user_profiles set private_profile = null, profile_consent_at = null, updated_at = now() where user_id = p_user_id;
  delete from public.immigration_profiles where user_id = p_user_id;
  delete from public.n400_profiles where user_id = p_user_id;
  delete from public.case_profiles where user_id = p_user_id;
end; $$;
revoke all on function public.save_brain_profile(uuid, jsonb, jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.delete_brain_profile(uuid) from public, anon, authenticated;
grant execute on function public.save_brain_profile(uuid, jsonb, jsonb, jsonb, jsonb) to service_role;
grant execute on function public.delete_brain_profile(uuid) to service_role;

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

UPDATE public.app_settings SET value = '{"active":false,"allowContinueWithoutPayment":false}'::jsonb WHERE key='launch_promotion';
COMMIT;
