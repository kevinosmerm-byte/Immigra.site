import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccountDeletionHandler} from '../server/accountDeletion.js';
import {cancelWebRenewalForDeletion} from '../server/stripeBilling.js';
const response=()=>({code:200,body:null,status(code){this.code=code;return this},json(body){this.body=body;return this},set(){}});
test('confirmed account deletion cancels linked web renewal first and never deletes after a cancellation failure',async()=>{
 const calls=[],handler=createAccountDeletionHandler({cancelWebRenewal:async id=>{calls.push('cancel:'+id)},removeAccount:async id=>{calls.push('delete:'+id)}});
 let res=response();await handler({body:{},account:{userId:'owner'}},res);assert.equal(res.code,400);assert.deepEqual(calls,[]);
 res=response();await handler({body:{confirmation:'DELETE'},account:{userId:'owner'}},res);assert.deepEqual(calls,['cancel:owner','delete:owner']);assert.equal(res.body.deleted,true);
 const failed=createAccountDeletionHandler({cancelWebRenewal:async()=>{throw Error('private provider error')},removeAccount:async()=>{throw Error('must not run')}});res=response();await failed({body:{confirmation:'DELETE'},account:{userId:'owner'}},res);assert.equal(res.code,503);assert.equal(JSON.stringify(res.body).includes('private'),false);
});
test('only the authenticated owners linked Stripe subscription can be changed',async()=>{
 const updates=[],identity={provider:'stripe',status:'active',providerCustomerId:'cus_fixture',providerEntitlementId:'sub_fixture'};
 const subscription={id:'sub_fixture',customer:'cus_fixture',status:'active',metadata:{user_id:'owner'},cancel_at_period_end:false};
 const client=()=>({subscriptions:{retrieve:async id=>{assert.equal(id,'sub_fixture');return subscription},update:async(...args)=>{updates.push(args)}}});
 await cancelWebRenewalForDeletion('owner',{identityLookup:async()=>identity,client});assert.deepEqual(updates,[['sub_fixture',{cancel_at_period_end:true}]]);
 await assert.rejects(cancelWebRenewalForDeletion('other',{identityLookup:async()=>identity,client}),/ownership/);assert.equal(updates.length,1);
 await cancelWebRenewalForDeletion('owner',{identityLookup:async()=>({provider:'apple',status:'active'}),client:()=>{throw Error('must not call Stripe')}});
});
