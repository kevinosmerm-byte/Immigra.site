# Citizenship AI operations and cost-safety runbook

This runbook describes production controls without containing credentials, keys, tokens or provider prices.

## Current launch state

- Free local study features remain available regardless of AI quota state.
- Launch-promotion access is remotely controlled through the `launch_promotion` record in Supabase `app_settings`.
- Each cost-generating AI feature is independently controlled by `ai_feature_config.enabled`.
- Environment variable `DISABLED_AI_FEATURES` is the emergency override when database controls are unavailable.
- Rewarded advertising remains inactive. Web subscriptions have a Stripe Checkout, Portal, and signed-webhook foundation, but `STRIPE_BILLING_ENABLED` remains false until the test-mode launch checklist passes.

## Emergency cost shutdown

1. Disable only the affected feature in `ai_feature_config`; avoid disabling unrelated study tools.
2. For an immediate hosting-level override, add the feature key to `DISABLED_AI_FEATURES` and redeploy the API.
3. Valid feature keys are `coach`, `classicInterview`, `writing`, `speaking`, and `realInterview`.
4. Confirm `/api/account/public-config` reports that feature as `false` without exposing any private configuration.
5. Confirm a new provider request is rejected before OpenAI or D-ID is called.

## Ending or restoring launch promotion

- Set both `active` and `allowContinueWithoutPayment` deliberately in the `launch_promotion` JSON value.
- The API caches this decision for at most 30 seconds.
- The browser and packaged apps retrieve the current state from the public configuration endpoint; an app-store release is not required.
- When promotion is disabled, anonymous users cannot start new costly sessions. Free local study remains accessible.

## Incident checks

1. Check Render health and deployment status.
2. Check Supabase availability and recent authentication/database errors.
3. Compare `ai_session_started`, completion/failure/refund events and `ai_provider_request` records.
4. Look for repeated `429` responses, session-feature mismatch errors or reward verification conflicts.
5. Never copy recordings, transcripts, answers, receipt numbers, access tokens or secret keys into an incident ticket.

## Expected failure behavior

- A session closed before any provider request is refunded.
- A session with recorded provider usage is completed for cost accounting.
- Repeated finish requests are idempotent.
- A consumed rewarded credit is restored at most once when no provider request occurred.
- If shared rate limiting is unavailable, the API uses a bounded in-memory fallback.
- If remote feature configuration cannot be read, provider endpoints retain server-side rate and session protections.

## Routine release verification

Run:

```bash
npm ci
npm run quality
```

Then verify:

- `/health` returns `200` and `{ "status": "ok" }`.
- `/api/account/public-config` returns only publishable account configuration, promotion state and feature booleans.
- No response or build artifact contains server credentials.
- Free Civics, study cards, quiz, podcasts and educational resources still work without an account.
- Microphone denial, provider failure and network interruption leave a recoverable user path.

## Paid-launch gates

Do not enable paid subscriptions or rewarded ads until all of the following are complete:

- Provider selected and official server-signature verification implemented. (Complete for Stripe web billing; still required separately for Apple and Google.)
- Sandbox purchase, renewal, cancellation, expiration and restoration tested.
- Reward callback replay and premature-ad-close tests passed.
- App Store and Google Play privacy/data-safety disclosures reviewed.
- Pricing and fair-use limits approved from measured provider telemetry.
- Legal copy receives final professional review for the paid launch.

## Production verification record

Verified September 20, 2026 after the monetization-safety rollout:

- The public `/api/health` route returned HTTP 200 through the Citizenship AI domain.
- The direct Render `/health` route returned HTTP 200.
- The Cloudflare proxy returned the public account configuration successfully.
- Supabase account support reported configured.
- Launch promotion reported active.
- All five AI feature switches reported enabled.
- The verification used only health and public-configuration reads; it did not invoke OpenAI, D-ID, USCIS or another usage-billed feature.

The monetization foundation is ready for the iOS/App Store preparation phase. Rewarded advertising and paid subscriptions remain intentionally inactive until their provider-specific paid-launch gates are completed. Stripe web billing code is present but remains disabled until `docs/WEB_BILLING_SETUP.md` is completed.
