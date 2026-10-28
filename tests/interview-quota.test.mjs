import test from 'node:test';
import assert from 'node:assert/strict';
import {reserveInterviewAccess} from '../services/ai/interview-quota.mjs';
const args={bucket:'interview-conversation',limit:3,globalLimit:100};
test('legacy temporary flags no longer bypass personal authorization',async()=>{
 for(const id of ['guest:test','account-test']){const calls=[];const reserve=async(...a)=>{calls.push(a);return a[0]==='public-interviews-global';};
 assert.equal(await reserveInterviewAccess({...args,id,reserve}),false);
 assert.ok(calls.some(call=>call[0]===id));}
});
test('global quota exhaustion and database failure still stop test access',async()=>{
 assert.equal(await reserveInterviewAccess({...args,id:'guest:test',reserve:async()=>false}),false);
 await assert.rejects(reserveInterviewAccess({...args,id:'guest:test',reserve:async()=>{throw Error('QUOTA_UNAVAILABLE');}}),/QUOTA_UNAVAILABLE/);
});
test('server override restores existing personal quota without clearing usage',async()=>{
 const calls=[];assert.equal(await reserveInterviewAccess({...args,id:'guest:test',env:{INTERVIEW_TEST_ACCESS:'false'},reserve:async(...a)=>{calls.push(a);return a[0]==='public-interviews-global';}}),false);
 assert.deepEqual(calls,[['public-interviews-global','interview-conversation-public',100],['guest:test','interview-conversation',3]]);
});
