-- Approved Citizenship AI Pro fair-use limits.
-- Billing remains inactive until a verified store provider is connected.

update public.ai_feature_config
set pro_monthly_limit = case feature
  when 'coach' then 30
  when 'classicInterview' then 15
  when 'writing' then 30
  when 'speaking' then 30
  when 'realInterview' then 1
  else pro_monthly_limit
end,
updated_at = now()
where feature in ('coach', 'classicInterview', 'writing', 'speaking', 'realInterview');
