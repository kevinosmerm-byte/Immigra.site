import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { AppStoreServerAPIClient, SignedDataVerifier, Environment } from "@apple/app-store-server-library";
import { GoogleAuth } from "google-auth-library";
import { APP_IDENTITY } from "../shared/appIdentity.js";

const value = name => process.env[name]?.trim() || "";
export function getNativeStoreConfiguration() {
  const appleProducts = { monthly: value("APPLE_PRODUCT_MONTHLY"), annual: value("APPLE_PRODUCT_ANNUAL") };
  const googleProducts = {
    monthly: { id: value("GOOGLE_PRODUCT_MONTHLY"), plan: value("GOOGLE_PLAN_MONTHLY") },
    annual: { id: value("GOOGLE_PRODUCT_ANNUAL"), plan: value("GOOGLE_PLAN_ANNUAL") },
  };
  const appleReady = Object.values(appleProducts).every(Boolean) && ["APPLE_KEY_ID", "APPLE_ISSUER_ID", "APPLE_PRIVATE_KEY_FILE", "APPLE_ROOT_CERT_FILES"].every(name => value(name)) && /^\d+$/.test(value("APPLE_APP_ID")) && Number.isSafeInteger(Number(value("APPLE_APP_ID"))) && Number(value("APPLE_APP_ID")) > 0;
  const googleReady = Object.values(googleProducts).every(product => product.id && product.plan) && Boolean(value("GOOGLE_APPLICATION_CREDENTIALS"));
  const enabled = value("NATIVE_BILLING_ENABLED") === "true" && Buffer.from(value("NATIVE_PURCHASE_ENCRYPTION_KEY"), "base64").length === 32;
  return {
    apple: { enabled: enabled && Boolean(appleReady), products: appleProducts },
    google: { enabled: enabled && Boolean(googleReady), products: googleProducts },
  };
}

export function mapAppleSubscription(transaction, status, renewal, userId, products, now = Date.now()) {
  if (transaction.bundleId !== APP_IDENTITY.bundleId || transaction.appAccountToken?.toLowerCase() !== userId.toLowerCase()
      || !products.includes(transaction.productId) || transaction.type !== "Auto-Renewable Subscription"
      || !transaction.originalTransactionId || !transaction.transactionId) throw new Error("purchase_owner_or_product_mismatch");
  const end = status === 4 ? renewal?.gracePeriodExpiresDate : transaction.expiresDate;
  const revoked = Boolean(transaction.revocationDate) || status === 5;
  const active = !revoked && [1, 4].includes(status) && Number.isFinite(end) && end > now;
  return {
    provider: "apple", userId, tier: active ? "pro" : "free",
    status: revoked ? "revoked" : active ? (status === 4 ? "grace" : "active") : "expired",
    providerEntitlementId: transaction.originalTransactionId,
    periodStart: Number.isFinite(transaction.purchaseDate) ? new Date(transaction.purchaseDate).toISOString() : null,
    periodEnd: Number.isFinite(end) ? new Date(end).toISOString() : null,
    occurredAt: new Date(now).toISOString(), eventType: "store_subscription_verified",
  };
}

export function mapGoogleSubscription(purchase, userId, products, now = Date.now()) {
  if (purchase.externalAccountIdentifiers?.obfuscatedExternalAccountId !== userId) throw new Error("purchase_owner_or_product_mismatch");
  const lines = (purchase.lineItems || []).filter(line => products.some(product => product.id === line.productId && product.plan === line.offerDetails?.basePlanId));
  if (!lines.length) throw new Error("purchase_owner_or_product_mismatch");
  const end = Math.max(...lines.map(line => Date.parse(line.expiryTime)));
  const state = purchase.subscriptionState;
  const active = ["SUBSCRIPTION_STATE_ACTIVE", "SUBSCRIPTION_STATE_IN_GRACE_PERIOD", "SUBSCRIPTION_STATE_CANCELED"].includes(state) && Number.isFinite(end) && end > now;
  return {
    provider: "google_play", userId, tier: active ? "pro" : "free",
    status: active ? (state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ? "grace" : "active") : "expired",
    periodStart: Number.isFinite(Date.parse(purchase.startTime)) ? new Date(purchase.startTime).toISOString() : null,
    periodEnd: Number.isFinite(end) ? new Date(end).toISOString() : null,
    occurredAt: new Date(now).toISOString(), eventType: "store_subscription_verified",
  };
}

export async function verifyNativePurchase({ provider, reference, userId }) {
  const config = getNativeStoreConfiguration();
  let mapped;
  if (provider === "apple" && config.apple.enabled) {
    if (!/^\d{6,30}$/.test(reference)) throw new Error("invalid_purchase_reference");
    const environment = value("APPLE_STORE_ENVIRONMENT") === "Production" ? Environment.PRODUCTION : Environment.SANDBOX;
    const roots = await Promise.all(value("APPLE_ROOT_CERT_FILES").split(",").map(path => readFile(path.trim())));
    const signingKey = await readFile(value("APPLE_PRIVATE_KEY_FILE"), "utf8");
    const client = new AppStoreServerAPIClient(signingKey, value("APPLE_KEY_ID"), value("APPLE_ISSUER_ID"), APP_IDENTITY.bundleId, environment);
    const verifier = new SignedDataVerifier(roots, true, environment, APP_IDENTITY.bundleId, Number(value("APPLE_APP_ID")));
    const response = await client.getAllSubscriptionStatuses(reference);
    const candidates = [];
    for (const group of response.data || []) for (const item of group.lastTransactions || []) {
      const transaction = await verifier.verifyAndDecodeTransaction(item.signedTransactionInfo);
      if (transaction.appAccountToken?.toLowerCase() !== userId.toLowerCase() || !Object.values(config.apple.products).includes(transaction.productId)) continue;
      const renewal = item.signedRenewalInfo ? await verifier.verifyAndDecodeRenewalInfo(item.signedRenewalInfo) : null;
      candidates.push(mapAppleSubscription(transaction, item.status, renewal, userId, Object.values(config.apple.products)));
    }
    mapped = candidates.sort((a, b) => Number(b.tier === "pro") - Number(a.tier === "pro") || Date.parse(b.periodEnd) - Date.parse(a.periodEnd))[0];
    if (!mapped) throw new Error("purchase_owner_or_product_mismatch");
  } else if (provider === "google_play" && config.google.enabled) {
    if (typeof reference !== "string" || reference.length < 20 || reference.length > 4096 || /\s/.test(reference) || [...reference].some(char => char.charCodeAt(0) < 32)) throw new Error("invalid_purchase_reference");
    const client = await new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/androidpublisher"] }).getClient();
    const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${APP_IDENTITY.bundleId}/purchases`;
    const { data } = await client.request({ url: `${base}/subscriptionsv2/tokens/${encodeURIComponent(reference)}`, timeout: 20000 });
    if (data.testPurchase && value("GOOGLE_ALLOW_TEST_PURCHASES") !== "true") throw new Error("test_purchase_not_allowed");
    mapped = mapGoogleSubscription(data, userId, Object.values(config.google.products));
    mapped.providerEntitlementId = createHash("sha256").update(reference).digest("hex");
  } else throw new Error("native_billing_unavailable");
  mapped.providerEventId = createHash("sha256").update(JSON.stringify(mapped)).digest("hex");
  return mapped;
}
