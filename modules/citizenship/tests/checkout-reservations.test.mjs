import test from 'node:test';
import assert from 'node:assert/strict';
import { reservedCheckout } from '../server/checkoutReservations.js';

function fixture() {
  let row, count=0, writes=0, clock=1800000000000, failSave=false, status='open';
  const creations=new Map();
  const payload={metadata:{interval:'monthly'},line_items:[{price:'price_original',quantity:1}]};
  const deps={scope:'account:owner',payload,now:()=>clock,
    reserve:async(hash,value,expired)=>{
      if(!row || expired && expired===row.session_id) row={attempt_id:`attempt-${++count}`,created_at:new Date(clock).toISOString(),payload:structuredClone(value),session_id:null};
      assert.match(hash,/^[a-f0-9]{64}$/);return structuredClone(row);
    },
    save:async(hash,attempt,id)=>{writes++;if(failSave){failSave=false;throw Error('database unavailable');}assert.equal(row.attempt_id,attempt);row.session_id=id;},
    create:async(value,options)=>{if(!creations.has(options.idempotencyKey))creations.set(options.idempotencyKey,{id:`cs_test_session${creations.size}`,url:'https://checkout.stripe.com/fixture',status:'open',payload:value});return creations.get(options.idempotencyKey);},
    retrieve:async id=>({id,status,url:status==='open'?'https://checkout.stripe.com/fixture':null}),
  };
  return {deps,creations,get row(){return row;},get writes(){return writes;},fail:()=>{failSave=true;},status:s=>{status=s;},advance:ms=>{clock+=ms;}};
}
test('parallel tabs and process restarts reuse a durable attempt and one Stripe idempotency key',async()=>{
 const f=fixture();const sessions=await Promise.all(Array.from({length:12},()=>reservedCheckout(f.deps)));
 assert.equal(f.creations.size,1);assert.ok(sessions.every(s=>s.id===sessions[0].id));
 await reservedCheckout({...f.deps});assert.equal(f.creations.size,1);
});
test('ambiguous database save failure retains the Stripe key and immutable original payload',async()=>{
 const f=fixture();f.fail();await assert.rejects(reservedCheckout(f.deps));
 const result=await reservedCheckout({...f.deps,payload:{...f.deps.payload,line_items:[{price:'price_changed'}]}});
 assert.equal(f.creations.size,1);assert.equal(result.payload.line_items[0].price,'price_original');
});
test('changing plan cannot create another pending subscription',async()=>{
 const f=fixture();await reservedCheckout(f.deps);
 await assert.rejects(reservedCheckout({...f.deps,payload:{metadata:{interval:'annual'}}}),e=>e.code==='checkout_in_progress');
 assert.equal(f.creations.size,1);
});
test('completed or unknown provider states cannot rotate an attempt',async()=>{
 for(const status of ['complete','unknown']){const f=fixture();await reservedCheckout(f.deps);f.status(status);await assert.rejects(reservedCheckout(f.deps));assert.equal(f.creations.size,1);}
});
test('only provider-confirmed expired sessions rotate atomically under parallel retries',async()=>{
 const f=fixture();await reservedCheckout(f.deps);f.status('expired');
 // A provider fixture returns new sessions open once the old session is expired.
 const old=f.row.session_id;f.deps.retrieve=async id=>({id,status:id===old?'expired':'open',url:id===old?null:'https://checkout.stripe.com/new'});
 const results=await Promise.all([reservedCheckout(f.deps),reservedCheckout(f.deps)]);
 assert.equal(f.creations.size,2);assert.equal(results[0].id,results[1].id);
});
test('an unresolved attempt beyond Stripe safe retry horizon fails closed',async()=>{
 const f=fixture();f.fail();await assert.rejects(reservedCheckout(f.deps));f.advance(23*3600*1000);
 await assert.rejects(reservedCheckout(f.deps),e=>e.code==='checkout_unavailable');assert.equal(f.creations.size,1);
});
test('Stripe network failure retries the same attempt rather than releasing it',async()=>{
 const f=fixture();const create=f.deps.create;let first=true;
 f.deps.create=async(...args)=>{const result=await create(...args);if(first){first=false;throw Error('response lost');}return result;};
 await assert.rejects(reservedCheckout(f.deps));await reservedCheckout(f.deps);assert.equal(f.creations.size,1);
});
test('a concurrent different-plan rotation cannot return the wrong checkout URL',async()=>{
 const f=fixture();await reservedCheckout(f.deps);const old=f.row.session_id;
 f.deps.retrieve=async id=>({id,status:id===old?'expired':'open',url:'https://checkout.stripe.com/fixture'});
 const reserve=f.deps.reserve;
 f.deps.reserve=async(hash,payload,expired)=>{
  if(expired){const competing=await reserve(hash,{metadata:{interval:'annual'}},expired);await f.deps.save(hash,competing.attempt_id,'cs_test_competingAnnual');return reserve(hash,payload,expired);}
  return reserve(hash,payload,expired);
 };
 await assert.rejects(reservedCheckout(f.deps),e=>e.code==='checkout_in_progress');
 assert.equal(f.creations.size,1);
});
