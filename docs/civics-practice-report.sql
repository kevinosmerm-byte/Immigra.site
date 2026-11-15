-- Aggregate counts only. All dates use America/Chicago. Google Ads uses Pacific time.
-- Public visit/answer counts cover consenting browser tabs, deduplicated per language per tab.
-- Verified accounts are from all channels. Counts cannot establish individual ad attribution.
with dates as (
  select (timestamp '2026-11-09' at time zone 'America/Chicago') as since, now() as until
), accounts as (
  select u.id, u.email_confirmed_at from auth.users u, dates d
  where u.email_confirmed_at >= d.since and u.email_confirmed_at < d.until
    and coalesce(u.is_anonymous,false) = false
), events as (
  select e.* from public.usage_events e, dates d where e.created_at >= d.since and e.created_at < d.until
), first_session as (
  select user_id, min(created_at) as first_done from events
  where event_name = 'practice_completed' and feature = 'civics_intro' group by user_id
)
select
  (select count(*) from accounts) as cuentas_confirmadas_todos_los_canales,
  (select count(distinct a.id) from accounts a join events e on e.user_id=a.id and e.created_at>=a.email_confirmed_at where e.event_name='practice_completed') as nuevas_cuentas_con_practica_registrada,
  (select count(*) from events where event_name='civics_sample_visit') as visitas_publicas_con_permiso,
  (select count(*) from events where event_name='civics_sample_answered') as primeras_respuestas_con_permiso,
  (select count(*) from events where event_name='civics_sample_visit' and metadata->>'source'='ads') as visitas_con_marca_ads,
  (select count(distinct user_id) from events where feature='civics_intro' and event_name='practice_started') as cuentas_que_abrieron_la_practica,
  (select count(*) from first_session) as cuentas_que_completaron_tres_preguntas,
  (select count(*) from first_session f, dates d where f.first_done<=d.until-interval '7 days') as cohorte_con_siete_dias,
  (select count(*) from first_session f, dates d where f.first_done<=d.until-interval '7 days' and exists (
    select 1 from events e where e.user_id=f.user_id and e.event_name in ('practice_started','practice_completed')
    and (e.created_at at time zone 'America/Chicago')::date > (f.first_done at time zone 'America/Chicago')::date
    and e.created_at<=f.first_done+interval '7 days'
  )) as volvieron_a_practicar_en_siete_dias,
  (select count(distinct user_id) from events where event_name='upgrade_started') as cuentas_con_intento_de_suscripcion_registrado,
  (select count(distinct user_id) from events where event_name='subscription_activated' and metadata->>'provider'='stripe') as cuentas_con_activacion_stripe;
