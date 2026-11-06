import {readFileSync} from 'node:fs';
import {AppStoreServerAPIClient, Environment, SignedDataVerifier} from '@apple/app-store-server-library';
import {APPLE_BUNDLE_ID, APPLE_PRODUCTS, validateAppleTransaction, appleEntitlement} from './appleSubscriptionPolicy.js';
import {applyVerifiedEntitlementEvent, getBillingIdentity} from './accountService.js';

const roots = [readFileSync(new URL('./certificates/AppleRootCA-G3.cer', import.meta.url))];
export function appleBillingReady() {
  return process.env.APPLE_IAP_ENABLED === 'true' && ['APPLE_IAP_KEY_ID','APPLE_IAP_ISSUER_ID','APPLE_IAP_PRIVATE_KEY'].every(key => Boolean(process.env[key]?.trim()));
}
export function appleBillingConfiguration() { return {enabled:appleBillingReady(), productIds:APPLE_PRODUCTS}; }
function connection(environment) {
  if (!appleBillingReady()) throw Object.assign(Error('Apple billing not configured'),{status:503,code:'apple_billing_unavailable'});
  return {
    verifier:new SignedDataVerifier(roots,true,environment,APPLE_BUNDLE_ID,6814679992),
    client:new AppStoreServerAPIClient(process.env.APPLE_IAP_PRIVATE_KEY.replace(/\\n/g,'\n'),process.env.APPLE_IAP_KEY_ID.trim(),process.env.APPLE_IAP_ISSUER_ID.trim(),APPLE_BUNDLE_ID,environment),
  };
}
async function verifiedTransaction(signedTransaction) {
  if (typeof signedTransaction !== 'string' || signedTransaction.length > 24000) throw Object.assign(Error('Invalid transaction'),{status:400,code:'apple_transaction_invalid'});
  // Never trust an unsigned environment field. Each verifier checks its environment.
  for (const environment of [Environment.PRODUCTION, Environment.SANDBOX]) {
    const adapter=connection(environment);
    try {return {...adapter,environment,transaction:await adapter.verifier.verifyAndDecodeTransaction(signedTransaction)};} catch { /* Try the other Apple-signed environment. */ }
  }
  throw Object.assign(Error('Apple signature verification failed'),{status:400,code:'apple_transaction_invalid'});
}
export async function syncAppleSubscription(userId, signedTransaction) {
  const {client,verifier,environment,transaction}=await verifiedTransaction(signedTransaction);
  validateAppleTransaction(transaction,userId);
  if (environment === Environment.SANDBOX && !(process.env.APPLE_IAP_SANDBOX_ACCOUNT_IDS || '').split(',').map(x=>x.trim().toLowerCase()).includes(userId.toLowerCase())) throw Object.assign(Error('Test purchase requires a review account'),{status:403,code:'apple_test_account_required'});
  const identity=await getBillingIdentity(userId);
  if (identity && identity.provider !== 'apple' && identity.tier === 'pro' && ['active','grace'].includes(identity.status)) throw Object.assign(Error('Another subscription is active'),{status:409,code:'subscription_already_active'});
  const snapshot=await client.getAllSubscriptionStatuses(transaction.originalTransactionId);
  const candidates=[];
  for (const group of snapshot.data || []) for (const item of group.lastTransactions || []) {
    if (!item.signedTransactionInfo) continue;
    const current=await verifier.verifyAndDecodeTransaction(item.signedTransactionInfo);
    if (current.originalTransactionId !== transaction.originalTransactionId) continue;
    validateAppleTransaction(current,userId);
    candidates.push({current,status:item.status});
  }
  if (!candidates.length) throw Object.assign(Error('Subscription unavailable'),{status:503,code:'apple_verification_unavailable'});
  candidates.sort((a,b)=>b.current.signedDate-a.current.signedDate);
  const {current,status}=candidates[0];
  const event=appleEntitlement(current,status,userId);
  await applyVerifiedEntitlementEvent(event);
  return {verified:true,active:event.status==='active',transactionId:transaction.transactionId};
}

export async function handleAppleNotification(signedPayload) {
  if (!appleBillingReady()) throw Object.assign(Error('Apple billing not configured'),{status:503,code:'apple_billing_unavailable'});
  if (typeof signedPayload !== 'string' || signedPayload.length > 60000) throw Object.assign(Error('Invalid notification'),{status:400,code:'apple_notification_invalid'});
  let notification;
  for (const environment of [Environment.PRODUCTION,Environment.SANDBOX]) {
    try { notification=await connection(environment).verifier.verifyAndDecodeNotification(signedPayload); break; } catch { /* Must verify against an Apple root. */ }
  }
  if(!notification)throw Object.assign(Error('Invalid notification signature'),{status:400,code:'apple_notification_invalid'});
  if(!notification.data?.signedTransactionInfo)return {received:true};
  const {transaction}=await verifiedTransaction(notification.data.signedTransactionInfo);
  await syncAppleSubscription(transaction.appAccountToken,notification.data.signedTransactionInfo);
  return {received:true};
}
