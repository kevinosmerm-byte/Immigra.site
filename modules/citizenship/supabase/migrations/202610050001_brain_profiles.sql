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
