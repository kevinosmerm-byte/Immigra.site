begin;

alter table public.user_profiles add column if not exists trial_started_at timestamptz;
alter table public.ai_sessions drop constraint if exists ai_sessions_source_check;
alter table public.ai_sessions add constraint ai_sessions_source_check check (source in ('free_allowance','pro_allowance','reward_credit','launch_promotion','admin','free_trial'));
update public.ai_feature_config set free_session_limit = 0, pro_monthly_limit = null, rewarded_ads_enabled = false, updated_at = now();
update public.app_settings set value = '{"active":false,"allowContinueWithoutPayment":false}'::jsonb, updated_at = now() where key = 'launch_promotion';

create or replace function public.get_practice_access(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_pro boolean;
  v_paid_end timestamptz;
begin
  select trial_started_at into v_start from public.user_profiles where user_id = p_user_id;
  v_end := v_start + interval '168 hours';
  select exists(select 1 from public.entitlements where user_id = p_user_id and tier = 'pro' and status in ('active','grace') and (period_end is null or period_end > now())) into v_pro;
  if v_pro then select period_end into v_paid_end from public.entitlements where user_id = p_user_id; end if;
  return jsonb_build_object(
    'policyVersion','seven_day_first_use_v1',
    'allowed',v_pro or coalesce(now() < v_end,false),
    'tier',case when v_pro then 'pro' else 'free' end,
    'status',case when v_pro then 'subscribed' when v_start is null then 'not_started' when now() < v_end then 'trial_active' else 'trial_expired' end,
    'trialDays',7,'unlimited',true,'requiresAccount',true,
    'trialStartedAt',v_start,'trialEndsAt',v_end,
    'accessEndsAt',case when v_pro then v_paid_end else v_end end,
    'remainingDays',case when v_start is null then 7 else greatest(0,ceil(extract(epoch from (v_end - now())) / 86400)) end
  );
end;
$$;

create or replace function public.start_ai_session(p_user_id uuid, p_feature text, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_existing public.ai_sessions%rowtype;
  v_session public.ai_sessions%rowtype;
  v_access jsonb;
  v_source text;
begin
  if p_user_id is null or length(coalesce(p_idempotency_key,'')) < 12 or length(p_idempotency_key) > 128 then raise exception 'invalid_session_request'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
  if not exists(select 1 from public.ai_feature_config where feature = p_feature) then
    return jsonb_build_object('allowed',false,'reason','invalid_feature','canUpgrade',false);
  end if;
  if not exists(select 1 from public.ai_feature_config where feature = p_feature and enabled) then
    return jsonb_build_object('allowed',false,'reason','feature_unavailable','canUpgrade',false);
  end if;
  select * into v_existing from public.ai_sessions where user_id = p_user_id and idempotency_key = p_idempotency_key;
  if found and (v_existing.feature <> p_feature or v_existing.status not in ('reserved','started')) then
    return jsonb_build_object('allowed',false,'reason','inactive_ai_session','canUpgrade',false);
  end if;
  insert into public.user_profiles(user_id,trial_started_at) values(p_user_id,now())
    on conflict(user_id) do update set trial_started_at = coalesce(public.user_profiles.trial_started_at,excluded.trial_started_at);
  v_access := public.get_practice_access(p_user_id);
  if not (v_access->>'allowed')::boolean then
    return jsonb_build_object('allowed',false,'reason','trial_expired','canWatchAd',false,'canUpgrade',true,'access',v_access);
  end if;
  if v_existing.id is not null then
    return jsonb_build_object('allowed',true,'sessionId',v_existing.id,'source',v_existing.source,'idempotent',true,'access',v_access);
  end if;
  v_source := case when v_access->>'status' = 'subscribed' then 'pro_allowance' else 'free_trial' end;
  insert into public.ai_sessions(user_id,feature,idempotency_key,source,status)
    values(p_user_id,p_feature,p_idempotency_key,v_source,'started') returning * into v_session;
  insert into public.usage_events(user_id,session_id,event_name,feature,metadata)
    values(p_user_id,v_session.id,'ai_session_started',p_feature,jsonb_build_object('source',v_source));
  return jsonb_build_object('allowed',true,'sessionId',v_session.id,'source',v_source,'remaining',null,'idempotent',false,'access',v_access);
end;
$$;

create or replace function public.get_ai_usage_snapshot(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'tier', public.get_practice_access(p_user_id)->>'tier',
    'access', public.get_practice_access(p_user_id),
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


revoke all on function public.get_practice_access(uuid) from public, anon, authenticated;
revoke all on function public.start_ai_session(uuid,text,text) from public, anon, authenticated;
revoke all on function public.get_ai_usage_snapshot(uuid) from public, anon, authenticated;
grant execute on function public.get_practice_access(uuid) to service_role;
grant execute on function public.start_ai_session(uuid,text,text) to service_role;
grant execute on function public.get_ai_usage_snapshot(uuid) to service_role;
commit;
