import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import express from '../modules/citizenship/node_modules/express/index.js';
import {createBillingRouter} from '../modules/citizenship/server/billingRoutes.js';
import {createGuestCheckoutService} from '../modules/citizenship/server/guestCheckout.js';

// Entirely synthetic Stripe: provider-side idempotency survives lost responses.
function fixture(){
 let clock=1_800_000_000_000;
 const sessions=new Map(),keys=new Map(),calls={create:[],expire:[],retrieve:[]};
 const hooks={};
 const response=()=>({headers:{},setHeader(name,value){this.headers[name]=value;}});
 const api={
  async create(payload,options){
   calls.create.push({payload:structuredClone(payload),options:structuredClone(options)});
   const key=options.idempotencyKey,body=JSON.stringify(payload),prior=keys.get(key);
   if(prior){if(prior.body!==body)throw Object.assign(Error('key used with different parameters'),{type:'StripeIdempotencyError'});return structuredClone(sessions.get(prior.id));}
   const id='cs_test_SyntheticSwitch'+String(sessions.size+1).padStart(8,'0');
   const session={id,url:'https://checkout.stripe.com/c/pay/'+id,status:'open',mode:'subscription',payment_status:'unpaid',subscription:null,created:Math.floor(clock/1000),metadata:structuredClone(payload.metadata)};
   sessions.set(id,session);keys.set(key,{body,id});
   await hooks.afterCreate?.(session);
   return structuredClone(session);
  },
  async retrieve(id){calls.retrieve.push(id);await hooks.beforeRetrieve?.(sessions.get(id));return structuredClone(sessions.get(id));},
  async expire(id){calls.expire.push(id);const session=sessions.get(id);await hooks.beforeExpire?.(session);if(session.status==='open')session.status='expired';else if(session.status!=='expired')throw Error('not open');await hooks.afterExpire?.(session);return structuredClone(session);}
 };
 const makeService=()=>createGuestCheckoutService({client:()=>({checkout:{sessions:api}}),configuration:()=>({enabled:true}),price:interval=>'price_synthetic_'+interval,base:()=> 'https://example.test',secret:()=> 'synthetic-switch-proof-only',now:()=>clock});
 const service=makeService();
 const req={headers:{}};
 async function setup(){const res=response();const old=await service.start(req,res,'monthly');req.headers.cookie=res.headers['Set-Cookie'].split(';')[0];return old;}
 const input=id=>({confirmed:true,checkoutId:id,fromInterval:'monthly',interval:'annual'});
 return {service,makeService,req,response,setup,input,sessions,keys,calls,hooks,advance:ms=>{clock+=ms;}};
}

test('conflict offers an explicit switch without expiring or creating anything',async()=>{
 const f=fixture(),old=await f.setup();
 await assert.rejects(f.service.start(f.req,f.response(),'annual'),error=>{
  assert.equal(error.code,'checkout_in_progress');assert.deepEqual(error.switchOffer,{checkoutId:old.checkoutId,fromInterval:'monthly',toInterval:'annual'});return true;
 });
 assert.equal(f.sessions.size,1);assert.equal(f.calls.expire.length,0);
});

test('confirmed opposite-plan switch expires/refetches old before returning one successor',async()=>{
 const f=fixture(),old=await f.setup(),res=f.response();
 const next=await f.service.switchPlan(f.req,res,f.input(old.checkoutId));
 assert.notEqual(next.checkoutId,old.checkoutId);assert.equal(f.sessions.get(old.checkoutId).status,'expired');
 assert.equal(f.sessions.get(next.checkoutId).metadata.interval,'annual');assert.equal(f.sessions.size,2);
 assert.ok(f.calls.retrieve.filter(id=>id===old.checkoutId).length>=2);assert.ok(res.headers['Set-Cookie']);
});

