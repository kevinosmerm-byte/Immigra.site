// Domain adapters, not independent interview engines. All selection and recording
// below delegate to the unchanged CitizenshipAI engine. Data lives in one session.
import {readFileSync} from 'node:fs';
import n400Bank from '../../modules/citizenship/src/data/n400InterviewBank.json' with {type:'json'};
import {createN400InterviewState,selectNextN400Question,recordN400Answer,recordN400FollowUpAnswer,getContextualN400FollowUps,createN400FollowUpPrompt,parseYesNo} from '../../modules/citizenship/src/n400InterviewEngine.js';
import {selectAosQuestions,isUncertain,aosQuestion} from '../../modules/residency/src/aosEngine.mjs';
import {normalizeEvaluation} from '../../shared/interview-ui/evaluation-result.mjs';

const asylumBank=readFileSync(new URL('../../modules/asylum/master-package/03_question_bank/question_bank.jsonl',import.meta.url),'utf8').trim().split(/\r?\n/).map(line=>JSON.parse(line));
const architecture=questions=>{
  const blockOrder=[...new Set(questions.map(q=>q.block))];
  return {questions,interviewArchitecture:{blockOrder,subBlockOrder:Object.fromEntries(blockOrder.map(b=>[b,[...new Set(questions.filter(q=>q.block===b).map(q=>q.subBlock))]])),transitionScripts:{}}};
};
export function domainBank(settings){
  if(settings.module==='citizenship')return n400Bank;
  if(settings.module==='residency')return architecture(selectAosQuestions({route:settings.route,...(settings.practiceOptions||{count:12}),random:()=>0.5}).map(q=>({id:q.id,concept:q.id,block:q.dificultad,subBlock:'FAMILY',canonicalPracticePrompt:aosQuestion(q,settings.locale),answerType:'text',followUps:[],sourceRefs:[q.fuente]})));
  return architecture(asylumBank.filter(q=>q.uscis_enabled===1).map(q=>({id:q.id,concept:q.id,block:q.category,subBlock:q.subcategory,canonicalPracticePrompt:settings.locale==='es'?q.question_es:q.question_en,answerType:'text',followUps:[]})));
}
export function createDomainInterview(settings){
  const bank=domainBank(settings);
  if(settings.module==='asylum'&&settings.initialQuestion){const first=bank.questions.find(q=>q.canonicalPracticePrompt===settings.initialQuestion);if(first){bank.questions=[first,...bank.questions.filter(q=>q!==first)];bank.interviewArchitecture.blockOrder=[first.block,...bank.interviewArchitecture.blockOrder.filter(b=>b!==first.block)];}}
  // Only the optional, displayed and explicitly shared context may seed N-400.
  let context={};
  if(settings.module==='citizenship'&&settings.context){try{const data=JSON.parse(settings.context);if(data&&typeof data==='object'){const profile=data.n400Profile||{};context={n400Profile:{answers:Object.fromEntries(Object.entries(profile.answers||{}).filter(([id,value])=>n400Bank.questions.some(q=>q.id===id)&&typeof value==='string'&&value.length<=1000)),flags:profile.flags||{}},learningProfile:{weakN400ConceptIds:Array.isArray(data.learningProfile?.weakN400ConceptIds)?data.learningProfile.weakN400ConceptIds.filter(x=>typeof x==='string'):[],recentN400Mistakes:[]}};}}catch{/* Narrative context is not a confirmed profile. */}}
  const selection=selectNextN400Question(bank,createN400InterviewState(bank,{},context));
  return {module:settings.module,bank,...selection,followUpQueue:[],clarified:[],statements:[],revision:0};
}
export const uncertainAnswer=answer=>isUncertain(answer)||/\b(unsure|uncertain|maybe|quiz[aá]s|tal vez|cannot remember|can.t remember|necesito revisar|need to (check|review))\b/i.test(answer);
export function recordDomainTurn(flow,answer){
  const next=structuredClone(flow),q=next.question;
  if(!q)throw Error('INTERVIEW_COMPLETE');
  const uncertain=uncertainAnswer(answer);
  const unparsed=q.answerType==='yes_no'&&parseYesNo(answer)===null;
  // Uncertainty remains a quotation, never a profile fact. Do not commit an
  // unparsed yes/no as false; use the original skip contract instead.
  const fact=uncertain||unparsed?'':answer;
  next.state=q.kind==='followup'?recordN400FollowUpAnswer(next.state,q,fact):recordN400Answer(next.state,q,fact);
  next.statements.push({questionId:q.id,topic:q.block,text:answer,uncertain});
  return {next,question:q,answer,uncertain,unparsed};
}
export function advanceDomainTurn(recorded,evaluation){
  const {next,question:q,answer,uncertain,unparsed}=recorded;
  const result=normalizeEvaluation(evaluation);
  if(uncertain)result.status='uncertain';
  else if(unparsed||evaluation.consistency_status==='possible_discrepancy')result.status='needs_clarification';
  const concept=q.conceptId||q.id;
  const canClarify=!uncertain&&!next.clarified.includes(concept)&&['incomplete','ambiguous','needs_clarification'].includes(result.status);
  if(q.kind!=='followup'&&!uncertain&&!unparsed){
    next.followUpQueue=getContextualN400FollowUps(q,answer,next.state.applicantProfile).map((text,i)=>createN400FollowUpPrompt(q,text,i+1,next.state.applicantProfile));
  }
  const clarification=evaluation.suggested_follow_up?.trim()&&(evaluation.suggested_follow_up.match(/\?/g)||[]).length===1?evaluation.suggested_follow_up:q.english;
  if(canClarify){
    next.clarified.push(concept);
    // A clarification has its own follow-up ID; bank follow-ups remain queued.
    next.question=unparsed?{...q,english:clarification}:createN400FollowUpPrompt(q,clarification,99,next.state.applicantProfile);
  }else if(next.followUpQueue.length){next.question=next.followUpQueue.shift();}
  else {Object.assign(next,selectNextN400Question(next.bank,next.state));}
  next.revision++;
  return {flow:next,result,reviewed:q};
}
export function domainIntervention(flow,locale,feedback=''){
  const question=flow.question?.english;
  return [feedback,question||(locale==='es'?'La práctica ha terminado. Puedes revisar tus respuestas.':'Practice is complete. You can review your answers.')].filter(Boolean).join(' ');
}
