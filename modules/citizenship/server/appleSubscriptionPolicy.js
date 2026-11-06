export const APPLE_BUNDLE_ID = 'us.citizenshipai.app';
export const APPLE_PRODUCTS = ['us.citizenshipai.app.pro.monthly', 'us.citizenshipai.app.pro.annual'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateAppleTransaction(transaction, userId) {
  if (!uuid.test(userId || '') || transaction.appAccountToken?.toLowerCase() !== userId.toLowerCase()) throw Object.assign(Error('Subscription belongs to another account'), {code:'apple_account_mismatch',status:409});
  if (transaction.bundleId !== APPLE_BUNDLE_ID || !APPLE_PRODUCTS.includes(transaction.productId) || transaction.type !== 'Auto-Renewable Subscription' || !transaction.originalTransactionId || !transaction.transactionId || !Number.isFinite(transaction.expiresDate) || !Number.isFinite(transaction.purchaseDate) || !Number.isFinite(transaction.signedDate)) throw Object.assign(Error('Invalid subscription'), {code:'apple_transaction_invalid',status:400});
}

// Called only after Apple signature verification AND a fresh Server API lookup.
export function appleEntitlement(transaction, status, userId, now = Date.now()) {
  validateAppleTransaction(transaction, userId);
  const revoked = Boolean(transaction.revocationDate) || status === 5;
  const active = !revoked && status === 1 && transaction.expiresDate > now;
  return {
    provider: 'apple', userId, tier: active ? 'pro' : 'free',
    status: revoked ? 'revoked' : active ? 'active' : 'expired',
    providerCustomerId: userId,
    providerEntitlementId: transaction.originalTransactionId,
    providerEventId: `${transaction.environment}:${transaction.transactionId}:${transaction.signedDate}:${status}`,
    eventType: 'apple.subscription.sync',
    periodStart: new Date(transaction.purchaseDate).toISOString(),
    periodEnd: new Date(transaction.expiresDate).toISOString(),
    occurredAt: new Date(transaction.signedDate).toISOString(),
  };
}
