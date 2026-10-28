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
