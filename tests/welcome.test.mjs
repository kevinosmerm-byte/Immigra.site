import test from 'node:test';
import assert from 'node:assert/strict';
import {NOTICE_VERSION,WELCOME_KEY,LANGUAGE_KEY,initialLanguage,readAcceptance,saveAcceptance,accepted,requiresWelcome} from '../src/welcome/state.mjs';
import {moduleFromHash} from '../shared/navigation/routes.mjs';
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),map};};
test('welcome suggests language without writing and respects the existing interface choice',()=>{
 const s=storage();assert.equal(initialLanguage(s,'es-MX'),'es');assert.equal(initialLanguage(s,'fr-FR'),'en');assert.equal(s.map.size,0);
 s.setItem(LANGUAGE_KEY,'en');assert.equal(initialLanguage(s,'es-US'),'en');
});
test('acceptance is versioned, stores only the notice and interface language, and survives reload',()=>{
 const s=storage();const record=saveAcceptance(s,'es',new Date('2026-10-27T12:00:00Z'));
 assert.deepEqual(Object.keys(record),['language','disclaimerVersion','acceptedAt']);assert.equal(record.disclaimerVersion,NOTICE_VERSION);
 assert.equal(accepted(readAcceptance(s)),true);assert.equal(s.map.size,2);assert.ok(s.getItem(WELCOME_KEY));
 assert.equal(accepted({...record,disclaimerVersion:'old'}),false);assert.equal(accepted({...record,acceptedAt:'invalid'}),false);
});
test('unavailable or malformed storage does not prevent acceptance for the active session',()=>{
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 assert.equal(readAcceptance(blocked),null);assert.equal(initialLanguage(blocked,'en-US'),'en');assert.ok(accepted(saveAcceptance(blocked,'en')));
 assert.equal(readAcceptance({getItem:()=>'{broken'}),null);
});
test('practice deep links need the welcome while public pages, settings and authentication remain available',()=>{
 for(const hash of ['#/','#/citizenship/interview?mode=n400','#/asylum/fiction','#/residency'])assert.ok(requiresWelcome(moduleFromHash(hash)));
 for(const hash of ['#/settings','#/help','#/account','#/terms'])assert.equal(requiresWelcome(moduleFromHash(hash)),false);
});
