import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getBillingConfiguration, mapStripeSubscription } from "../server/stripeBilling.js";

test("Stripe billing stays disabled until the explicit launch flag and required secrets exist", () => {
  const previous = process.env.STRIPE_BILLING_ENABLED;
  delete process.env.STRIPE_BILLING_ENABLED;
  try {
    assert.equal(getBillingConfiguration().enabled, false);
  } finally {
    if (previous === undefined) delete process.env.STRIPE_BILLING_ENABLED;
    else process.env.STRIPE_BILLING_ENABLED = previous;
  }
});

test("The public launch price is enabled only when Checkout has a matching introductory Price", () => {
  const previous = process.env.STRIPE_PRICE_MONTHLY_INTRO;
  delete process.env.STRIPE_PRICE_MONTHLY_INTRO;
  try {
    assert.equal(getBillingConfiguration().introductoryOfferEnabled, false);
    process.env.STRIPE_PRICE_MONTHLY_INTRO = "price_test_intro";
    assert.equal(getBillingConfiguration().introductoryOfferEnabled, true);
  } finally {
    if (previous === undefined) delete process.env.STRIPE_PRICE_MONTHLY_INTRO;
    else process.env.STRIPE_PRICE_MONTHLY_INTRO = previous;
  }
});

test("Stripe subscription states map to server-authoritative entitlements", () => {
  const active = mapStripeSubscription({
    status: "active",
    current_period_start: 1_800_000_000,
    current_period_end: 1_802_592_000,
  });
  assert.equal(active.tier, "pro");
  assert.equal(active.status, "active");
  assert.match(active.periodEnd, /^2027-/);

  assert.deepEqual(
    mapStripeSubscription({ status: "past_due", items: { data: [] } }),
    { tier: "pro", status: "grace", periodStart: null, periodEnd: null },
  );
  assert.equal(mapStripeSubscription({ status: "canceled", items: { data: [] } }).status, "revoked");
  assert.equal(mapStripeSubscription({ status: "unpaid", items: { data: [] } }).tier, "free");
});

test("Stripe webhook receives the raw request body before JSON parsing", async () => {
  const source = await readFile(new URL("../server/server.js", import.meta.url), "utf8");
  const webhook = source.indexOf('app.post("/api/billing/webhook", express.raw');
  const jsonParser = source.indexOf('app.use(express.json({ limit: "256kb" }))');
  assert.ok(webhook >= 0, "webhook route should exist");
  assert.ok(jsonParser > webhook, "raw webhook route must be mounted before express.json");
  assert.match(source, /stripe-signature/);
});

test("Checkout accepts only allowlisted billing intervals and authenticated accounts", async () => {
  const source = await readFile(new URL("../server/billingRoutes.js", import.meta.url), "utf8");
  assert.match(source, /router\.use\(requireAccount\)/);
  assert.match(source, /\["monthly", "annual"\]\.includes\(interval\)/);
  assert.doesNotMatch(source, /req\.body\?\.price/);
});

test("Web checkout is hidden from native store builds and account deletion cannot orphan an active charge", async () => {
  const accountUi = await readFile(new URL("../src/Account.jsx", import.meta.url), "utf8");
  const routes = await readFile(new URL("../server/accountRoutes.js", import.meta.url), "utf8");
  assert.match(accountUi, /!Capacitor\.isNativePlatform\(\)/);
  assert.match(routes, /active_subscription_requires_cancellation/);
  assert.match(routes, /getBillingIdentity\(req\.account\.userId\)/);
});
