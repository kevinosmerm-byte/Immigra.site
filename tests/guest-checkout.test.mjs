import test from 'node:test';
import assert from 'node:assert/strict';
import express from '../modules/citizenship/node_modules/express/index.js';
import {createGuestCheckoutService} from '../modules/citizenship/server/guestCheckout.js';
import {createBillingRouter} from '../modules/citizenship/server/billingRoutes.js';

const checkoutId='cs_test_GuestCheckout123', userId='10000000-0000-4000-8000-000000000001', paidEmail='buyer@example.test';
function fixture(){
 const calls={create:[],register:[],bind:[],events:[]};let time=1_800_000_000_000,existing=null,registrationError=null;
 let session={id:checkoutId,url:'https://checkout.stripe.com/test',status:'complete',mode:'subscription',payment_status:'paid',subscription:'sub_fixture',customer:'cus_fixture',customer_details:{email:paidEmail}};
 let subscription={id:'sub_fixture',customer:'cus_fixture',status:'active',created:1_799_999_000,current_period_start:1_799_999_000,current_period_end:1_802_591_000};
 const service=createGuestCheckoutService({secret:()=> 'test-only-purpose-separated-secret',now:()=>time,configuration:()=>({enabled:true}),price:interval=>'price_'+interval,base:()=> 'https://immigra.site',
  client:()=>({checkout:{sessions:{create:async payload=>{calls.create.push(payload);session.metadata={...payload.metadata};subscription.metadata={...payload.subscription_data.metadata};return session;},retrieve:async()=>structuredClone(session),update:async(id,payload,options)=>{calls.bind.push({id,payload,options});session.metadata={...session.metadata,...payload.metadata};return structuredClone(session);}}},subscriptions:{retrieve:async()=>structuredClone(subscription),update:async(id,payload,options)=>{calls.bind.push({id,payload,options});subscription.metadata={...subscription.metadata,...payload.metadata};return structuredClone(subscription);}}}),
  register:async(req,res,email)=>{calls.register.push(email);if(registrationError)throw registrationError;res.setHeader('Set-Cookie','trial-persistent-cookie');return {access_token:'trial-fixture',isEmailTrial:true,user:{id:userId,email}};},
  identity:async()=>existing,apply:async event=>{calls.events.push(event);return {applied:true};},
 });
 const headers={},res={setHeader:(key,value)=>{headers[key]=value;}};
 return {service,calls,res,headers,session,subscription,req:()=>({headers:{cookie:headers['Set-Cookie']?.split(';')[0]||''}}),expire:()=>{time+=86401*1000;},existing:value=>{existing=value;},duplicate:()=>{registrationError={code:'verification_required'};}};
}
async function started(){const f=fixture();await f.service.start({headers:{}},f.res,'monthly');const req=f.req();return {...f,request:req};}
const rejects=(promise,code)=>assert.rejects(promise,error=>error.code===code);

