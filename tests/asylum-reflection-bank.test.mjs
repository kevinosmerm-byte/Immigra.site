import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {studyBank,asylumInterviewQuestions,adaptiveDesign} from '../modules/asylum/reflection-bank.mjs';
import {newSession,restoreSession,saveSession,advanceSession,STUDY_KEY,LEGACY_STUDY_KEY} from '../modules/asylum/study-session.mjs';
import {SEQUENCE_VERSION} from '../modules/asylum/question-sequence.mjs';
import {domainBank,createDomainInterview,recordDomainTurn,advanceDomainTurn} from '../services/ai/interview-domain.mjs';
const countries=['Venezuela','Cuba','Nicaragua','Colombia','Haiti','China','Other'];
function storage(session){const values=new Map([[STUDY_KEY,JSON.stringify(session)]]);return {values,getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};}
test('241 new bilingual questions and eight Venezuela cards; unique text/IDs, no templates',()=>{
 assert.equal(studyBank.length,249);assert.equal(new Set(studyBank.map(q=>q.id)).size,249);
 for(const lang of ['es','en']) {const texts=studyBank.map(q=>q['question_'+lang]);assert.equal(new Set(texts).size,249);for(const text of texts){assert.ok(typeof text==='string'&&text.length>20);assert.doesNotMatch(text,/\{[A-Z_]+\}|<[^>]+>|nombre completo|full name/i);}}
 assert.equal(adaptiveDesign.count,88);assert.equal(adaptiveDesign.status,'explicit_confirmation_local_not_published');
 const adaptive=adaptiveDesign.branches.flatMap(b=>b.questions);assert.equal(adaptive.length,88);assert.equal(new Set(adaptive.map(q=>q.id)).size,88);assert.ok(adaptive.every(q=>!studyBank.some(s=>s.id===q.id)));
});
test('all country/language combinations preserve plain text and exclude unrelated country cards',()=>{
 for(const country of countries)for(const locale of ['es','en']) {const qs=asylumInterviewQuestions(locale,country);assert.equal(qs.length,country==='Venezuela'?249:241);const s=newSession(studyBank,country,()=>.5);assert.equal(s.order.length,qs.length);for(const q of qs){assert.equal(q.canonicalPracticePrompt,studyBank.find(s=>s.id===q.id)['question_'+locale]);assert.deepEqual(q.followUps,[]);}}
});
test('legacy migration retires rewritten country IDs, archives progress and never reuses Q IDs',()=>{
 const old={version:1,country:'Venezuela',order:['Q0001','IMMIGRA_REVIEW_13','Q0017','IMMIGRA_REVIEW_14'],index:2};const st=storage(old);const s=restoreSession(st,studyBank,countries);
 assert.equal(s.index,0);assert.equal(s.migration.reordered,true);assert.equal(s.migration.added.length,249);assert.deepEqual(s.migration.retired,['Q0001','IMMIGRA_REVIEW_13','Q0017','IMMIGRA_REVIEW_14']);assert.deepEqual(s.previousBankSession,old);
 saveSession(st,s);assert.deepEqual(JSON.parse(st.getItem(LEGACY_STUDY_KEY)),old);assert.deepEqual(restoreSession(st,studyBank,countries),s);
 saveSession(st,newSession(studyBank,'Cuba',()=>0));assert.deepEqual(JSON.parse(st.getItem(LEGACY_STUDY_KEY)),old);
});
test('entirely retired session starts all new cards unseen and keeps raw old state',()=>{
 const old={version:1,country:'Cuba',order:['Q0001','Q0002'],index:1};const s=restoreSession(storage(old),studyBank,countries);assert.equal(s.index,0);assert.equal(s.migration.retained.length,0);assert.equal(s.migration.added.length,241);assert.deepEqual(s.previousBankSession,old);
});
test('new bank expansion preserves position and appends new IDs deterministically',()=>{
 const old={version:1,sequence:SEQUENCE_VERSION,country:'Cuba',order:['b','a'],index:1};const s=restoreSession(storage(old),[{id:'a'},{id:'b'},{id:'c'}],countries);assert.deepEqual(s.order,['b','a','c']);assert.equal(s.index,1);assert.deepEqual(s.migration.added,['c']);
});
test('failed archive write never overwrites old persisted progress',()=>{
 const old={version:1,country:'Cuba',order:['Q0001'],index:0};const st=storage(old);const s=restoreSession(st,studyBank,countries);st.setItem=()=>{throw Error('quota');};saveSession(st,s);assert.deepEqual(JSON.parse(st.getItem(STUDY_KEY)),old);
});

test('pending backup survives country reset and deselection after an archive failure',()=>{
 for(const replacement of [newSession(studyBank,'Venezuela',()=>0),null]) {
  const old={version:1,country:'Cuba',order:['Q0001'],index:0};const st=storage(old);
  const migrated=restoreSession(st,studyBank,countries);const write=st.setItem;
  st.setItem=(key,value)=>{if(key===LEGACY_STUDY_KEY)throw Error('quota');write(key,value);};
  saveSession(st,migrated);saveSession(st,replacement,migrated.previousBankSession);
  assert.deepEqual(JSON.parse(st.getItem(STUDY_KEY)),old);
  st.setItem=write;saveSession(st,replacement,migrated.previousBankSession);
  assert.deepEqual(JSON.parse(st.getItem(LEGACY_STUDY_KEY)),old);
  assert.deepEqual(JSON.parse(st.getItem(STUDY_KEY)),replacement);
 }
});
test('actual interview adapter uses new bank, preserves explicit source context and unknown answers',()=>{
 for(const locale of ['es','en']){const source={id:'source-safe-fixture',concept:'source-safe-fixture',block:'source',subBlock:'source',canonicalPracticePrompt:'Synthetic context?',answerType:'text',followUps:[]};const settings={module:'asylum',locale,sourceQuestions:[source]};assert.equal(domainBank(settings).questions.length,242);let flow=createDomainInterview(settings,{random:()=>.5});assert.ok(flow.question);for(let i=0;i<4;i++){const r=recordDomainTurn(flow,locale==='es'?'No sé':'I do not know');flow=advanceDomainTurn(r,{answer_status:'uncertain',next_action:'clarify',suggested_follow_up:'Invented premise?',educational_feedback:''}).flow;assert.notEqual(flow.question?.english,'Invented premise?');}assert.ok(flow.statements.every(s=>s.uncertain));}
});
test('study UI keeps navigation and bilingual plain-text rendering with educational guidance',()=>{
 const ui=readFileSync(new URL('../modules/asylum/AsylumStudyBook.jsx',import.meta.url),'utf8');assert.match(ui,/studyInstructions/);assert.match(ui,/onTouchCancel/);assert.match(ui,/ArrowRight/);assert.match(ui,/question\[es\?'question_es':'question_en'\]/);assert.doesNotMatch(ui,/question_bank\.jsonl|supplemental\.asylum/);
});
