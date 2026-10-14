import test from "node:test";
import assert from "node:assert/strict";
import { mapAppleSubscription, mapGoogleSubscription, getNativeStoreConfiguration } from "../server/nativeStoreVerification.js";
import { encryptPurchaseReference, decryptPurchaseReference } from "../server/nativeStoreService.js";
import { verifyAndFinishPurchase, restoreVerifiedPurchases, storeProductForPlan } from "../src/nativePurchaseFlow.js";
import { APP_IDENTITY } from "../shared/appIdentity.js";
import { readAppRoute } from "../src/appRoutes.js";

const user = "10000000-0000-4000-8000-000000000001";
const now = Date.now();
const apple = { bundleId: APP_IDENTITY.bundleId, appAccountToken: user, productId: "immigra.pro.monthly", type: "Auto-Renewable Subscription", originalTransactionId: "100000000000", transactionId: "100000000001", purchaseDate: now - 1000, expiresDate: now + 100000 };
test("Apple mapping requires account, bundle, allowlisted product and current provider status", () => {
  const map = (transaction = apple, status = 1, renewal = null) => mapAppleSubscription(transaction, status, renewal, user, [apple.productId], now);
  assert.equal(map().tier, "pro");
  for (const change of [{ bundleId: "wrong.app" }, { appAccountToken: "other-user" }, { productId: "unknown" }, { type: "Consumable" }]) assert.throws(() => map({ ...apple, ...change }), /mismatch/);
  assert.equal(map({ ...apple, revocationDate: now }).status, "revoked");
  assert.equal(map(apple, 2).tier, "free");
  assert.equal(map(apple, 3).tier, "free");
  assert.equal(map({ ...apple, expiresDate: now }, 1).tier, "free");
  assert.equal(map({ ...apple, expiresDate: now - 1 }, 4, { gracePeriodExpiresDate: now + 100000 }).status, "grace");
});
test("Google mapping handles cancellation until expiry and rejects pending, paused, wrong owner and base plan", () => {
  const product = { id: "immigra_pro", plan: "monthly" };
  const purchase = { externalAccountIdentifiers: { obfuscatedExternalAccountId: user }, subscriptionState: "SUBSCRIPTION_STATE_ACTIVE", lineItems: [{ productId: product.id, offerDetails: { basePlanId: "monthly" }, expiryTime: new Date(now + 100000).toISOString() }] };
  const map = changes => mapGoogleSubscription({ ...purchase, ...changes }, user, [product], now);
  assert.equal(map({}).tier, "pro");
  assert.equal(map({ subscriptionState: "SUBSCRIPTION_STATE_CANCELED" }).tier, "pro");
  for (const state of ["PENDING", "PAUSED", "ON_HOLD", "EXPIRED"]) assert.equal(map({ subscriptionState: "SUBSCRIPTION_STATE_" + state }).tier, "free");
  assert.throws(() => map({ externalAccountIdentifiers: { obfuscatedExternalAccountId: "wrong" } }), /mismatch/);
  assert.throws(() => map({ lineItems: [{ ...purchase.lineItems[0], offerDetails: { basePlanId: "annual" } }] }), /mismatch/);
});
test("Store finishing follows successful server validation; pending or forged purchases never acknowledge", async () => {
  const calls = [];
  const plugin = { finishTransaction: async () => calls.push("finish"), acknowledgePurchase: async () => calls.push("acknowledge") };
  const transaction = { transactionId: "100000000001", purchaseToken: "fixture-token" };
  const run = verify => verifyAndFinishPurchase({ transaction, platform: "ios", userId: user, plugin, verify });
  await assert.rejects(() => run(async () => { throw new Error("invalid signature"); }));
  assert.deepEqual(calls, []);
  await assert.rejects(() => run(async () => ({ verified: false })));
  assert.deepEqual(calls, []);
  await run(async () => { calls.push("verify"); return { verified: true, active: true }; });
  assert.deepEqual(calls, ["verify", "finish"]);
  await verifyAndFinishPurchase({ transaction, platform: "android", userId: user, plugin, verify: async () => ({ verified: true, active: false }) });
  assert.equal(calls.includes("acknowledge"), false);
});
test("Restore does not initiate a purchase and requires server verification", async () => {
  let finishes = 0;
  const plugin = { restorePurchases: async () => {}, getPurchases: async () => ({ purchases: [{ transactionId: "100000000001" }] }), finishTransaction: async () => { finishes++; } };
  const args = { platform: "ios", userId: user, plugin };
  await assert.rejects(() => restoreVerifiedPurchases({ ...args, verify: async () => { throw new Error("wrong owner"); } }));
  assert.equal(finishes, 0);
  assert.equal((await restoreVerifiedPurchases({ ...args, verify: async () => ({ verified: true, active: true }) })).active, true);
  assert.equal(finishes, 1);
});
test("Android prices and purchases select the exact base plan, excluding introductory offers", () => {
  const products = [{ identifier: "monthly", planIdentifier: "immigra_pro", offerId: "trial" }, { identifier: "annual", planIdentifier: "immigra_pro", priceString: "$69.99" }, { identifier: "monthly", planIdentifier: "immigra_pro", priceString: "$7.99" }];
  assert.equal(storeProductForPlan(products, { id: "immigra_pro", plan: "monthly" }, "android").priceString, "$7.99");
  assert.equal(storeProductForPlan(products, { id: "immigra_pro", plan: "unknown" }, "android"), undefined);
});
test("Purchase references are authenticated encrypted and tampering cannot decrypt", () => {
  const previous = process.env.NATIVE_PURCHASE_ENCRYPTION_KEY;
  process.env.NATIVE_PURCHASE_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");
  try {
    const encoded = encryptPurchaseReference("secret-purchase-reference");
    assert.equal(encoded.includes("secret-purchase-reference"), false);
    assert.equal(decryptPurchaseReference(encoded), "secret-purchase-reference");
    const parts = encoded.split("."); parts[1] = Buffer.alloc(16).toString("base64");
    assert.throws(() => decryptPurchaseReference(parts.join(".")));
  } finally { if (previous === undefined) delete process.env.NATIVE_PURCHASE_ENCRYPTION_KEY; else process.env.NATIVE_PURCHASE_ENCRYPTION_KEY = previous; }
});
test("Unconfigured stores are disabled and public deletion has its own route", () => {
  const config = getNativeStoreConfiguration();
  assert.equal(config.apple.enabled, false);
  assert.equal(config.google.enabled, false);
  assert.equal(readAppRoute("#deleteAccount").screen, "deleteAccount");
});
