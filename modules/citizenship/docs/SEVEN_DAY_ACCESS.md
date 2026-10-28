# Seven-day access policy

The trial begins with the account's first interview or paid-provider practice session, not signup or a page-view counter. It lasts 168 hours. An account is required for premium practice, but the trial requires no payment card and does not create a subscription or charge at expiry. A verified active subscription permits continued practice afterward. Monthly and annual Stripe Checkout no longer add a second trial. Existing Stripe subscription/trial agreements and verified entitlement records are preserved; their previously accepted billing schedules are not canceled by this migration.

Trial and subscribed practice have no daily/monthly usage quotas. Operational request-rate protection, microphone/turn/session limits and temporary provider availability still apply. Interviews (guided, civics and N-400), AI conversation, writing feedback and reading/speech transcription are premium. Civics study, flashcards, deterministic local quizzes, vocabulary, podcasts, preparation guide, profiles, progress and official/professional resources remain free. Learning progress is never a paid entitlement.

## Activation order

1. Ensure the existing Supabase migrations are installed and the Render account/provider configuration works. The previously observed OpenAI authentication failure must be corrected separately; this policy does not fix credentials.
2. Apply `supabase/migrations/202610120001_seven_day_trial.sql` through the Supabase SQL editor or the established migration workflow. It is transactional, adds an account-owned first-use timestamp, preserves existing users and verified subscriptions, disables perpetual promotional/reward access and replaces the reservation/snapshot functions. It does not start existing accounts' trials during migration; their one-time window starts with the first premium use after activation under this new policy. Do not edit individual user dates to renew a trial.
3. Deploy the code from GitHub main. `/api/account/public-config` must report `practicePolicyReady: true`. Until then, new web Checkout is disabled in the public configuration and rejected by the billing API. Missing/old database policy cannot grant provider access.
4. Before live payments, complete the existing Stripe test-mode lifecycle in `WEB_BILLING_SETUP.md`. Existing prices remain $5.99/month and $49.99/year. A subscription requires a separate, explicit purchase; there is no automatic free-to-paid conversion. Native builds do not offer Stripe Checkout; their store integrations remain separate.
5. Verify a real account starts at `not_started`, receives exactly one first-use window across features/devices, has `trial_active` access during that window, and receives `trial_expired` afterward unless a verified subscription is active. Check provider calls, not only browser redirects.

## Enforcement

`get_practice_access` is service-role-only and uses database time plus verified subscription records. Reservations serialize by account and cannot reset the initial timestamp; exhausted trial access cannot reuse an old session ID. Every provider request rechecks current access, including sessions opened before expiry. Public local-storage changes and claimed subscription sources do not unlock access. The browser protects direct premium links, ends open interviews at expiry, handles auth-token refresh and invalidates pending reservations when account/navigation changes. It never continues a premium flow after a failed access check.

## Validation and limits

The committed PostgreSQL/PGlite test applies the actual migrations with pgcrypto and checks the first-use anchor, 75 sessions without count quotas, cross-feature dates, exact expiry, idempotency, old-session denial, verified/expired subscriptions, disabled features and database privileges. A middleware integration test checks refreshed server access, feature ownership, authentication and failure-closed behavior. Chromium fixtures validate guest/expired/trial/subscribed/error states, free study after expiry, in-session expiry, no two-session notice, auth-token refresh, accessible mobile dialogs and keyboard dismissal. These tests do not charge cards or call paid providers.

This workspace has no administrative connection to the production Supabase database. Saving/pushing the migration file is not proof that it was applied. The live provider authentication issue, live payment lifecycle and physical native devices require separate verification.
