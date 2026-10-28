import test from 'node:test';
import assert from 'node:assert/strict';
import baseline from './fixtures/citizenshipai-baseline.json' with {type:'json'};
import n400Bank from '../modules/citizenship/src/data/n400InterviewBank.json' with {type:'json'};
import {civicsQuestionBank} from '../modules/citizenship/src/civicsQuestionBank.js';
import {evaluateCivicsAnswer,normalizeCivicsAnswer,officialAnswerVariants} from '../modules/citizenship/src/civicsAnswerEvaluator.js';
import {createN400InterviewState,selectNextN400Question,recordN400Answer,getContextualN400FollowUps,confirmN400ProfileAnswer,getN400ApplicantProfile} from '../modules/citizenship/src/n400InterviewEngine.js';
import {createDomainInterview as createRandomInterview,recordDomainTurn,advanceDomainTurn,domainBank} from '../services/ai/interview-domain.mjs';
import {normalizeEvaluation} from '../shared/interview-ui/evaluation-result.mjs';
import {createCivicsConversation} from '../shared/interview-ui/civics-conversation.mjs';
const settings={module:'citizenship',locale:'en',avatar:'sahara'};
const adequate={answer_status:'adequate',suggested_follow_up:'An invented new topic?',educational_feedback:'Clear response.'};
const advance=(flow,answer='Example',result=adequate)=>advanceDomainTurn(recordDomainTurn(flow,answer),result).flow;

test('512 civics results equal the original repository baseline, including missing dynamic answers',()=>{
  assert.equal(baseline.rows.length,128);
  for(const row of baseline.rows){const question=civicsQuestionBank.find(q=>q.questionId===row.id);for(const c of row.cases)assert.deepEqual(evaluateCivicsAnswer(question,c.answer),c.result,`question ${row.id}`);}
  for(const row of baseline.variants){assert.deepEqual(officialAnswerVariants(row.text),row.variants);assert.equal(normalizeCivicsAnswer(row.text),row.normalized);}
});
test('N-400 selection and original follow-ups remain authoritative over model suggestions',()=>{
  let flow=createDomainInterview(settings),state=createN400InterviewState(n400Bank);
  for(let i=0;i<8;i++){
    const original=selectNextN400Question(n400Bank,state);assert.equal(flow.question.id,original.question.id);
    const q=original.question,answer=q.answerType==='yes_no'?'Yes':'Example';state=recordN400Answer(original.state,q,answer);
    const expected=getContextualN400FollowUps(q,answer,state.applicantProfile);
    flow=advance(flow,answer);
    for(const text of expected){assert.equal(flow.question.english,text);flow=advance(flow);}
  }
});
test('uncertain yes/no never becomes a fact or activates conditional travel questions',()=>{
  let flow=createDomainInterview(settings);
  const raw=n400Bank.questions.find(q=>q.id==='P_TRAVEL_ANY');
  flow.question={...raw,conceptId:raw.concept,english:raw.canonicalPracticePrompt,kind:'concept'};
  const next=advance(flow,'No estoy seguro');
  assert.equal(next.state.applicantProfile.has_travel,undefined);
  assert.equal(next.state.applicantProfile.answers.P_TRAVEL_ANY,undefined);
  assert.equal(next.statements.at(-1).uncertain,true);
  assert.equal(confirmN400ProfileAnswer({},raw,'No estoy seguro'),null);
  const confirmed=confirmN400ProfileAnswer({},raw,'Yes');
  assert.equal(getN400ApplicantProfile({n400Profile:confirmed}).has_travel,true);
});
test('yes/no clarification records the eventual answer on the original concept',()=>{
  let flow=createDomainInterview(settings);const raw=n400Bank.questions.find(q=>q.id==='P_TRAVEL_ANY');
  flow.question={...raw,conceptId:raw.concept,english:raw.canonicalPracticePrompt,kind:'concept'};
  flow=advance(flow,'During spring',{answer_status:'ambiguous',suggested_follow_up:'Did you travel?',educational_feedback:''});
  assert.equal(flow.question.id,'P_TRAVEL_ANY');
  flow=advance(flow,'Yes');assert.equal(flow.state.applicantProfile.has_travel,true);
  assert.equal(flow.question.kind,'followup');
});
test('Sahara and Kevin use identical questions, state and evaluation contract',()=>{
  const a=createDomainInterview(settings),b=createDomainInterview({...settings,avatar:'kevin'});
  assert.deepEqual(advanceDomainTurn(recordDomainTurn(a,'Example'),adequate),advanceDomainTurn(recordDomainTurn(b,'Example'),adequate));
});
test('residency uses only its selected family route and progresses easy to difficult',()=>{
  const sets=[];
  for(const route of ['MATRIMONIO','HIJO_A_PADRES','PADRES_A_HIJOS']){
    const bank=domainBank({module:'residency',route});sets.push(new Set(bank.questions.map(q=>q.id)));
    assert.equal(bank.interviewArchitecture.blockOrder[0],'Fácil');
    let flow=createDomainInterview({module:'residency',route});const seen=[];
    while(flow.question){seen.push(flow.question.id);flow=advance(flow);}
    assert.equal(seen.length,new Set(seen).size);assert.deepEqual(new Set(seen),sets.at(-1));
  }
  assert.ok([...sets[0]].every(id=>!sets[1].has(id)&&!sets[2].has(id)));
});
test('asylum chronology is a sequence of user statements, isolated and never confirmed as personal facts',()=>{
  const a=createDomainInterview({module:'asylum',locale:'es'}),b=createDomainInterview({module:'asylum',locale:'es'});
  const next=advance(a,'No recuerdo la fecha');
  assert.equal(next.statements[0].text,'No recuerdo la fecha');
  assert.equal(next.statements[0].uncertain,true);assert.deepEqual(b.statements,[]);
  assert.deepEqual(b.state.applicantProfile.answers,{});
});
test('normalization does not mutate original civics results or allow personal truth scores',()=>{
  const original={status:'incorrect',action:'retry'};
  assert.equal(normalizeEvaluation(original,'civics').status,'incorrect_knowledge');assert.equal(original.status,'incorrect');
  assert.equal(normalizeEvaluation({answer_status:'clarification_needed'}).status,'needs_clarification');
  assert.equal(normalizeEvaluation({answer_status:'fraud'}).status,'evaluation_unavailable');
});

