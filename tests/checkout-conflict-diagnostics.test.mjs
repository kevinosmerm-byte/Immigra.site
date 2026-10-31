import test from 'node:test';
import assert from 'node:assert/strict';
import express from '../modules/citizenship/node_modules/express/index.js';
import {createGuestCheckoutService} from '../modules/citizenship/server/guestCheckout.js';
import {createBillingRouter} from '../modules/citizenship/server/billingRoutes.js';
import {reservedCheckout} from '../modules/citizenship/server/checkoutReservations.js';
import {billingErrorMessage} from '../modules/citizenship/src/billingMessages.mjs';

test('guest and signed plan conflicts remain blocked but explain how to resume the existing checkout',async t=>{
 const created={guest:0,signed:0};let guestSession,reservation,signedSession;
 const guest=createGuestCheckoutService({
  secret:()=> 'synthetic-checkout-diagnostics-only',configuration:()=>({enabled:true}),
  price:interval=>'price_fixture_'+interval,base:()=> 'https://example.test',
  client:()=>({checkout:{sessions:{
   create:async payload=>{created.guest++;guestSession={id:'cs_test_ConflictDiagnostic123',url:'https://checkout.stripe.com/fixture-guest',status:'open',metadata:payload.metadata};return guestSession;},
   retrieve:async()=>structuredClone(guestSession)
  }}})
 });
 const checkout=({interval})=>reservedCheckout({
  scope:'account:synthetic-owner',payload:{metadata:{interval}},now:()=>1800000000000,
  reserve:async(_hash,payload)=>{reservation??={attempt_id:'fixture-attempt',created_at:new Date(1800000000000).toISOString(),payload,session_id:null};return structuredClone(reservation);},
  save:async(_hash,_attempt,id)=>{reservation.session_id=id;},
  create:async()=>{created.signed++;signedSession={id:'cs_test_ConflictSigned123',url:'https://checkout.stripe.com/fixture-signed',status:'open'};return signedSession;},
  retrieve:async()=>structuredClone(signedSession)
 });
 const app=express();app.use(express.json());app.use('/billing',createBillingRouter({
  guest,checkout,policyReady:async()=>true,
  authenticate:(req,res,next)=>{if(req.get('authorization')!=='Bearer synthetic-owner')return res.sendStatus(401);req.account={userId:'synthetic-owner',email:'owner@example.test'};next();}
 }));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 t.after(()=>{server.closeAllConnections();server.close();});
 const post=(route,interval,headers={})=>fetch('http://127.0.0.1:'+server.address().port+'/billing/'+route,{
  method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({interval})
 });
 for(const route of ['guest-checkout-session','checkout-session']){
  const headers=route==='checkout-session'?{Authorization:'Bearer synthetic-owner'}:{};
  const first=await post(route,'monthly',headers);assert.equal(first.status,201);
  const original=await first.json();
  if(first.headers.get('set-cookie'))headers.Cookie=first.headers.get('set-cookie').split(';')[0];
  const conflict=await post(route,'annual',headers);assert.equal(conflict.status,409);
  const error=await conflict.json();assert.equal(error.code,'checkout_in_progress');
  assert.match(billingErrorMessage(error,'es'),/mismo plan.*retomarlo/);
  assert.match(billingErrorMessage(error,'en'),/same plan.*resume it/);
  assert.doesNotMatch(billingErrorMessage(error,'es'),/Vuelve a intentarlo/);
  assert.equal(conflict.headers.get('set-cookie'),null);
  // An explicit choice to return to the original plan reuses its exact URL.
  const resumed=await post(route,'monthly',headers);assert.equal(resumed.status,201);
  assert.equal((await resumed.json()).url,original.url);
 }
 assert.deepEqual(created,{guest:1,signed:1});
 assert.match(billingErrorMessage({code:'checkout_timeout'},'es'),/tardando demasiado/);
 assert.match(billingErrorMessage({code:'checkout_unavailable'},'es'),/No pudimos abrir/);
});

test('an unresolved different-plan reservation remains blocked without promising automatic expiry',async()=>{
 let creations=0;
 await assert.rejects(reservedCheckout({
  scope:'account:uncertain-fixture',payload:{metadata:{interval:'annual'}},now:()=>1800000000000,
  reserve:async()=>({attempt_id:'pending-fixture',created_at:new Date(1800000000000).toISOString(),payload:{metadata:{interval:'monthly'}},session_id:null}),
  create:async()=>{creations++;throw Error('must not create a second checkout');},
  save:async()=>assert.fail('must not replace reservation'),retrieve:async()=>assert.fail('no session to retrieve')
 }),error=>error.code==='checkout_in_progress');
 assert.equal(creations,0);
 for(const language of ['es','en']){
  const message=billingErrorMessage({code:'checkout_in_progress'},language);
  assert.match(message,/pendiente|pending/);
  assert.match(message,/Si ya abriste|If you already opened/);
  assert.match(message,/soporte|support/);
  assert.doesNotMatch(message,/caduc|expir/);
 }
});