test('double click and two service instances with the same proof create at most one successor',async()=>{
 const f=fixture(),old=await f.setup();
 const result=await Promise.allSettled([f.service.switchPlan(f.req,f.response(),f.input(old.checkoutId)),f.makeService().switchPlan(f.req,f.response(),f.input(old.checkoutId))]);
 assert.ok(result.some(r=>r.status==='fulfilled'));assert.equal(f.sessions.size,2);
 const urls=result.filter(r=>r.status==='fulfilled').map(r=>r.value.url);assert.equal(new Set(urls).size,1);
});

test('explicit switch colliding with ordinary expired-proof start cannot create two targets',async()=>{
 const f=fixture(),old=await f.setup();f.sessions.get(old.checkoutId).status='expired';
 await Promise.allSettled([f.service.switchPlan(f.req,f.response(),f.input(old.checkoutId)),f.service.start(f.req,f.response(),'monthly')]);
 assert.ok(f.sessions.size<=2);assert.equal(new Set(f.calls.create.slice(1).map(c=>c.options.idempotencyKey)).size,1);
});

test('lost create response preserves old proof and safely reuses the successor on retry',async()=>{
 const f=fixture(),old=await f.setup();let lost=false;
 f.hooks.afterCreate=async()=>{if(!lost){lost=true;throw Error('synthetic response lost');}};
 const failed=f.response();await assert.rejects(f.service.switchPlan(f.req,failed,f.input(old.checkoutId)));assert.equal(failed.headers['Set-Cookie'],undefined);
 const retried=await f.service.switchPlan(f.req,f.response(),f.input(old.checkoutId));
 assert.equal(f.sessions.size,2);assert.equal(f.sessions.get(retried.checkoutId).metadata.interval,'annual');
});

test('expire response loss fails closed and retry reconciles before creating',async()=>{
 const f=fixture(),old=await f.setup();let lost=false;
 f.hooks.afterExpire=async()=>{if(!lost){lost=true;throw Error('synthetic expire response lost');}};
 const res=f.response();await assert.rejects(f.service.switchPlan(f.req,res,f.input(old.checkoutId)));assert.equal(f.sessions.size,1);assert.equal(res.headers['Set-Cookie'],undefined);
 await f.service.switchPlan(f.req,f.response(),f.input(old.checkoutId));assert.equal(f.sessions.size,2);
});

test('payment completing during expiration never creates successor or rotates proof',async()=>{
 const f=fixture(),old=await f.setup();f.hooks.beforeExpire=async session=>{session.status='complete';session.payment_status='paid';session.subscription='sub_synthetic_paid';};
 const res=f.response();await assert.rejects(f.service.switchPlan(f.req,res,f.input(old.checkoutId)));assert.equal(f.sessions.size,1);assert.equal(res.headers['Set-Cookie'],undefined);
});

test('forged proof, wrong old session, missing confirmation and invalid target fail without expiration',async()=>{
 for(const kind of ['proof','id','confirmation','same','from']){
  const f=fixture(),old=await f.setup(),input=f.input(old.checkoutId);
  if(kind==='proof')f.req.headers.cookie+='forged';
  if(kind==='id')input.checkoutId='cs_test_NotOwned00001';
  if(kind==='confirmation')input.confirmed=false;
  if(kind==='same')input.interval='monthly';
  if(kind==='from')input.fromInterval='annual';
  const res=f.response();await assert.rejects(f.service.switchPlan(f.req,res,input),kind);
  assert.equal(f.sessions.size,1,kind);assert.equal(f.calls.expire.length,0,kind);assert.equal(res.headers['Set-Cookie'],undefined,kind);
 }
});

test('provider metadata mismatches and paid/no-payment-required sessions cannot be switched',async()=>{
 for(const field of ['nonce','flow','product','paid','free','subscription','mode']){
  const f=fixture(),old=await f.setup(),session=f.sessions.get(old.checkoutId);
  if(field==='nonce')session.metadata.checkout_nonce='wrong';if(field==='flow')session.metadata.flow='wrong';if(field==='product')session.metadata.product_key='wrong';
  if(field==='paid')session.payment_status='paid';if(field==='free')session.payment_status='no_payment_required';if(field==='subscription')session.subscription='sub_existing';if(field==='mode')session.mode='payment';
  await assert.rejects(f.service.switchPlan(f.req,f.response(),f.input(old.checkoutId)),field);assert.equal(f.sessions.size,1,field);assert.equal(f.calls.expire.length,0,field);
 }
});

