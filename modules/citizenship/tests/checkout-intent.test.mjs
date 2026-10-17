import test from 'node:test';
import assert from 'node:assert/strict';
import {saveCheckoutIntent,readCheckoutIntent,clearCheckoutIntent,checkoutReturnUrl} from '../src/checkoutIntent.mjs';
import {billingFailure} from '../server/billingErrors.js';
import {billingErrorMessage} from '../src/billingMessages.mjs';
function browser(href='https://immigra.site/#/account',shared=new Map()){
 const session=new Map(),url=new URL(href),storage=map=>({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)});
 const env={location:url,localStorage:storage(shared),sessionStorage:storage(session),history:{state:null,replaceState(_a,_b,path){env.location=new URL(path,env.location);}},shared};return env;
}
test('a selected plan survives an email link opening in another tab',()=>{
 const first=browser();saveCheckoutIntent('annual','Learner@Example.com',first,1000);
 const second=browser('https://immigra.site/#/account',first.shared);assert.equal(readCheckoutIntent('learner@example.com',second,1100),'annual');
 assert.equal(readCheckoutIntent('someone@example.com',second,1100),null);
});
test('a verification return URL carries only a valid plan and works without browser storage',()=>{
 const first=browser();saveCheckoutIntent('monthly','learner@example.com',first);const url=checkoutReturnUrl('learner@example.com',first);
 assert.equal(url,'https://immigra.site/?checkout=monthly');assert.equal(url.includes('learner'),false);
 const device=browser(url+'#/account');assert.equal(readCheckoutIntent('learner@example.com',device),'monthly');
 const invalid=browser('https://immigra.site/?checkout=https://example.com/#/account');assert.equal(readCheckoutIntent('',invalid),null);
});
test('an expired or future-dated intent cannot fall back to an unbound legacy plan',()=>{
 const first=browser();saveCheckoutIntent('annual','learner@example.com',first,1000);assert.equal(readCheckoutIntent('learner@example.com',first,1000+1800001),null);assert.equal(readCheckoutIntent('learner@example.com',first,999),null);
});
test('billing diagnostics are safe, actionable and bilingual',()=>{
 const price=billingFailure({code:'resource_missing',param:'line_items[0][price]',requestId:'req_fixture123',message:'private provider payload'});
 assert.equal(price.code,'billing_price_unavailable');assert.equal(price.reference,'req_fixture123');assert.equal(JSON.stringify(price).includes('private'),false);
 assert.equal(billingFailure({type:'StripeAuthenticationError'}).code,'billing_configuration_invalid');assert.equal(billingFailure({type:'StripeRateLimitError'}).status,429);
 assert.match(billingErrorMessage(price,'es'),/plan elegido/);assert.match(billingErrorMessage(price,'en'),/selected plan/);
 assert.equal(billingFailure({requestId:'not a safe reference'}).reference,undefined);
});
test('consuming a plan clears browser state and keeps unrelated return parameters',()=>{
 const first=browser('https://immigra.site/?checkout=monthly&billing=cancelled#/account');saveCheckoutIntent('monthly','',first);clearCheckoutIntent(first);assert.equal(first.localStorage.getItem('immigra.checkout-intent.v2'),null);assert.equal(first.sessionStorage.getItem('immigra.pending-billing.v1'),null);assert.equal(first.location.search,'?billing=cancelled');assert.equal(first.location.hash,'#/account');
});

test('an explicit new plan replaces an older plan in the verification return URL',()=>{const env=browser('https://immigra.site/?checkout=monthly#/account');saveCheckoutIntent('annual','learner@example.com',env);assert.equal(readCheckoutIntent('learner@example.com',env),'annual');});

test('post-payment verification preserves the checkout ID instead of starting another subscription',()=>{
 const env=browser('https://immigra.site/?guest_checkout=return&session_id=cs_test_GuestCheckout123#/account');saveCheckoutIntent('annual','',env);
 const url=new URL(checkoutReturnUrl('buyer@example.test',env));assert.equal(url.searchParams.get('guest_checkout'),'return');assert.equal(url.searchParams.get('session_id'),'cs_test_GuestCheckout123');assert.equal(url.searchParams.has('checkout'),false);assert.equal(url.href.includes('buyer'),false);
});

test('a pending guest checkout stores only a public reference and can be resumed or cleared',async()=>{
 const {rememberGuestCheckout,pendingGuestCheckout,resumeGuestCheckout}=await import('../src/checkoutIntent.mjs');
 const env=browser();let assigned;env.location.assign=url=>{assigned=url;};rememberGuestCheckout('cs_test_GuestCheckout123',env);assert.equal(pendingGuestCheckout(env),'cs_test_GuestCheckout123');resumeGuestCheckout(env);assert.equal(new URL(assigned).searchParams.get('session_id'),'cs_test_GuestCheckout123');assert.equal(new URL(assigned).hash,'#/account');rememberGuestCheckout(null,env);assert.equal(pendingGuestCheckout(env),null);
});
