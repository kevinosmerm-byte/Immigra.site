-- Read-only operator queries; never include report content or personal answers.
select date_trunc('day', created_at) as day,
       count(distinct user_id) as active_accounts,
       count(*) filter (where event_name = 'ai_provider_request') as provider_requests,
       sum(case when event_name = 'ai_provider_request' then coalesce((metadata->>'inputTokens')::numeric,0) else 0 end) as input_tokens,
       sum(case when event_name = 'ai_provider_request' then coalesce((metadata->>'outputTokens')::numeric,0) else 0 end) as output_tokens,
       sum(case when event_name = 'ai_provider_request' then coalesce((metadata->>'transcriptionSeconds')::numeric,0) else 0 end) as transcription_seconds
from public.usage_events
where created_at >= now() - interval '30 days'
group by 1 order by 1 desc;

select feature,event_name,count(*) as events
from public.usage_events
where created_at >= now() - interval '30 days'
  and event_name in ('practice_started','practice_completed','paywall_viewed','pro_selected','subscription_activated')
group by feature,event_name order by feature,event_name;

select metadata->>'module' as module,metadata->>'category' as category,count(*) as reports
from public.usage_events
where event_name='ai_content_report' and created_at >= now() - interval '30 days'
group by 1,2;

select tier,status,provider,count(*) as accounts
from public.entitlements group by tier,status,provider;
