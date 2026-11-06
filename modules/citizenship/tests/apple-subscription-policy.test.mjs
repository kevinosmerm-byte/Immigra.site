import test from 'node:test';
import assert from 'node:assert/strict';
import {appleEntitlement,validateAppleTransaction,APPLE_BUNDLE_ID,APPLE_PRODUCTS} from '../server/appleSubscriptionPolicy.js';
const user='11111111-1111-4111-8111-111111111111';
const now=Date.now();
const transaction={appAccountToken:user,bundleId:APPLE_BUNDLE_ID,productId:APPLE_PRODUCTS[0],type:'Auto-Renewable Subscription',originalTransactionId:'original',transactionId:'transaction',expiresDate:now+10000,purchaseDate:now-10000,signedDate:now,environment:'Sandbox'};
test('Apple active subscription grants only until its signed expiry',()=>{
 assert.equal(appleEntitlement(transaction,1,user,now).tier,'pro');
 assert.equal(appleEntitlement(transaction,1,user,now+20000).tier,'free');
});
test('Expired, revoked, billing retry and unknown status do not grant PRO',()=>{
 for(const status of [2,3,4,5,undefined])assert.equal(appleEntitlement(transaction,status,user,now).tier,'free');
 assert.equal(appleEntitlement({...transaction,revocationDate:now-1},1,user,now).status,'revoked');
});
test('Another account, bundle, product or malformed date cannot claim purchase',()=>{
 for(const patch of [{appAccountToken:'22222222-2222-4222-8222-222222222222'},{bundleId:'other.app'},{productId:'unknown'},{type:'Consumable'},{expiresDate:undefined}])assert.throws(()=>validateAppleTransaction({...transaction,...patch},user));
});
test('Sandbox and production event identities never collide',()=>{
 assert.notEqual(appleEntitlement(transaction,1,user,now).providerEventId,appleEntitlement({...transaction,environment:'Production'},1,user,now).providerEventId);
});
