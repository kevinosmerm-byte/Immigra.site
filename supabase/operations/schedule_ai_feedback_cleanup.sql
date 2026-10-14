-- Run in the connected Supabase project's SQL Editor after the feedback migration.
-- Requires pg_cron support in the project. This does not change subscriptions.
begin;
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'immigra-ai-feedback-retention',
  '0 * * * *',
  $command$select public.purge_expired_ai_feedback();$command$
);
commit;
select jobname, schedule, active
from cron.job
where jobname = 'immigra-ai-feedback-retention';
