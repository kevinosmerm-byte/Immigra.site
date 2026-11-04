import test from 'node:test';
import assert from 'node:assert/strict';
import {createInterviewAIEngine} from '../services/ai/interview-engine.mjs';
import {createDomainInterview} from '../services/ai/interview-domain.mjs';
import {studyBank} from '../modules/asylum/reflection-bank.mjs';
import {baseImpactIds,impactWarning} from '../modules/asylum/base-impact.mjs';
assert.equal(baseImpactIds.size,4);
for(const locale of ['es','en'])for(const id of baseImpactIds)test(`explicit base impact choice ${locale} ${id}`,async()=>{
 let calls=0;const engine=createInterviewAIEngine({env:{PLATFORM_AI_ENABLED:'true',OPENAI_API_KEY:'synthetic'},reserveSessionQuota:async()=>true,reserveTurnQuota:async()=>{calls++;return true;},fetchImpl:async()=>{throw Error('Provider must not run');}});
 const prompt=studyBank.find(q=>q.id===id)[locale==='es'?'question_es':'question_en'];
 const started=await engine.start('synthetic',{module:'asylum',locale,consent:true,transport:'text',initialQuestion:prompt});
 try{
 let opening=await engine.turn('synthetic',started.id,{answer:''});
 while(opening.question_id!==id)opening=await engine.turn('synthetic',started.id,{answer:'Next question'});
 assert.equal(opening.next_question,impactWarning[locale]);assert.notEqual(opening.next_question,prompt);assert.equal(opening.adaptive.baseImpact.id,id);
 for(const answer of ['yes','sí','Synthetic personal answer']){
 const ignored=await engine.turn('synthetic',started.id,{answer,questionId:id});assert.equal(ignored.next_question,impactWarning[locale]);
 }
 const action={type:'base_impact_continue',questionId:id,revision:opening.revision};
 await assert.rejects(engine.turn('synthetic',started.id,{answer:'',adaptive:{...action,revision:999}}),/STALE/);
 const request={answer:'',questionId:id,turnId:'synthetic-confirm',adaptive:action};
 const accepted=await engine.turn('synthetic',started.id,request);assert.equal(accepted.next_question,prompt);assert.equal(accepted.adaptive.baseImpact,null);
 assert.deepEqual(await engine.turn('synthetic',started.id,request),accepted);
 const skipped=await engine.turn('synthetic',started.id,{answer:locale==='es'?'Siguiente pregunta':'Next question',questionId:id});assert.notEqual(skipped.question_id,id);
 assert.equal(calls,0);assert.equal(engine.manager.get(started.id,'synthetic').history.length,0);
 }finally{await engine.close(started.id,'synthetic');}
});
test('omission advances without any implicit consent and voice excludes all four base impact questions',async()=>{
 const engine=createInterviewAIEngine({env:{PLATFORM_AI_ENABLED:'true',OPENAI_API_KEY:'synthetic'},reserveSessionQuota:async()=>true,reserveTurnQuota:async()=>{throw Error('No evaluation');}});
 const q=studyBank.find(q=>baseImpactIds.has(q.id));
 const started=await engine.start('synthetic',{module:'asylum',locale:'en',consent:true,transport:'text',initialQuestion:q.question_en});
 try{let gate=await engine.turn('synthetic',started.id,{answer:''});while(gate.question_id!==q.id)gate=await engine.turn('synthetic',started.id,{answer:'Next question'});const skipped=await engine.turn('synthetic',started.id,{answer:'',adaptive:{type:'base_impact_skip',questionId:q.id,revision:gate.revision}});assert.notEqual(skipped.question_id,q.id);}finally{await engine.close(started.id,'synthetic');}
 for(const locale of ['en','es']){const flow=createDomainInterview({module:'asylum',locale,transport:'voice'});assert.ok(flow.bank.questions.every(q=>!baseImpactIds.has(q.id)));assert.equal(flow.bank.questions.length,237);}
});