test('guest checkout collects email in Stripe, uses only server price and sets a short secure HttpOnly proof',async()=>{
 const f=await started(),payload=f.calls.create[0];assert.equal(payload.customer_email,undefined);assert.equal(payload.customer,undefined);assert.equal(payload.client_reference_id,undefined);assert.equal(payload.metadata.user_id,undefined);
 assert.deepEqual(payload.line_items,[{price:'price_monthly',quantity:1}]);assert.equal(payload.subscription_data.trial_period_days,undefined);assert.match(payload.success_url,/guest_checkout=return&session_id=\{CHECKOUT_SESSION_ID\}/);
 assert.match(f.headers['Set-Cookie'],/^__Host-immigra_checkout=/);for(const attribute of ['HttpOnly','Secure','SameSite=Lax','Path=/','Max-Age=86400'])assert.ok(f.headers['Set-Cookie'].includes(attribute));assert.equal(f.calls.register.length,0);
});
test('incomplete and unpaid Stripe sessions never create an account or grant access',async()=>{
 for(const state of [{status:'open'},{payment_status:'unpaid'}]){const f=await started();Object.assign(f.session,state);assert.deepEqual(await f.service.complete(f.request,f.res,checkoutId),{pending:true});assert.equal(f.calls.register.length,0);assert.equal(f.calls.events.length,0);}
});
test('verified payment creates access, binds future webhooks and uses one stable ordered entitlement event',async()=>{
 const f=await started(),result=await f.service.complete(f.request,f.res,checkoutId);
 assert.equal(result.claimed,true);assert.equal(result.session.user.email,paidEmail);assert.equal(f.headers['Set-Cookie'],'trial-persistent-cookie');assert.equal(f.calls.register.length,1);assert.equal(f.calls.bind.length,2);
 const event=f.calls.events[0];assert.equal(event.userId,userId);assert.equal(event.tier,'pro');assert.equal(event.providerEntitlementId,'sub_fixture');assert.equal(event.occurredAt,new Date(f.subscription.created*1000-1).toISOString());
 assert.equal(f.subscription.metadata.user_id,userId);assert.equal(f.session.metadata.user_id,userId);
 const retry={...f.request,account:{userId,email:paidEmail,emailTrial:true}};await f.service.complete(retry,f.res,checkoutId);
 assert.equal(f.calls.bind.length,2);assert.equal(f.calls.register.length,1);assert.equal(f.calls.events[1].providerEventId,event.providerEventId);
});
test('forged, expired, missing or different-checkout proofs cannot claim a subscription',async()=>{
 for(const kind of ['forged','expired','missing','different']){const f=await started();if(kind==='forged')f.request.headers.cookie+='x';if(kind==='expired')f.expire();if(kind==='missing')f.request.headers.cookie='';await rejects(f.service.complete(f.request,f.res,kind==='different'?'cs_test_AnotherCheckout123':checkoutId),'checkout_verification_required');assert.equal(f.calls.register.length,0);assert.equal(f.calls.events.length,0);}
});
test('email-only account tokens alone are never purchase proof',async()=>{
 const f=await started();await rejects(f.service.complete({headers:{},account:{userId,email:paidEmail,emailTrial:true}},f.res,checkoutId),'checkout_verification_required');
});
test('existing email is verified only after payment, without accessing its private account',async()=>{
 const f=await started();f.duplicate();await assert.rejects(f.service.complete(f.request,f.res,checkoutId),error=>error.code==='verification_required'&&error.email===paidEmail);assert.equal(f.calls.bind.length,0);assert.equal(f.calls.events.length,0);
});
test('a verified matching owner can recover a paid return on another device without the checkout cookie',async()=>{
 const f=await started();f.duplicate();const result=await f.service.complete({headers:{},account:{userId,email:paidEmail,emailTrial:false}},f.res,checkoutId);assert.deepEqual(result,{claimed:true});assert.equal(f.calls.register.length,0);assert.equal(f.calls.events[0].userId,userId);
});
test('another signed-in email cannot claim the purchase or learn its email without the device proof',async()=>{
 const f=await started();for(const headers of [{},{cookie:f.request.headers.cookie}])await assert.rejects(f.service.complete({headers,account:{userId,email:'other@example.test',emailTrial:false}},f.res,checkoutId),error=>error.code==='checkout_email_mismatch'&&(headers.cookie?error.email===paidEmail:error.email===undefined));assert.equal(f.calls.events.length,0);
});
test('session, product, nonce, customer and owner mismatches never grant access',async()=>{
 for(const mutate of [f=>{f.session.metadata.flow='foreign';},f=>{f.session.metadata.product_key='foreign';},f=>{f.session.metadata.checkout_nonce='foreign';},f=>{f.subscription.customer='cus_foreign';},f=>{f.subscription.metadata.user_id='other-owner';},f=>{f.session.metadata.user_id='other-owner';}]){
  const f=await started();mutate(f);await assert.rejects(f.service.complete({...f.request,account:{userId,email:paidEmail,emailTrial:true}},f.res,checkoutId));assert.equal(f.calls.events.length,0);
 }
});
test('canceled subscriptions and another active subscription cannot be overwritten',async()=>{
 const f=await started();f.subscription.status='canceled';await rejects(f.service.complete(f.request,f.res,checkoutId),'checkout_subscription_inactive');assert.equal(f.calls.register.length,0);
 f.subscription.status='active';f.existing({tier:'pro',status:'active',providerEntitlementId:'sub_other'});await rejects(f.service.complete({...f.request,account:{userId,email:paidEmail,emailTrial:true}},f.res,checkoutId),'subscription_already_active');assert.equal(f.calls.events.length,0);
});
test('guest billing routes accept only plans, retain private authentication and block native checkout',async t=>{
 const calls=[],app=express();let policy=true;
 app.use(express.json());app.use('/billing',createBillingRouter({policyReady:async()=>policy,authenticate:(req,res,next)=>{if(req.get('authorization')!=='Bearer owner')return res.sendStatus(401);req.account={userId,email:paidEmail};next();},guest:{start:async(req,res,interval)=>{calls.push(interval);return {url:'https://checkout.stripe.com/test'};},complete:async(req,res,id)=>({pending:!req.account,claimed:Boolean(req.account),checkoutId:id})}}));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));t.after(()=>{server.closeAllConnections();server.close();});
 const post=(path,body={},headers={})=>fetch(`http://127.0.0.1:${server.address().port}/billing/${path}`,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 assert.equal((await post('guest-checkout-session',{interval:'annual',email:'ignored',price:'ignored',userId:'ignored'})).status,201);assert.deepEqual(calls,['annual']);
 assert.equal((await post('guest-checkout-session',{interval:'forever'})).status,400);assert.equal((await post('guest-checkout-session',{interval:'monthly'},{Origin:'capacitor://localhost'})).status,403);
 assert.equal((await post('checkout-return',{checkoutId})).status,202);assert.equal((await post('checkout-return',{checkoutId},{Authorization:'Bearer owner'})).status,200);assert.equal((await post('checkout-return',{checkoutId},{Authorization:'Bearer wrong'})).status,401);
 assert.equal((await post('portal-session')).status,401);policy=false;assert.equal((await post('guest-checkout-session',{interval:'monthly'})).status,503);assert.deepEqual(calls,['annual']);
});
