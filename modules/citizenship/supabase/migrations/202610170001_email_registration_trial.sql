-- Email-only trial identities are created by our server, not by browser metadata.
-- Preserve prior trial dates and never grant paid entitlements here.
create or replace function public.start_registration_trial()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if coalesce(new.is_anonymous,false)=false and
    (new.email_confirmed_at is not null or new.raw_app_meta_data->>'immigra_email_trial'='true') then
    insert into public.user_profiles(user_id,trial_started_at)
      values(new.id,coalesce(new.email_confirmed_at,new.created_at,now()))
      on conflict(user_id) do update set trial_started_at=coalesce(public.user_profiles.trial_started_at,excluded.trial_started_at);
  end if;
  return new;
end;
$$;
revoke all on function public.start_registration_trial() from public, anon, authenticated;
