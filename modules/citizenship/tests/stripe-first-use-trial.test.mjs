import test from 'node:test';
import assert from 'node:assert/strict';
import {createCheckoutSession} from '../server/stripeBilling.js';
test('subscribing does not silently add another seven-day Stripe trial',async()=>{
 const names=['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','STRIPE_PRICE_MONTHLY','STRIPE_PRICE_ANNUAL','STRIPE_BILLING_ENABLED','APP_BASE_URL'];const previous=Object.fromEntries(names.map(k=>[k,process.env[k]]));
 Object.assign(process.env,{STRIPE_SECRET_KEY:'sk_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',STRIPE_PRICE_MONTHLY:'price_monthly_fixture',STRIPE_PRICE_ANNUAL:'price_annual_fixture',STRIPE_BILLING_ENABLED:'true',APP_BASE_URL:'https://immigra.site'});
 try{for(const interval of ['monthly','annual']){let payload;const result=await createCheckoutSession({userId:'owner-fixture',email:'learner@example.com',interval},{identityLookup:async()=>null,createSession:async value=>{payload=value;return {url:'https://checkout.stripe.com/fixture'};}});assert.equal(result.url,'https://checkout.stripe.com/fixture');assert.equal('trial_period_days' in payload.subscription_data,false);assert.equal('trial_end' in payload.subscription_data,false);assert.equal(payload.subscription_data.metadata.user_id,'owner-fixture');assert.equal(payload.line_items[0].quantity,1);assert.equal(payload.payment_method_collection,'always');assert.ok(payload.success_url.startsWith('https://immigra.site/'));}}
 finally{for(const key of names){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];}}
});
