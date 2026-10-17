# Google web sign-in and Stripe permissions diagnosis

- **Target File / Component:** shared account provider, new Google OAuth helper/button, account/trial/paid-return views, public/shared privacy notices, billing readiness and environment example.
- **Deep User Experience Impact (Pros & Cons):** Users can choose Google instead of typing an email on the web once the Supabase provider is configured. Disabled Google stays inside the app with the email alternative. Account selection is explicit. A paid return keeps its reference and still requires matching ownership. Native Google is withheld until platform setup and the corresponding Apple requirement are addressed.
- **Root-Cause Architectural Failure:** Only email entry and magic links were offered. Separately, failing read-only Stripe account/price diagnostics were incorrectly interpreted as proof that Checkout creation also failed.
- **Production-Grade Implementation:** Reuse Supabase's Google OAuth SDK and existing server-validated encrypted HttpOnly session. Preflight public provider settings, preserve account/purchase return, validate authorization origin and provider, prevent repeat Google submissions and concurrent email/purchase actions, sanitize errors, retain email access. Add bilingual privacy explanations and owner setup instructions. Readiness now exposes a safe failure category/reference for each failed operation and explicitly marks Checkout creation as not checked. It never creates sessions while probing readiness. Correct the example APP_BASE_URL to Immigra.

## Verification

- Full build: 215 root tests, 319 Citizenship tests, lint, root/module builds, static mobile/iOS/store/release checks.
- Focused Google tests cover trusted OAuth URLs, pending purchase/plan continuity, disabled provider, failed lookup, missing settings, native block and malicious destinations.
- Eight controlled Google browser scenarios cover Spanish/English at 375/1280 px, Google navigation through the real SDK, disabled provider, lookup failure post-payment Google recovery and prevention of simultaneous Google/email/purchase actions. Twelve guest Stripe fixture scenarios also passed after this change. No real Google login or email is sent by these tests.
- Production Stripe probes returned HTTP 201 for both monthly and annual Checkout creation. A further monthly session with its HttpOnly checkout proof returned HTTP 202 `{pending:true}` when retrieved, confirming Checkout read access without payment. These created only unpaid checkout sessions; no card, payment, account registration or subscription was created. They expire through Stripe normally. Account and price diagnostics still require investigation; their failure does not negate these separate successful operations.

## External work

Google provider activation, Google Cloud OAuth credentials, consent publication/verification and actual Google login are owner actions. Follow `docs/operations/GOOGLE_SIGN_IN.md`; do not share secrets. Stripe subscription read/write, successful paid return, account linking, signed webhooks, renewal/cancellation/refund and verified portal management still require a full provider lifecycle test. HTTP 201/202 proves session creation/retrieval, not a successful charge or Pro activation. No native store purchases are enabled.
