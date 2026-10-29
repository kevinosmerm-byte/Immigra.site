-- STAGED / NOT APPLIED: deploy only with explicit approval. Enable
-- CHECKOUT_RESERVATIONS_ENABLED only after applying and testing this migration.
-- No browser access; all payloads originate from the trusted billing service.
create table if not exists public.checkout_attempts (
  scope_hash text primary key check (scope_hash ~ '^[a-f0-9]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid not null default gen_random_uuid(),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  session_id text,
  created_at timestamptz not null default now()
);
alter table public.checkout_attempts enable row level security;
revoke all on public.checkout_attempts from public, anon, authenticated;

create or replace function public.reserve_checkout_attempt(
  p_scope_hash text, p_payload jsonb, p_expired_session_id text default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_attempt public.checkout_attempts%rowtype;
begin
  if p_scope_hash is null or p_scope_hash !~ '^[a-f0-9]{64}$'
    or p_payload is null or jsonb_typeof(p_payload) <> 'object'
    or octet_length(p_payload::text) > 16384 then
    raise exception 'invalid_checkout_attempt';
  end if;
  insert into public.checkout_attempts(scope_hash, user_id, payload)
    values(p_scope_hash, (p_payload->>'client_reference_id')::uuid, p_payload)
    on conflict(scope_hash) do nothing;
  select * into v_attempt from public.checkout_attempts where scope_hash = p_scope_hash for update;
  if v_attempt.user_id <> (p_payload->>'client_reference_id')::uuid then
    raise exception 'checkout_owner_mismatch';
  end if;
  -- Caller must first retrieve this exact session from Stripe and confirm expiry.
  -- CAS ensures parallel rotations return the same immutable next attempt.
  if p_expired_session_id is not null and v_attempt.session_id = p_expired_session_id then
    update public.checkout_attempts set attempt_id = gen_random_uuid(), payload = p_payload,
      session_id = null, created_at = now() where scope_hash = p_scope_hash returning * into v_attempt;
  end if;
  return to_jsonb(v_attempt);
end;
$$;

create or replace function public.save_checkout_attempt(
  p_scope_hash text, p_attempt_id uuid, p_session_id text
) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_session_id is null or p_session_id !~ '^cs_[a-zA-Z0-9_]{8,200}$' then
    raise exception 'invalid_checkout_session';
  end if;
  update public.checkout_attempts set session_id = p_session_id
    where scope_hash = p_scope_hash and attempt_id = p_attempt_id
      and (session_id is null or session_id = p_session_id);
  return found;
end;
$$;
revoke all on function public.reserve_checkout_attempt(text,jsonb,text) from public, anon, authenticated;
revoke all on function public.save_checkout_attempt(text,uuid,text) from public, anon, authenticated;
grant execute on function public.reserve_checkout_attempt(text,jsonb,text) to service_role;
grant execute on function public.save_checkout_attempt(text,uuid,text) to service_role;
