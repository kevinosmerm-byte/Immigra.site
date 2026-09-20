# Citizenship AI monetization architecture

## Decision

Use Supabase Auth and Supabase Postgres behind the existing private Express API on Render. The browser and Capacitor apps authenticate with a publishable key. Only the Render service receives the private Supabase secret key and performs entitlement or usage mutations.

This matches the current React + Capacitor + Express architecture and keeps Google Play, Apple and any future RevenueCat integration behind one neutral entitlement model.

## Phases

1. **Central configuration — complete.** AI features and introductory limits live in `shared/featureAccessConfig.js`.
2. **Account foundation — active.** Supabase is configured, and the optional email-link account UI preserves anonymous promotional access and local progress.
3. **Durable usage ledger — prepared.** The migration creates profiles, entitlements, feature configuration, sessions, rewards and privacy-conscious usage events.
4. **Endpoint protection — complete.** Signed-in AI calls carry an authenticated, active `ai_session_id`, and the server verifies ownership and feature matching before provider work.
5. **Quota UI — promotional version complete.** The current sheet informs users of future Pro pricing and permits continued promotional access.
6. **Rewarded ads — future.** AdMob server-side verification will grant credits; the client will never grant its own reward.
7. **Subscriptions — future.** Provider webhooks will update `entitlements`; app code only asks whether Pro is active.
8. **Cost telemetry — active.** Provider, model, token totals, request count and transcription duration are recorded without conversation or audio content.
   Text responses are capped at 220 output tokens by default (server-configurable, hard ceiling 600), and microphone clips stop automatically after 45 seconds.
   OpenAI requests time out after 30 seconds with at most one SDK retry; D-ID and USCIS requests time out after 15 seconds.
   Provider attempts that fail or time out are still recorded as request units, so cost estimates do not silently exclude unsuccessful calls.
9. **Abuse and recovery testing — required before enforcement.** Test rapid starts, replayed keys, expired tokens, failed AI providers and refunds.

## Session boundaries

| Feature | One counted session |
| --- | --- |
| AI English Coach | Opening one conversation, including all exchanges until exit |
| Classic Interview | One complete interview attempt containing all questions and recordings |
| Writing AI | Opening one writing-practice module until exit |
| Speaking / Reading AI | Opening one spoken-practice module until exit |
| Real Interview | One D-ID-backed interview attempt |

The quota check happens before module entry. Subsequent API calls must carry the same session ID and never consume additional practice credits.

## Existing users and local progress

Do not migrate or delete `civicsViewed`, favorites, local practice history, language or onboarding preferences. They remain available offline. When accounts become visible, only AI entitlement and quota data become server-authoritative. The existing promotional counter is informational and is not imported as a paid balance.

## Endpoint security

- Verify every bearer token with Supabase Auth on the server.
- Atomically create sessions through a Postgres function using a per-user/per-feature advisory lock and an idempotency key.
- Reject unknown, disabled or exhausted features before provider work begins.
- Require the issued session ID on `/coach`, `/transcribe`, evaluation and avatar endpoints during Phase 4.
- Never place `SUPABASE_SECRET_KEY`, OpenAI, D-ID or USCIS credentials in a `VITE_` variable.
- Rate limits are shared across instances through atomic Supabase windows. Only a server-keyed HMAC identifier is stored; IP addresses are not account identity and are never stored in the limiter table.
- Expired limiter windows are removed probabilistically in bounded batches, preventing the protection table from growing indefinitely without requiring another paid scheduler.

## Database objects

- `user_profiles`: stable app identity linked to `auth.users`.
- `entitlements`: neutral Free/Pro state populated later by verified store webhooks.
- `ai_feature_config`: remotely adjustable availability, Free allowance, Pro allowance and rewarded-ad permission.
- `ai_sessions`: idempotent session ledger with lifecycle and aggregate cost telemetry.
- `reward_credits`: verified reward grants and atomic consumption.
- `usage_events`: privacy-conscious operational events only.
- `app_settings`: remote launch-promotion and safety configuration.

All tables use RLS and revoke direct browser access. Only the private API executes the session functions.

## Rewarded ads

Use the Capacitor AdMob plugin only for voluntary rewarded placements. Android server-side verification should call a private API endpoint, validate the provider callback, deduplicate its verification ID and then insert one `reward_credits` grant. Real Interview keeps rewarded ads disabled.

## Subscription entitlements

Store purchases are adapters, not business logic. Verified Google Play, App Store or RevenueCat webhooks update `entitlements`. The application consumes one normalized response: tier, status, period and per-feature allowance.

## Security risks still open

- Reward callbacks and subscription webhooks need signature verification and replay protection.
- Authenticated account export and explicitly confirmed deletion are available; paid-launch legal copy should receive final counsel review.
- Database migration and RLS tests must run against the actual Supabase project before enforcement.