test('23-hour provider creation cutoff blocks rollover even with an unexpired proof',async()=>{
 const f=fixture(),old=await f.setup();f.advance(23*60*60*1000);
 await assert.rejects(f.service.switchPlan(f.req,f.response(),f.input(old.checkoutId)));assert.equal(f.sessions.size,1);assert.equal(f.calls.expire.length,0);
});

test('untrusted successor URL or mismatched successor metadata never rotates proof',async()=>{
 for(const kind of ['url','nonce','interval']){
  const f=fixture(),old=await f.setup();f.hooks.afterCreate=async successor=>{if(kind==='url')successor.url='https://checkout.stripe.com.evil.test/phish';if(kind==='nonce')successor.metadata.checkout_nonce='wrong';if(kind==='interval')successor.metadata.interval='monthly';};
  const res=f.response();await assert.rejects(f.service.switchPlan(f.req,res,f.input(old.checkoutId)));assert.equal(res.headers['Set-Cookie'],undefined);
 }
});

test('expiration acknowledgement without confirmed expired state cannot create successor',async()=>{
 const f=fixture(),old=await f.setup();f.hooks.afterExpire=async session=>{session.status='open';};
 const res=f.response();await assert.rejects(f.service.switchPlan(f.req,res,f.input(old.checkoutId)));assert.equal(f.sessions.size,1);assert.equal(res.headers['Set-Cookie'],undefined);
});

test('ordinary expired-proof start shares safety cutoff rather than minting a new successor key',async()=>{
 const f=fixture(),old=await f.setup();f.sessions.get(old.checkoutId).status='expired';f.advance(23*60*60*1000);
 await assert.rejects(f.service.start(f.req,f.response(),'annual'));assert.equal(f.sessions.size,1);
});

test('fresh retrieval of successor must still be open and unpaid before proof rotation',async()=>{
 const f=fixture(),old=await f.setup();
 f.hooks.beforeRetrieve=async session=>{if(session.id!==old.checkoutId){session.status='complete';session.payment_status='paid';session.subscription='sub_synthetic_race';}};
 const res=f.response();await assert.rejects(f.service.switchPlan(f.req,res,f.input(old.checkoutId)));assert.equal(res.headers['Set-Cookie'],undefined);
});

test('successor expiry is predecessor-bound and stable across lost-response retries',async()=>{
 const f=fixture(),old=await f.setup();let lost=false;
 f.hooks.afterCreate=async()=>{if(!lost){lost=true;throw Error('synthetic lost response');}};
 await assert.rejects(f.service.switchPlan(f.req,f.response(),f.input(old.checkoutId)));
 f.advance(1000);await f.service.switchPlan(f.req,f.response(),f.input(old.checkoutId));
 const attempts=f.calls.create.slice(1);assert.equal(attempts.length,2);
 assert.deepEqual(attempts[0],attempts[1]);assert.equal(attempts[0].payload.expires_at,f.sessions.get(old.checkoutId).created+86400);
});

test('concurrent expiration can reject already-expired request without duplicate successor',async()=>{
 const f=fixture(),old=await f.setup();
 f.hooks.beforeExpire=async session=>{if(session.status==='expired')throw Error('already expired');session.status='expired';};
 const results=await Promise.allSettled([f.service.switchPlan(f.req,f.response(),f.input(old.checkoutId)),f.makeService().switchPlan(f.req,f.response(),f.input(old.checkoutId))]);
 assert.ok(results.some(r=>r.status==='fulfilled'));assert.equal(f.sessions.size,2);
});

test('crossing safety cutoff during expire/refetch blocks successor creation',async()=>{
 const f=fixture(),old=await f.setup();f.advance(23*60*60*1000-1000);f.hooks.afterExpire=async()=>f.advance(2000);
 const res=f.response();await assert.rejects(f.service.switchPlan(f.req,res,f.input(old.checkoutId)));assert.equal(f.sessions.size,1);assert.equal(res.headers['Set-Cookie'],undefined);
});

