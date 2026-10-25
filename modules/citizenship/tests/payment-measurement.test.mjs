import test from 'node:test';
import assert from 'node:assert/strict';
import {createPaymentMeasurement} from '../server/paymentMeasurement.js';
import {PRO_PLAN} from '../shared/featureAccessConfig.js';
const paid={id:'cs_live_synthetic123456',livemode:true,mode:'subscription',status:'complete',payment_status:'paid',amount_total:2499,currency:'usd',metadata:{product_key:PRO_PLAN.productKey,user_id:'owner'},client_reference_id:'owner'};
test('only positive, paid live subscription checkouts issue a short-lived opaque receipt',()=>{
 let time=1000,header;const service=createPaymentMeasurement({secret:()=> 'test-secret',now:()=>time}),res={append:(_,v)=>header=v};
 for(const patch of [{livemode:false},{payment_status:'no_payment_required'},{payment_status:'unpaid'},{amount_total:0},{amount_total:-1},{amount_total:NaN},{currency:'eur'},{mode:'payment'},{status:'open'},{metadata:{}},{id:'cs_test_synthetic123456'}])assert.equal(service.issue(res,{...paid,...patch}),false);
 assert.equal(header,undefined);assert.equal(service.issue(res,paid),true);
 assert.match(header,/HttpOnly; Secure; SameSite=Strict/);
 const req={headers:{cookie:header.split(';')[0]}},receipt=service.read(req);
 assert.deepEqual(Object.keys(receipt).sort(),['currency','transaction_id','value']);assert.equal(receipt.value,24.99);assert.equal(receipt.currency,'USD');assert.match(receipt.transaction_id,/^[a-f0-9]{64}$/);assert.ok(!JSON.stringify(receipt).includes(paid.id));
 const first=receipt.transaction_id;service.issue(res,paid);assert.equal(service.read({headers:{cookie:header.split(';')[0]}}).transaction_id,first);
 assert.equal(service.read({headers:{cookie:req.headers.cookie+'x'}}),null);time+=600001;assert.equal(service.read(req),null);
});
test('authenticated confirmation rejects foreign owners and fabricated IDs before issuing receipt',async()=>{
 let lookups=0,issues=0;const service=createPaymentMeasurement({secret:()=> 'test-secret',client:()=>({checkout:{sessions:{retrieve:async()=>{lookups++;return paid;}}}})}),res={append:()=>issues++};
 assert.equal(await service.confirm({body:{checkoutId:'bad'},account:{userId:'owner'}},res),false);assert.equal(lookups,0);
 assert.equal(await service.confirm({body:{checkoutId:paid.id},account:{userId:'other'}},res),false);assert.equal(issues,0);
 assert.equal(await service.confirm({body:{checkoutId:paid.id},account:{userId:'owner'}},res),true);assert.equal(issues,1);
});