test('automatic civics grades official answers locally, advances, retries incomplete and deduplicates',async()=>{
  const questions=civicsQuestionBank.filter(q=>!q.isDynamic&&q.minimumAnswersRequired===1).slice(0,2);
  const turn=createCivicsConversation(questions);
  const first=await turn({});assert.equal(first.next_question,questions[0].question);
  const result=await turn({answer:questions[0].acceptedAnswers[0],turnId:'one'});
  assert.equal(result.status,'correct');assert.equal(result.next_question,questions[1].question);
  assert.deepEqual(await turn({answer:questions[0].acceptedAnswers[0],turnId:'one'}),result);
  const wrong=await turn({answer:'bananas on Mars',turnId:'two'});
  assert.equal(wrong.status,'incorrect_knowledge');assert.equal(wrong.next_action,'finish');assert.equal(wrong.provider,'official-bank');
  turn.reset();assert.equal((await turn({})).question_id,first.question_id);
  const multiple=civicsQuestionBank.find(q=>!q.isDynamic&&q.minimumAnswersRequired>1);
  const retry=await createCivicsConversation([multiple])({answer:multiple.acceptedAnswers[0],turnId:'partial'});
  assert.equal(retry.status,'incomplete');assert.equal(retry.question_id,String(multiple.questionId));
});

for(const module of ['asylum','residency'])for(const locale of ['es','en']){
 test(`${module} ${locale}: incomplete answers advance without repeating or exhausting one topic`,()=>{
  let flow=createDomainInterview({module,locale,route:'MATRIMONIO'});const ids=[];const topics=[];
  for(let i=0;i<10&&flow.question;i++){
   const q=flow.question;ids.push(q.id);topics.push(module==='asylum'?q.block:q.subBlock);
   flow=advance(flow,'Example',{answer_status:'incomplete',next_action:'clarify',suggested_follow_up:q.english,educational_feedback:''});
   if(flow.question)assert.notEqual(flow.question.id,q.id);
  }
  assert.equal(ids.length,new Set(ids).size);assert.ok(new Set(topics).size>=3);
 });
 test(`${module} ${locale}: discrepancy clarification is bounded and paraphrases are rejected`,()=>{
  let flow=createDomainInterview({module,locale,route:'MATRIMONIO'});
  const evaluation={answer_status:'ambiguous',next_action:'clarify',consistency_status:'possible_discrepancy',suggested_follow_up:locale==='es'?'¿Qué quisiste decir con la expresión que acabamos de señalar?':'What did you mean by the expression we just identified?',evidence:['Example'],educational_feedback:''};
  flow=advance(flow,'Example',evaluation);assert.equal(flow.question.kind,'followup');
  flow=advance(flow,'Example',evaluation);assert.equal(flow.question.kind,'concept');
  const id=flow.question.id;flow=advance(flow,'Example',evaluation);assert.notEqual(flow.question.id,id);assert.equal(flow.question.kind,'concept');
  const current=flow.question;flow=advance(flow,'Example',{...evaluation,suggested_follow_up:current.english});assert.notEqual(flow.question.id,current.id);
 });
}

test('asylum automatic bank excludes filler variants and unbound contextual templates',()=>{
 for(const locale of ['es','en']){
  const bank=domainBank({module:'asylum',locale});
  assert.ok(bank.questions.some(q=>q.id==='AS-SUP-001'));
  assert.ok(!bank.questions.some(q=>q.id==='Q0113'||q.id==='Q0102'||q.id==='Q0084'));
  for(const q of bank.questions)assert.doesNotMatch(q.canonicalPracticePrompt,/[{}]|Could you tell me more about this/);
  let flow=createDomainInterview({module:'asylum',locale}),seen=new Set();
  while(flow.question){assert.ok(!seen.has(flow.question.id));seen.add(flow.question.id);flow=advance(flow,'No recuerdo');}
  assert.equal(seen.size,bank.questions.length);
 }
});
// Fix the random source when comparing semantic ordering across avatars/locales.
const createDomainInterview=settings=>createRandomInterview(settings,{random:()=>0.999999});

