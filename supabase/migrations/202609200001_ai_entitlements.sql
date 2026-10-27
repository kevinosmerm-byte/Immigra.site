-- Immigra.site: server-authoritative accounts, entitlements and AI sessions.
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

