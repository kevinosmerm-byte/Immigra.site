import test from "node:test";
import assert from "node:assert/strict";
import { paidCheckoutConversionDetails } from "../server/stripeBilling.js";
import { canTrackPaidWebCheckout } from "../src/googleAdsConversions.js";
import { PRO_PLAN } from "../shared/featureAccessConfig.js";
const fixture = {
  id: "cs_live_123AbC",
  client_reference_id: "user_one",
  metadata: { user_id: "user_one", product_key: PRO_PLAN.productKey },
  mode: "subscription", livemode: true, status: "complete", payment_status: "paid",
  subscription: "sub_123", amount_total: 599, currency: "usd",
};
test("Paid live Stripe Checkout returns actual amount, currency and transaction ID", () => {
  assert.deepEqual(paidCheckoutConversionDetails(fixture,"user_one"), {
    transaction_id: "cs_live_123AbC", value: 5.99, currency: "USD",
  });
});
test("Do not count unpaid, test, mismatched, cancelled, incomplete or zero-cost checkouts", () => {
  for (const overrides of [
    { payment_status: "unpaid" }, { status: "open" }, { livemode: false },
    { amount_total: 0 }, { currency: "eur" }, { metadata: {} },
    { client_reference_id: "someone_else" }, { mode: "payment" }, { subscription: null },
  ]) assert.equal(paidCheckoutConversionDetails({ ...fixture, ...overrides }, "user_one"), null);
  assert.equal(paidCheckoutConversionDetails(fixture, "another_user"), null);
});
test("Only live web success redirects qualify for paid conversion verification", () => {
  assert.equal(canTrackPaidWebCheckout({ search:"?billing=success&session_id=cs_live_123AbC", accessToken:"token", native:false }), "cs_live_123AbC");
  assert.equal(canTrackPaidWebCheckout({ search:"?billing=cancelled&session_id=cs_live_123AbC", accessToken:"token", native:false }), null);
  assert.equal(canTrackPaidWebCheckout({ search:"?billing=success&session_id=cs_test_123", accessToken:"token", native:false }), null);
  assert.equal(canTrackPaidWebCheckout({ search:"?billing=success&session_id=cs_live_123AbC", accessToken:"token", native:true }), null);
  assert.equal(canTrackPaidWebCheckout({ search:"?billing=success&session_id=cs_live_123AbC", accessToken:"", native:false }), null);
});
test("Payment conversion endpoint requires account and reports no sensitive customer fields", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../server/billingRoutes.js", import.meta.url),"utf8");
  assert.match(source,/router\.use\(requireAccount\)/);
  assert.match(source,/verifyPaidCheckoutForAds/);
  const ui = await readFile(new URL("../src/Account.jsx", import.meta.url),"utf8");
  assert.match(ui,/reportPaidSubscriptionConversion/);
});
