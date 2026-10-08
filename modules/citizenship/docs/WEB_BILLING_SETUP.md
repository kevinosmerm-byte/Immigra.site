# Web billing setup (Stripe test mode first)

CitizenshipAI includes a server-side Stripe Checkout and Customer Portal integration. It is intentionally disabled by default. Do not switch on live payments until every test below passes.

## Architecture and safety

- The browser sends only `monthly` or `annual`; Stripe Price IDs stay on Render.
- Checkout requires a valid Supabase user session.
- A successful browser redirect does **not** unlock Pro.
- Only Stripe-signed subscription webhooks can update `entitlements` through the service-role-only `apply_verified_entitlement_event` function.
- Event IDs are stored for replay protection, and older events cannot overwrite newer entitlement state.
- Full card details are entered on Stripe Checkout and are never stored by CitizenshipAI.

## 1. Configure Stripe in test mode

1. Create the `Citizenship AI Pro` product.
2. Create two recurring USD prices:
   - Monthly: `$5.99`.
   - Optional launch monthly price: `$4.99`. This must be a real recurring Stripe Price; the app never advertises `$4.99` while sending a `$5.99` Price to Checkout.
   - Annual: `$49.99`.
3. Enable and brand the Stripe Customer Portal. Allow customers to update payment details and cancel subscriptions.
4. Decide whether Stripe Tax applies only after reviewing registrations and tax obligations. Keep automatic tax off until that review is complete.

## 2. Add private Render environment variables

Use test-mode values first. Never add these values to Git, Cloudflare Pages, `VITE_*`, screenshots, or support messages.

```text
STRIPE_BILLING_ENABLED=false
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_MONTHLY_INTRO=price_... # optional; remove it when the launch offer ends
STRIPE_PRICE_ANNUAL=price_...
STRIPE_AUTOMATIC_TAX=false
APP_BASE_URL=https://citizenshipai.us
```

## 3. Register the webhook

Create a Stripe webhook endpoint at:

```text
https://YOUR-RENDER-API.example.com/api/billing/webhook
```

Subscribe it to:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy its signing secret to `STRIPE_WEBHOOK_SECRET` in Render, then redeploy.

## 4. Test the complete lifecycle

Keep `STRIPE_BILLING_ENABLED=false` while configuration is being entered. After a successful Render deploy, temporarily set it to `true` in the test environment and verify:

1. A signed-out user cannot create a Checkout Session.
2. Monthly and annual buttons open Stripe's test Checkout.
3. A completed test payment creates an active Pro entitlement.
4. Refreshing or editing the success URL does not grant Pro by itself.
5. The Customer Portal opens for the subscribed account.
6. Cancellation and payment-failure events correctly change access.
7. Replaying the same Stripe event is harmless.
8. Account export and permanent account deletion still work.
9. Spanish and English account screens render correctly on mobile.

Only after this checklist passes should test Price IDs and keys be replaced with live-mode values. Set `STRIPE_BILLING_ENABLED=true` last.

## Platform note

This integration is for purchases made on the website. Native iOS and Android digital subscriptions must separately comply with Apple App Store and Google Play billing rules; do not place the web Checkout button inside native store builds without a policy review.
