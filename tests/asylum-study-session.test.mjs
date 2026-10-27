import test from 'node:test';
import assert from 'node:assert/strict';
import {newSession,restoreSession,saveSession,advanceSession,eligibleIds,STUDY_KEY} from '../modules/asylum/study-session.mjs';
const bank=[{id:'a'},{id:'b'},{id:'c',country:'Cuba'},{id:'d',country:'China'}];
test('Fisher-Yates includes general and selected country once without changing bank',()=>{
 const before=JSON.stringify(bank);const s=newSession(bank,'Cuba',()=>0);
 assert.deepEqual(s.order,['b','c','a']);assert.deepEqual(eligibleIds(bank,'China'),['a','b','d']);assert.equal(JSON.stringify(bank),before);
});
test('previous and next preserve order and stop at boundaries',()=>{
 const s=newSession(bank,'Cuba');let next=s;for(let i=0;i<10;i++)next=advanceSession(next,1);
 assert.equal(next.index,2);assert.deepEqual(next.order,s.order);assert.equal(advanceSession(next,-1).index,1);assert.equal(advanceSession(s,-1).index,0);
});
test('reload restores exact sequence and position; corrupt or outdated sessions rejected',()=>{
 let value;const storage={getItem:()=>value,setItem:(key,v)=>{assert.equal(key,STUDY_KEY);value=v;},removeItem:()=>{value=null;}};
 const s=advanceSession(newSession(bank,'Cuba'),1);saveSession(storage,s);assert.deepEqual(restoreSession(storage,bank,['Cuba']),s);
 value=JSON.stringify({...s,order:['a','a','b']});assert.equal(restoreSession(storage,bank,['Cuba']),null);
 value=JSON.stringify({...s,index:99});assert.equal(restoreSession(storage,bank,['Cuba']),null);
 value='{';assert.equal(restoreSession(storage,bank,['Cuba']),null);
 saveSession(null,s);assert.equal(restoreSession(null,bank,['Cuba']),null);
});
test('new country and study again start fresh valid permutations',()=>{
 const first=advanceSession(newSession(bank,'Cuba',()=>0),2);const again=newSession(bank,'Cuba',()=>.99);assert.equal(again.index,0);assert.notDeepEqual(again.order,first.order);
 assert.deepEqual(new Set(newSession(bank,'China').order),new Set(['a','b','d']));
});
