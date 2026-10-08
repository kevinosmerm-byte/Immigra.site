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
