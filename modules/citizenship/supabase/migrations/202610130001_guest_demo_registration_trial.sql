-- Prerequisite for the two-use anonymous demo. Service-role access only.
-- Deploy the application integration separately; this does not enable guest access.
begin;

create table if not exists public.guest_demo_usage (
  subject_hash text primary key check (subject_hash ~ '^[a-f0-9]{64}$'),
  uses integer not null default 0 check (uses between 0 and 2),
  created_at timestamptz not null default now()
);
create table if not exists public.guest_demo_reservations (
  subject_hash text not null references public.guest_demo_usage(subject_hash) on delete cascade,
  request_id uuid not null,
  feature text not null references public.ai_feature_config(feature),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  primary key (subject_hash, request_id)
);
alter table public.guest_demo_usage enable row level security;
alter table public.guest_demo_reservations enable row level security;
revoke all on public.guest_demo_usage, public.guest_demo_reservations from public, anon, authenticated;

create or replace function public.reserve_guest_demo(p_subject_hash text, p_request_id uuid, p_feature text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uses integer; v_res public.guest_demo_reservations%rowtype;
begin
  if p_subject_hash is null or p_subject_hash !~ '^[a-f0-9]{64}$' or p_request_id is null then
    raise exception 'invalid_demo_request';
  end if;
  if not exists(select 1 from public.ai_feature_config where feature = p_feature and enabled) then
    return jsonb_build_object('allowed',false,'reason','feature_unavailable');
  end if;
  insert into public.guest_demo_usage(subject_hash) values(p_subject_hash) on conflict do nothing;
  select uses into v_uses from public.guest_demo_usage where subject_hash=p_subject_hash for update;
  select * into v_res from public.guest_demo_reservations where subject_hash=p_subject_hash and request_id=p_request_id;
  if found then
    return jsonb_build_object('allowed',v_res.feature=p_feature and v_res.expires_at>now(),
      'remaining',2-v_uses,'expiresAt',v_res.expires_at,'idempotent',true);
  end if;
  if v_uses>=2 then return jsonb_build_object('allowed',false,'reason','account_required','remaining',0); end if;
  update public.guest_demo_usage set uses=uses+1 where subject_hash=p_subject_hash;
  insert into public.guest_demo_reservations(subject_hash,request_id,feature)
    values(p_subject_hash,p_request_id,p_feature) returning * into v_res;
  return jsonb_build_object('allowed',true,'remaining',1-v_uses,'expiresAt',v_res.expires_at);
end;
$$;
revoke all on function public.reserve_guest_demo(text,uuid,text) from public, anon, authenticated;
grant execute on function public.reserve_guest_demo(text,uuid,text) to service_role;

-- New verified email registrations start the trial, not an unconfirmed email request.
-- Preserve existing trials and paid entitlements. Never restart on subsequent sign-in.
create or replace function public.start_registration_trial()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.email_confirmed_at is not null and coalesce(new.is_anonymous,false)=false then
    insert into public.user_profiles(user_id,trial_started_at) values(new.id,new.email_confirmed_at)
      on conflict(user_id) do update set trial_started_at=coalesce(public.user_profiles.trial_started_at,excluded.trial_started_at);
  end if;
  return new;
end;
$$;
revoke all on function public.start_registration_trial() from public, anon, authenticated;
drop trigger if exists immigra_registration_trial on auth.users;
create trigger immigra_registration_trial after insert or update of email_confirmed_at on auth.users
  for each row execute function public.start_registration_trial();
commit;
