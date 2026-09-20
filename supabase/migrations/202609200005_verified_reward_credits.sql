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
