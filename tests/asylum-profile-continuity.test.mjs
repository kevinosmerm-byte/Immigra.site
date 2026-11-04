import test from 'node:test';
import assert from 'node:assert/strict';
import {createDomainInterview,recordDomainTurn,advanceDomainTurn,skipDomainQuestion,skipAsylumTopic} from '../services/ai/interview-domain.mjs';
import {newSession,skipStudyTopic} from '../modules/asylum/study-session.mjs';
import {studyBank} from '../modules/asylum/reflection-bank.mjs';
import {topicForQuestion,isSkipAsylumTopic} from '../modules/asylum/question-sequence.mjs';
import {offerAdaptive} from '../modules/asylum/adaptive-session.mjs';
import {createInterviewAIEngine} from '../services/ai/interview-engine.mjs';

function reach(topic,locale='es'){
 let flow=createDomainInterview({module:'asylum',locale,country:'Cuba',transport:'text'});
 for(let i=0;i<flow.bank.questions.length&&flow.question?.block!==topic;i++)flow=skipDomainQuestion(flow);
 assert.equal(flow.question.block,topic);return flow;
}
for(const profile of [
 {name:'no political participation',topic:'politics',es:'Nunca participé en política.',en:'I never participated in politics.'},
 {name:'no return or comparable return known',topic:'returns',es:'No he regresado ni conozco a alguien que regresó.',en:'I have not returned and do not know anyone who returned.'},
 {name:'no current activity or private accounts shared',topic:'current_activity',es:'No participo ni publico opiniones.',en:'I do not participate or post opinions.'},
 {name:'no documents or witnesses',topic:'evidence',es:'No tengo documentos ni testigos.',en:'I have no documents or witnesses.'},
])for(const locale of ['es','en'])test(`${profile.name}, ${locale}: denial is preserved; explicit skip exits topic without inference`,()=>{
 let flow=reach(profile.topic,locale);
 assert.match(flow.question.english,/^(Si |If |¿Qué materiales|What materials)/);
 flow=advanceDomainTurn(recordDomainTurn(flow,profile[locale]),{answer_status:'adequate',next_action:'continue',evidence:[profile[locale]],educational_feedback:''}).flow;
 assert.equal(flow.statements.at(-1).text,profile[locale]);
 const statements=structuredClone(flow.statements),answers=structuredClone(flow.state.applicantProfile.answers);
 flow=skipAsylumTopic(flow);
 assert.notEqual(flow.question?.block,profile.topic);
 assert.deepEqual(flow.statements,statements);assert.deepEqual(flow.state.applicantProfile.answers,answers);
 const skipped=new Set(flow.bank.questions.filter(q=>q.block===profile.topic).map(q=>q.id));
 while(flow.question){assert.ok(!skipped.has(flow.question.id));flow=skipDomainQuestion(flow);}
});
test('unemployed or third-party statements do not activate any employment or political question automatically',()=>{
 for(const text of ['I have no job.','My friend belonged to a party; I never did.','No sé si alguien me busca.']){
  const session={settings:{module:'asylum',locale:'es'},transport:'text',history:[],flow:{revision:1,question:{id:'pending',kind:'concept'}}};
  offerAdaptive(session,{id:'source',kind:'concept'},text,{status:'adequate'});
  assert.equal(session.adaptiveActive,undefined);assert.equal(session.flow.question.id,'pending');
 }
});
test('study topic skip never mutates bank or claims applicability',()=>{
 const before=JSON.stringify(studyBank);let session=newSession(studyBank,'Venezuela');
 const skipped=[];while(true){skipped.push(topicForQuestion(session.order[session.index]));const next=skipStudyTopic(session);if(next.completed||next.index===session.index)break;session=next;}
 assert.equal(skipped.length,15);assert.equal(new Set(skipped).size,15);assert.equal(JSON.stringify(studyBank),before);
 assert.equal('applicantProfile' in session,false);
});
test('topic skip is explicit, exact and asylum-only',()=>{
 assert.equal(isSkipAsylumTopic('Omitir este tema'),true);assert.equal(isSkipAsylumTopic('Skip this topic'),true);
 for(const text of ['No participé en política','I have no job','My friend said skip this topic','I might skip this topic later'])assert.equal(isSkipAsylumTopic(text),false);
 assert.throws(()=>skipAsylumTopic(createDomainInterview({module:'residency',locale:'es',route:'MATRIMONIO'})),/ASYLUM_TOPIC_REQUIRED/);
});
test('server skip is idempotent, skips optional impact safely, and never calls provider or saves personal answers',async()=>{
 let calls=0;const engine=createInterviewAIEngine({env:{PLATFORM_AI_ENABLED:'true',OPENAI_API_KEY:'synthetic'},reserveSessionQuota:async()=>true,reserveTurnQuota:async()=>{calls++;return true;},fetchImpl:async()=>{throw Error('PROVIDER_MUST_NOT_BE_CALLED');}});
 const s=await engine.start('synthetic',{module:'asylum',locale:'es',consent:true,transport:'text'});
 try{
  const internal=engine.manager.get(s.id,'synthetic');internal.flow=reach('impact');
  assert.equal(internal.flow.question.kind,'impact_consent');
  const body={answer:'Omitir este tema',questionId:internal.flow.question.id,turnId:'skip-topic'};
  const result=await engine.turn('synthetic',s.id,body);assert.equal(result.status,'skipped');assert.equal(result.educational_feedback,'');
  assert.notEqual(internal.flow.question.block,'impact');assert.equal(internal.history.length,0);assert.equal(internal.evaluations.length,0);assert.equal(calls,0);
  assert.deepEqual(await engine.turn('synthetic',s.id,body),result);
 }finally{await engine.close(s.id,'synthetic');}
});

test('no prior harm: revised prompts keep uncertainty and do not assert a past incident',()=>{
 let flow=createDomainInterview({module:'asylum',locale:'es',country:'Cuba'});
 const answer='No me ocurrió un incidente; temo algo que podría ocurrir.';
 flow=advanceDomainTurn(recordDomainTurn(flow,answer),{answer_status:'adequate',next_action:'continue',evidence:[answer],educational_feedback:''}).flow;
 assert.equal(flow.statements.at(-1).text,answer);
 for(const n of ['004','018','055','096']){
  const qs=studyBank.filter(q=>q.sequence_source_id===`IMMIGRA_ASYLUM_REFLECT_${n}_V2`);
  assert.ok(qs.length);for(const q of qs){assert.match(q.question_es,/^Si /);assert.match(q.question_en,/^If /);}
 }
});
