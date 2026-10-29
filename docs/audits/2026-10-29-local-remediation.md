# Local audit remediation — 2026-10-29

Base: `243d214d7750d158c91373d2c5295177617268ba`, verified against canonical `kevinosmerm-byte/Immigra.site/main` before editing. These are local changes, not proof of deployment or production readiness.

## Asylum session context

Prepared practice snapshots only the text selected for that start (up to the existing 6,000-character transport limit). Starting without a document sends an empty context, even when previous local sources exist. A corrected document replaces the previous practice context; existing case sources are not erased. Ordinary case-workspace practice snapshots its current sources at start rather than recomputing during rendering. Each new interview's existing session ID keys the conversation component so its mount-only engine cannot reuse the preceding session. Existing account-ID remount isolation remains unchanged.

The repository contains no generator for the integrated `runtime.generated.js`. `modules/asylum/scripts/build.cjs` only copies the standalone source to its own distribution. The prepared-start and session-snapshot edits are therefore synchronized in `apps/web/master.js` and the integrated runtime, with tests executing both entry points against the actual core and the actual integrated call expression. This is not a claim that the integrated runtime was regenerated.

## Educational feedback: bounded mitigation, not semantic verification

Natural, answer-specific coaching remains enabled. The existing exact-evidence checks, current-answer checks, reviewed clarification choices, and uncertainty constraints remain intact. The provider schema now bounds feedback length; runtime checks enforce the prompt's 75-word/no-extra-question contract and reject a narrow set of explicit concealment/fabrication directions and legal guarantees. Tests include natural Spanish/English coaching that preserves partial uncertainty and adversarial mocked outputs.

**AI02 remains OPEN (mitigated, not fixed):** independent mocked-provider review still reproduced acceptance of invented biographical detail inside otherwise bounded feedback. Exact evidence does not validate the separate free-form prose. These checks do **not** prove that free-form feedback is true, appropriate, or free of every unsafe paraphrase. No live model evaluation was run. Human-reviewed bilingual adversarial evaluations and monitoring remain necessary before treating this audit risk as closed. The patch does not replace personalized coaching with fixed generic text.

## Verification boundary

All provider/payment tests in this change use local mocks or isolated fixtures. No live AI calls, payments, external configuration changes, deployment, or remote migration is authorized or performed by this patch. Any new database migration must be reviewed, authorized, and applied separately before enabling dependent code. A local build or static release check is not the production readiness gate.

The local `npm run verify:production` check was run and intentionally remains failing: `stripe_lifecycle`, `backup_restore`, `native_store_billing`, `physical_devices`, `store_records`, `native_auth_redirect`, and `scheduled_monitoring` are still unverified in the readiness record. No flags were changed to manufacture a pass.

## Other local corrections and final checks

See [payment/security rollout and unresolved findings](../security/2026-10-29-payment-hardening.md). Authenticated durable checkout reservations are staged and **disabled by default**. Guest duplicate-checkout risks remain open for initial/lost/expired-proof requests. Webhook ordering and trusted-proxy policy also remain open.

Home corrections preserve existing artwork and navigation: responsive/lossless WebP derivatives, non-overlapping consent banner, language confirmation from the highlighted selection, canonical public redirects with safe campaign parameters, and immutable caching only for generated hashed JS/CSS. Local built-server HTTP checks verified the six aliases, unchanged citizenship redirects, query filtering, and cache headers. Full-size derivative pixels and deterministic resized variants were verified. Automated browser screenshots/interactions were blocked by the available browser sandbox/connectivity, so HTTP/unit assertions are not presented as visual end-to-end QA.

Final local `npm run build`: **passed**, 300 root tests and 334 citizenship tests, both builds, citizenship lint (existing warnings), mobile/store static checks, and static release checks. `git diff --check`: passed. No live provider, payment, deployment, native-device, restore, or store-submission tests were run. Build logs are retained alongside the handoff evidence, not committed as application source.
