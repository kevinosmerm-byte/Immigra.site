import test from 'node:test';
import assert from 'node:assert/strict';
import {createBillingReadiness} from '../server/billingReadiness.js';
function fixture(){
 let time=1000,calls=0;const monthly={active:true,livemode:true,currency:'usd',unit_amount:599,recurring:{interval:'month',interval_count:1}},annual={...monthly,unit_amount:4999,recurring:{interval:'year',interval_count:1}},account={charges_enabled:true};
 const config={enabled:true,currency:'USD',monthlyPriceCents:599,annualPriceCents:4999};
 const check=createBillingReadiness({configuration:()=>config,priceId:interval=>interval,now:()=>time,stripe:()=>({accounts:{retrieve:async()=>{calls++;return account;}},prices:{retrieve:async interval=>interval==='monthly'?monthly:annual}})});
 return {check,monthly,annual,account,config,advance:()=>{time+=300001;},calls:()=>calls};
}
test('billing readiness validates live recurring prices and account charges with cached read-only requests',async()=>{
 const f=fixture();const [a,b]=await Promise.all([f.check(),f.check()]);assert.equal(a.ready,true);assert.deepEqual(a,b);assert.equal(f.calls(),1);await f.check();assert.equal(f.calls(),1);f.advance();await f.check();assert.equal(f.calls(),2);
});
test('test keys, inactive or wrong prices, and disabled charges are not advertised as ready',async()=>{
 for(const [edit,reason] of [[f=>{f.monthly.livemode=false;},'billing_test_mode'],[f=>{f.annual.unit_amount=9999;},'billing_price_unavailable'],[f=>{f.monthly.active=false;},'billing_price_unavailable'],[f=>{f.account.charges_enabled=false;},'billing_account_unavailable']]){const f=fixture();edit(f);assert.equal((await f.check()).reason,reason);}
});
test('provider failures expose only a safe category and optional reference',async()=>{
 const check=createBillingReadiness({configuration:()=>({enabled:true}),stripe:()=>{throw {type:'StripeAuthenticationError',message:'secret value'};}});const result=await check();assert.equal(result.reason,'billing_configuration_invalid');assert.equal(JSON.stringify(result).includes('secret value'),false);const restricted=createBillingReadiness({configuration:()=>({enabled:true}),stripe:()=>{throw {type:'StripePermissionError'};}});assert.equal((await restricted()).reason,'billing_status_unavailable');
});

test('permission diagnostics identify every failed operation without leaking provider messages or keys',async()=>{
 const check=createBillingReadiness({configuration:()=>({enabled:true}),priceId:interval=>interval,stripe:()=>({
  accounts:{retrieve:async()=>{throw {type:'StripePermissionError',requestId:'req_safeAccount',message:'private account details'};}},
  prices:{retrieve:async interval=>{if(interval==='annual')throw {type:'StripePermissionError',message:'private price value'};return {};}},
 })});
 const result=await check();assert.equal(result.reason,'billing_status_unavailable');assert.deepEqual(result.blockedSteps,['account','annual_price']);assert.equal(result.reference,'req_safeAccount');assert.doesNotMatch(JSON.stringify(result),/private account|private price/);assert.deepEqual(result.failures,[{step:'account',code:'permission_denied',reference:'req_safeAccount'},{step:'annual_price',code:'permission_denied'}]);assert.equal(result.checkoutCreation,'not_checked');
});
