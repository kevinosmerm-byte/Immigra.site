import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { verifyNativePurchase } from "./nativeStoreVerification.js";
import { applyVerifiedEntitlementEvent, getBillingIdentity, getNativePurchaseRecords, claimNativePurchase } from "./accountService.js";

const refreshes = new Map();
function encryptionKey() {
  const key = Buffer.from(process.env.NATIVE_PURCHASE_ENCRYPTION_KEY || "", "base64");
  if (key.length !== 32) throw new Error("native_billing_unavailable");
  return key;
}
export function encryptPurchaseReference(reference) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(reference, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString("base64")).join(".");
}
export function decryptPurchaseReference(encrypted) {
  const [iv, tag, ciphertext] = encrypted.split(".").map(part => Buffer.from(part, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
export async function syncNativePurchase({ userId, provider, reference }) {
  const event = await verifyNativePurchase({ userId, provider, reference });
  const identity = await getBillingIdentity(userId);
  if (identity && identity.provider !== provider && ["active", "grace"].includes(identity.status)
      && (!identity.periodEnd || Date.parse(identity.periodEnd) > Date.now())) throw new Error("subscription_already_active");
  await claimNativePurchase({ userId, provider,
    referenceHash: createHash("sha256").update(event.providerEntitlementId).digest("hex"),
    encryptedReference: encryptPurchaseReference(reference) });
  const records = await getNativePurchaseRecords(userId, provider);
  const currentEvents = await Promise.all(records.map(record => verifyNativePurchase({ userId, provider, reference: decryptPurchaseReference(record.encrypted_reference) })));
  const best = currentEvents.sort((a, b) => Number(b.tier === "pro") - Number(a.tier === "pro") || Date.parse(b.periodEnd) - Date.parse(a.periodEnd))[0];
  await applyVerifiedEntitlementEvent(best);
  refreshes.delete(userId);
  await refreshNativeEntitlement(userId);
  const current = await getBillingIdentity(userId);
  return { verified: true, active: current?.tier === "pro" && ["active", "grace"].includes(current.status), status: current?.status };
}
export async function refreshNativeEntitlement(userId, dependencies = { getBillingIdentity, getNativePurchaseRecords, applyVerifiedEntitlementEvent }) {
  const identity = await dependencies.getBillingIdentity(userId);
  if (!["apple", "google_play"].includes(identity?.provider)) return;
  const cached = refreshes.get(userId);
  if (cached?.until > Date.now()) return cached.pending;
  const pending = (async () => {
    const records = await dependencies.getNativePurchaseRecords(userId, identity.provider);
    if (!records.length) throw new Error("native_purchase_unavailable");
    const events = await Promise.all(records.map(record => verifyNativePurchase({ userId, provider: record.provider, reference: decryptPurchaseReference(record.encrypted_reference) })));
    const event = events.sort((a, b) => Number(b.tier === "pro") - Number(a.tier === "pro") || Date.parse(b.periodEnd) - Date.parse(a.periodEnd))[0];
    await dependencies.applyVerifiedEntitlementEvent(event);
  })();
  if (refreshes.size > 1000) for (const [key, entry] of refreshes) if (entry.until <= Date.now()) refreshes.delete(key);
  refreshes.set(userId, { until: Date.now() + 60000, pending });
  try { await pending; } catch (error) { refreshes.delete(userId); throw error; }
}