test('future provider creation timestamp cannot be used for a switch',async()=>{
 const f=fixture(),old=await f.setup();f.sessions.get(old.checkoutId).created+=60;
 await assert.rejects(f.service.switchPlan(f.req,f.response(),f.input(old.checkoutId)));assert.equal(f.calls.expire.length,0);assert.equal(f.sessions.size,1);
});

test('successor fresh retrieval with a different ID fails without rotating proof',async()=>{
 const f=fixture(),old=await f.setup();f.hooks.beforeRetrieve=async session=>{if(session.id!==old.checkoutId)session.id='cs_test_WrongSuccessor123';};
 const res=f.response();await assert.rejects(f.service.switchPlan(f.req,res,f.input(old.checkoutId)));assert.equal(res.headers['Set-Cookie'],undefined);
});

test('HTTP switch requires explicit confirmation and guest proof; native/auth requests cannot expire anything',async t=>{
 const f=fixture(),old=await f.setup(),app=express();let ready=true;
 app.use(express.json());app.use('/billing',createBillingRouter({guest:f.service,policyReady:async()=>ready}));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 t.after(()=>{server.closeAllConnections();server.close();});
 const post=(body,headers={})=>fetch('http://127.0.0.1:'+server.address().port+'/billing/guest-switch-checkout',{method:'POST',headers:{'Content-Type':'application/json',Cookie:f.req.headers.cookie,...headers},body:JSON.stringify(body)});
 for(const headers of [{'x-immigra-client':'native'},{Origin:'capacitor://localhost'},{Origin:'https://localhost'},{Origin:'http://localhost'},{Authorization:'Bearer synthetic-owner'}]){
  const result=await post(f.input(old.checkoutId),headers);assert.equal(result.status,403);assert.equal(result.headers.get('set-cookie'),null);
 }
 const unconfirmed=await post({...f.input(old.checkoutId),confirmed:false});assert.equal(unconfirmed.status,400);
 const noProof=await post(f.input(old.checkoutId),{Cookie:''});assert.equal(noProof.status,403);
 ready=false;const notReady=await post(f.input(old.checkoutId));assert.equal(notReady.status,503);ready=true;
 assert.equal(f.calls.expire.length,0);assert.equal(f.sessions.size,1);
 const success=await post(f.input(old.checkoutId));assert.equal(success.status,201);assert.equal(success.headers.get('cache-control'),'no-store');
 assert.ok(success.headers.get('set-cookie'));assert.notEqual((await success.json()).checkoutId,old.checkoutId);assert.equal(f.sessions.size,2);
});

test('UI switch is called only by explicit confirmation, with source and target disclosed',()=>{
 const source=readFileSync(new URL('../modules/citizenship/src/EmailTrialAccount.jsx',import.meta.url),'utf8');
 assert.equal((source.match(/await switchGuestCheckout\(switchOffer\)/g)||[]).length,1);
 const handler=source.slice(source.indexOf('async function confirmGuestSwitch'),source.indexOf('const switchLabel'));
 assert.match(handler,/if\(inFlight.current\|\|session\|\|!switchOffer\|\|!switchGuestCheckout\)return/);
 assert.match(handler,/await switchGuestCheckout\(switchOffer\)/);
 assert.equal((source.match(/onClick=\{confirmGuestSwitch\}/g)||[]).length,1);
 assert.match(source,/switchLabel\(switchOffer.fromInterval\)/);assert.match(source,/switchLabel\(switchOffer.toInterval\)/);assert.match(source,/switchPrice/);
 assert.match(source,/Confirmar cambio a/);assert.match(source,/No cambiar/);
 const ordinary=source.slice(source.indexOf('async function subscribe'),source.indexOf('async function confirmGuestSwitch'));
 assert.doesNotMatch(ordinary,/switchGuestCheckout\(/);
});
