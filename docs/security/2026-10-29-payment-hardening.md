# Payment/security hardening — staged, not deployed

Base: canonical Immigra.site main `243d214d7750d158c91373d2c5295177617268ba`.
No provider calls, purchases, live database changes, secrets changes, or deployment were performed.

## Implemented locally

- **SEC-UP02:** citizenship transcription accepts one audio file (unchanged 10 MiB ceiling), one short language field, bounded field names/values and multipart parts. Multer limit failures return sanitized 400/413 responses. Integration tests exercise the actual parser with the existing client payload, excess files/fields, large fields and large audio.
- **P3 response privacy:** all three citizenship `responses.create` requests explicitly set `store: false`. This opts out of Responses storage; it does not promise zero provider retention or change provider account policies.
- **SEC-PAY01, partial guest mitigation:** an existing valid signed checkout proof reuses its provider-verified open session; completed/unknown states and plan changes are rejected. SDK retries use an explicit key per attempt. There is no additional tracking cookie or email collection. **Two initial anonymous requests, a lost initial response, concurrent retries of an expired signed checkout, proof expiry, cleared cookies, or different devices do not share an identity and remain an unresolved duplicate-purchase risk.** This is not advertised as full guest deduplication.

## Authenticated reservation rollout — prepared, disabled by default

`CHECKOUT_RESERVATIONS_ENABLED=true` enables the new coordinator. Until then, authenticated checkout follows the existing path; **the authenticated duplicate-checkout finding remains active in production**.

1. Obtain explicit approval for a staging database migration and eventual deployment; neither is implicit in these code changes.
2. Apply `modules/citizenship/supabase/migrations/202610290001_checkout_reservations.sql` to the authorized staging database. The table is RLS-protected, browser roles cannot access it or its RPCs, and service-role RPCs serialize reservation/rotation. Owner deletion cascades to the record, including its immutable checkout payload. Existing billing tables/data are not rewritten.
3. Enable `CHECKOUT_RESERVATIONS_ENABLED=true` in staging only. With Stripe test credentials, verify simultaneous tabs/processes, monthly/annual conflicts, response loss, DB-save failure, provider completion and actual session expiration. No live purchase is needed.
4. Only after staging approval, separately authorize production migration, deployment and flag activation. Never enable the flag before the migration. The flag deliberately fails closed on missing/unavailable reservation storage; it does not silently fall back to duplicate-prone creation.

The reservation scope is a server-side SHA-256 account scope (not plan/interval). Immutable payload and UUID attempt identity survive process restart and ambiguous Stripe/DB failures. Only a retrieved Stripe session with `status=expired` can trigger compare-and-swap rotation. Completed sessions cannot create a new purchase during delayed entitlement synchronization. Plan changes while a session is open are rejected, not silently charged at another plan. Unresolved attempts older than 23 hours require provider reconciliation; their keys are not retried after Stripe's retention horizon. An operator must determine whether Stripe created the session before any manual correction; do not simply delete/reset the row. Reconciliation tooling is not included.

Local PGlite tests validate SQL syntax, repeat migration, unchanged payload, stale saves, compare-and-swap rotations, role permissions and deletion cascade. JavaScript tests simulate parallel callers and provider idempotency, including ambiguous failures. These are not a real multi-connection PostgreSQL/Stripe staging test. The local flag defaults off to preserve compatibility with the existing database.

## SEC-WEB03 — unresolved; no unsafe timestamp patch

The historical `>=` entitlement update remains unchanged. Stripe's event creation timestamp has only second precision; neither `>` nor lexical event-ID ordering can establish provider recency. Fetching provider state without cross-worker serialization also does not solve stale concurrent writes.

Required design before enabling a replacement:
- Durable per-account/subscription reconciliation queue or lock with fencing generation and retry/recovery, covering *both* webhook updates and guest claims.
- Retrieve the current subscription only while holding that generation; validate customer, account metadata, product and subscription identity. An event from an older subscription must not overwrite a newer subscription's entitlement.
- Apply the snapshot and advance the generation atomically; record event handling only after successful commit. A stale/expired worker must not commit, and an unavailable provider must leave a retryable event.
- Test both equal-second event orders, deletion/update interleaving, multiple subscription identities, worker timeout/restart, duplicate deliveries and delayed guest claims in an isolated database/provider test environment.

This requires a reviewed database/API migration and operational reconciliation policy. It has not been implemented or applied, and this finding must stay open.

## SEC-RATE04 — deployment verification still required

Existing `trust proxy = 1` and direct `cf-connecting-ip` selection remain unchanged. Repository code alone does not establish whether every live path traverses an authenticated/allowlisted Cloudflare ingress or whether direct origin access exists. Blindly removing the header or trusting arbitrary forwarding headers can collapse rate limits onto a proxy IP or preserve spoofability.

Before a production policy change, verify the complete ingress topology, direct-origin firewall behavior, and which hop overwrites forwarding headers. Then select client IP only through the verified proxy chain (and ignore Cloudflare headers unless the immediate/validated upstream is trusted), testing direct-origin/header-spoofing attempts and genuine clients. No deployment allowlist or infrastructure facts have been invented.

No new usage quotas, spending cap, prices, trial policy, or personal unlimited-plan limits are introduced.
