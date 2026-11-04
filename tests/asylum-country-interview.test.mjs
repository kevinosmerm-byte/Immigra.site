import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSettings,createInterviewAIEngine,InterviewSessionManager} from '../services/ai/interview-engine.mjs';
import {createDomainInterview,recordDomainTurn,advanceDomainTurn,skipDomainQuestion} from '../services/ai/interview-domain.mjs';
import {adaptiveDesign} from '../modules/asylum/reflection-bank.mjs';
const base={module:'asylum',locale:'es',consent:true,transport:'text'};
test('asylum country is validated without inferring it from narrative or other modules',()=>{
 for(const country of ['Venezuela','Cuba','Other','',undefined])assert.equal(validateSettings({...base,country}).country,country||'');
 for(const country of ['venezuela','Atlantis',null,{},['Venezuela']])assert.throws(()=>validateSettings({...base,country}),/INVALID_SETTINGS/);
 assert.equal(validateSettings({...base,context:'Synthetic story mentions Venezuela'}).country,'');
 assert.equal(validateSettings({...base,module:'citizenship',country:'Venezuela'}).country,undefined);
});
test('server-started sessions use exactly 241 or 249 unique questions in either language',async()=>{
 const manager=new InterviewSessionManager();
 const engine=createInterviewAIEngine({env:{PLATFORM_AI_ENABLED:'true',OPENAI_API_KEY:'synthetic-only'},manager,reserveSessionQuota:async()=>true,reserveTurnQuota:async()=>true,fetchImpl:async()=>{throw Error('No provider call expected');}});
 for(const locale of ['es','en'])for(const country of ['Venezuela','Cuba','']){
  const session=await engine.start('synthetic-owner',{...base,locale,country});
  try{
   let flow=manager.get(session.id,'synthetic-owner').flow;
   const expected=country==='Venezuela'?249:241,seen=new Set();
   assert.equal(flow.bank.questions.length,expected);
   while(flow.question){assert.ok(!seen.has(flow.question.id));seen.add(flow.question.id);flow=skipDomainQuestion(flow);assert.ok(seen.size<=expected);}
   assert.equal(seen.size,expected);assert.equal([...seen].filter(id=>id.includes('VENEZUELA')||id.startsWith('IMMIGRA_REVIEW_')).length,country==='Venezuela'?8:0);
  }finally{await engine.close(session.id,'synthetic-owner');}
 }
});
test('appendix cannot activate without explicit context confirmation on synthetic answers',()=>{
 assert.equal(adaptiveDesign.status,'explicit_confirmation_local_not_published');
 const ids=new Set(adaptiveDesign.branches.flatMap(branch=>branch.questions.map(q=>q.id)));
 assert.equal(ids.size,88);
 for(const answer of ['No','No aplica','No sé','No recuerdo','Prefiero omitirlo','I do not want to discuss this','My friend changed jobs, not me.','I was detained at the checkpoint.']){
  const flow=createDomainInterview(base,{random:()=>0.5});
  const next=advanceDomainTurn(recordDomainTurn(flow,answer),{answer_status:'adequate',consistency_status:'insufficient_context',next_action:'continue',evidence:[answer],suggested_follow_up:''}).flow;
  assert.ok(!ids.has(next.question?.id));assert.equal(next.followUpQueue.length,0);
 }
});
