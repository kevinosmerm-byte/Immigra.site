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
