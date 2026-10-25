# Google Ads conversion setup — 2026-10-25

Created and saved in Google Ads:

- Name: IMMIGRA — Suscripción pagada
- Category: Subscribe
- Destination: `AW-17910999514/oryYCMy6yKkdENrT0NxC`
- Dynamic value, USD fallback 0; count once; 90-day click window.
- Observed status: inactive, no conversions received.
- Google made Subscribe an account-default goal (2 campaigns); campaigns were paused. No campaigns or budgets were enabled.

The public-page tag is separate from this event. The payment event is now implemented for live, positive USD subscription Checkout payments, after server verification and an explicit per-purchase opt-in on a separate confirmation document. Deployment verification is recorded below. No real payment or live conversion was generated for testing.

Implementation requirements:

- Verify a live Stripe payment server-side with ownership/device-proof checks, positive amount, and paid status. A successful return URL, an active entitlement, `trialing`, or `no_payment_required` is not proof of payment.
- Cover authenticated checkout and guest checkout. Guest verification is in `modules/citizenship/server/guestCheckout.js`; authenticated checkout is in `stripeBilling.js`.
- Keep Google scripts out of account/interview SPA screens. Use a separate clean confirmation document and an authenticated, short-lived server proof if implementing browser-based measurement.
- Expand the opt-in disclosure to explicitly cover payment measurement before sending purchase values. Existing consent wording covers public-page visits only.
- Use an opaque deduplication transaction identifier, amount and currency only. Do not send email, account IDs, Stripe session IDs, interview data, or documents.
- Test failed, free, trial, duplicate, forged, foreign-owner and native flows without a real charge. Never trigger a fake conversion in the live Ads account for testing.

The rejected advertisement was inspected: “VENEZUELA: La VERDAD Prohibida detras de sus CÁRCELES POLÍTICAS”, campaign “Vistas de de video del 2026-05-11”. Google reports YouTube/Discover negative imagery and events; the campaign ended. This is distinct from IMMIGRA app-store review. No advertisement, campaign or budget was enabled or edited.

## Verification

- Full build passed: 245 root/residency tests and 321 citizenship tests, lint, build, mobile/iOS/store readiness and release checks.
- After the CSP adjustment, 7 targeted frontend/security tests and the public build passed. Google conversion script/frame permissions are scoped to public measurement documents, per https://developers.google.com/tag-platform/security/guides/csp.
- Local browser preview used a synthetic receipt, no Stripe call and no Google event. Decline hid the prompt and preserved the account link.
- Signed HttpOnly receipt expires after ten minutes; forged/expired receipts, test payments, zero-value/free payments, unpaid sessions, foreign ownership and native paths do not trigger measurement. HMAC transaction identifiers deduplicate retries without exposing Stripe IDs.
- No renewals or delayed first charge after a Stripe-side trial are measured by this Checkout-only integration. The existing app trial precedes payment Checkout; no billing behavior was changed.
- A real attributed payment with consent is still needed to verify receipt in Google Ads. Browser/ad blockers, declined consent or not returning from Checkout can prevent browser-based attribution.
