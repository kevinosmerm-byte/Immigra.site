import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newSession,skipStudyQuestion,skipStudyTopic,restoreSession} from '../modules/asylum/study-session.mjs';
import {studyBank} from '../modules/asylum/reflection-bank.mjs';
import {createInterviewAIEngine} from '../services/ai/interview-engine.mjs';

test('passing one study card preserves sequence; final-card skip finishes without invented answers or automatic restart',()=>{
 let s=newSession(studyBank,'Cuba');const order=[...s.order];
 s=skipStudyQuestion(s);assert.equal(s.index,1);assert.deepEqual(s.order,order);assert.equal('answers' in s,false);
 s={...s,index:s.order.length-1};const done=skipStudyQuestion(s);assert.equal(done.completed,true);assert.equal(done.index,s.index);assert.deepEqual(skipStudyQuestion(done),done);
 assert.deepEqual(restoreSession({getItem:()=>JSON.stringify(done)},studyBank,['Cuba']),done);
 assert.equal(newSession(studyBank,'Cuba').completed,undefined);assert.equal(skipStudyTopic(s).completed,true);
});
test('study and interview use explicit bilingual native button names and retain live question announcements',()=>{
 const study=readFileSync(new URL('../modules/asylum/AsylumStudyBook.jsx',import.meta.url),'utf8');
 const call=readFileSync(new URL('../shared/interview-ui/CallView.jsx',import.meta.url),'utf8');
 for(const source of [study,call])for(const label of ['Pasar pregunta','Skip question','Pasar esta pregunta sin responder','Skip this question without answering'])assert.ok(source.includes(label),label);
 assert.match(study,/<button type="button" aria-label=/);assert.match(study,/aria-live="polite" aria-atomic="true"/);assert.match(study,/role="status"/);assert.match(study,/ArrowRight/);assert.match(study,/ArrowLeft/);
 const glass=readFileSync(new URL('../shared/design-system/Glass.jsx',import.meta.url),'utf8');assert.match(glass,/<button/);assert.match(call,/skipDisabled\|\|paused\|\|!connected\|\|state==='processing'/);
});
test('single-question interview skip in both languages keeps exact next question without history, inference or evaluator',async()=>{
 for(const locale of ['es','en']){
  let evaluations=0;const engine=createInterviewAIEngine({env:{PLATFORM_AI_ENABLED:'true',OPENAI_API_KEY:'synthetic'},reserveSessionQuota:async()=>true,reserveTurnQuota:async()=>{evaluations++;return true;},fetchImpl:async()=>{throw Error('NO_PROVIDER_EXPECTED');}});
  const session=await engine.start('synthetic',{module:'asylum',locale,consent:true,transport:'text'});
  try{
   const first=await engine.turn('synthetic',session.id,{answer:''});const internal=engine.manager.get(session.id,'synthetic');const expected=internal.flow.bank.questions[1].id;
   const body={answer:locale==='es'?'Siguiente pregunta':'Next question',questionId:first.question_id,turnId:'skip-one'};
   const next=await engine.turn('synthetic',session.id,body);assert.equal(next.question_id,expected);assert.equal(next.status,'skipped');assert.equal(evaluations,0);
   assert.equal(internal.history.length,0);assert.equal(internal.flow.statements.length,0);assert.deepEqual(internal.flow.state.applicantProfile.answers,{});
   assert.deepEqual(await engine.turn('synthetic',session.id,body),next);
  }finally{await engine.close(session.id,'synthetic');}
 }
});
