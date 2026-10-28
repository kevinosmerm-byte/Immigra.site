import {clarificationIsGrounded} from './interview-feedback.mjs';
import supplemental from '../../shared/interview-ui/supplemental-questions.json' with {type:'json'};
import {n400PracticeBank} from '../../shared/interview-ui/n400-language.mjs';
// Domain adapters retain CitizenshipAI recording. Family/asylum scheduling
// rotates topics. Data lives in one session.
import {readFileSync} from 'node:fs';
import n400Bank from '../../modules/citizenship/src/data/n400InterviewBank.json' with {type:'json'};
import {createN400InterviewState,selectNextN400Question,recordN400Answer,recordN400FollowUpAnswer,getContextualN400FollowUps,createN400FollowUpPrompt,parseYesNo} from '../../modules/citizenship/src/n400InterviewEngine.js';
import {selectAosQuestions,isUncertain,aosQuestion} from '../../modules/residency/src/aosEngine.mjs';
import {normalizeEvaluation} from '../../shared/interview-ui/evaluation-result.mjs';

const asylumBank=readFileSync(new URL('../../modules/asylum/master-package/03_question_bank/question_bank.jsonl',import.meta.url),'utf8').trim().split(/\r?\n/).map(line=>JSON.parse(line));
// Reviewed standalone prompts. Other original entries are contextual follow-ups,
// duplicate formulations, or templates requiring facts not supplied by the user.
// They remain in the study bank, but are not independent automatic-call turns.
const asylumStandalone=new Set([1,2,3,4,5,7,8,9,10,13,17,18,20,39,44,49,50,56,57,59,60,62,63,67,74,79,90,91,98,99,100,101].map(n=>'Q'+String(n).padStart(4,'0')));
const architecture=questions=>{
  const blockOrder=[...new Set(questions.map(q=>q.block))];
  return {questions,interviewArchitecture:{blockOrder,subBlockOrder:Object.fromEntries(blockOrder.map(b=>[b,[...new Set(questions.filter(q=>q.block===b).map(q=>q.subBlock))]])),transitionScripts:{}}};
};
export function domainBank(settings){
  if(settings.module==='citizenship')return n400PracticeBank(n400Bank,settings.locale);
  if(settings.module==='residency')return architecture(selectAosQuestions({route:settings.route,...(settings.practiceOptions||{count:12}),random:()=>0.5}).map(q=>({id:q.id,concept:q.id,block:q.dificultad,subBlock:q.bloque,canonicalPracticePrompt:aosQuestion(q,settings.locale),answerType:'text',followUps:[],sourceRefs:[q.fuente]})));
  const general=architecture([...asylumBank,...supplemental.asylum].filter(q=>q.uscis_enabled===1&&q.question_type==='neutral_factual'&&(asylumStandalone.has(q.id)||q.id.startsWith('AS-SUP-'))).map(q=>({id:q.id,concept:q.id,block:q.category,subBlock:q.subcategory,canonicalPracticePrompt:settings.locale==='es'?q.question_es:q.question_en,answerType:'text',followUps:[],sourceRefs:q.source?[q.source]:[]})));
  return architecture([...(settings.sourceQuestions||[]),...general.questions]);
}
// Rotate least-recently used topics instead of exhausting a whole block. Residency
// retains the selected family route and easy -> moderate -> difficult progression.
function selectDomainQuestion(flow){
  if(flow.module==='citizenship')return selectNextN400Question(flow.bank,flow.state);
  let candidates=flow.bank.questions.filter(q=>!flow.state.askedConceptIDs.includes(q.concept||q.id));
  if(flow.module==='residency'&&candidates.length){
    const level=flow.bank.interviewArchitecture.blockOrder.find(b=>candidates.some(q=>q.block===b));
    candidates=candidates.filter(q=>q.block===level);
  }
  const topic=q=>flow.module==='asylum'?q.block:q.subBlock;
  const history=flow.state.askedConceptIDs.map(id=>flow.bank.questions.find(q=>(q.concept||q.id)===id)).filter(Boolean).map(topic);
  candidates.sort((a,b)=>history.lastIndexOf(topic(a))-history.lastIndexOf(topic(b)));
  const chosen=candidates[0];
  if(!chosen)return {state:{...flow.state,complete:true},question:null,transition:''};
  return selectNextN400Question(flow.bank,{...flow.state,complete:false,currentBlock:chosen.block,currentSubBlock:chosen.subBlock});
}
const words=text=>new Set(String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[a-z0-9]+/g)||[]);
function distinctClarification(text,question){
  if(!text||(text.match(/\?/g)||[]).length!==1)return false;
  const a=words(text),b=words(question);
  const common=[...a].filter(w=>b.has(w)).length;
  return common/Math.max(1,Math.min(a.size,b.size))<0.7;
}
export function createDomainInterview(settings,{random=Math.random}={}){
  const bank=domainBank(settings);
  if(settings.module==='asylum'&&!settings.sourceQuestions?.length&&settings.initialQuestion){const first=bank.questions.find(q=>q.canonicalPracticePrompt===settings.initialQuestion);if(first){bank.questions=[first,...bank.questions.filter(q=>q!==first)];bank.interviewArchitecture.blockOrder=[first.block,...bank.interviewArchitecture.blockOrder.filter(b=>b!==first.block)];}}
  // Only the optional, displayed and explicitly shared context may seed N-400.
  let context={};
  if(settings.module==='citizenship'&&settings.context){try{const data=JSON.parse(settings.context);if(data&&typeof data==='object'){const profile=data.n400Profile||{};context={n400Profile:{answers:Object.fromEntries(Object.entries(profile.answers||{}).filter(([id,value])=>n400Bank.questions.some(q=>q.id===id)&&typeof value==='string'&&value.length<=1000)),flags:profile.flags||{}},learningProfile:{weakN400ConceptIds:Array.isArray(data.learningProfile?.weakN400ConceptIds)?data.learningProfile.weakN400ConceptIds.filter(x=>typeof x==='string'):[],recentN400Mistakes:[]}};}}catch{/* Narrative context is not a confirmed profile. */}}
  const state=createN400InterviewState(bank,{},context);
  const known=new Set(bank.questions.filter(q=>!(settings.sourceQuestions||[]).some(source=>source.id===q.id)).map(q=>q.concept||q.id));
  state.askedConceptIDs=(settings.reviewedQuestionIds||[]).filter(id=>known.has(id));
  const order=bank.questions.map(q=>q.id);
  for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  state.practiceQuestionOrder=order;
  let selection=selectDomainQuestion({module:settings.module,bank,state});
  if(!selection.question){state.askedConceptIDs=[];state.complete=false;selection=selectDomainQuestion({module:settings.module,bank,state});}
  return {module:settings.module,locale:settings.locale||'en',bank,...selection,followUpQueue:[],clarified:[],statements:[],revision:0};
}
// Only a wholly uncertain response takes the fixed acceptance path. A qualifier
// inside a substantive narrative must not erase the facts the learner did state.
export const uncertainAnswer=answer=>/^(?:(?:sorry|lo siento)[, ]+)?(?:(?:i (?:am |do )?)?(?:don['’]t|do not|cannot|can['’]t) remember(?: (?:it|that|the (?:date|day|year)))?|(?:i am |i['’]m |i )?(?:not sure|unsure|uncertain)|(?:i )?(?:don['’]t|do not) know|no recuerdo(?: (?:eso|la fecha|el d[ií]a|el a[nñ]o))?|no estoy segur[oa]|no s[eé]|(?:i )?need to (?:check|review)(?: my documents)?|necesito revisar(?: mis documentos)?|maybe|perhaps|quiz[aá]s|tal vez)[.!? ]*$/i.test(String(answer).trim());
export const hasUncertainty=answer=>uncertainAnswer(answer)||isUncertain(answer)||/\b(unsure|uncertain|maybe|perhaps|quiz[aá]s|tal vez|don['’]t (?:remember|know|recall)|can['’]t (?:remember|recall))\b/i.test(answer);
export function recordDomainTurn(flow,answer){
  const next=structuredClone(flow),q=next.question;
  if(!q)throw Error('INTERVIEW_COMPLETE');
  const uncertain=uncertainAnswer(answer);
  const unparsed=q.answerType==='yes_no'&&parseYesNo(answer)===null;
  // Uncertainty remains a quotation, never a profile fact. Do not commit an
  // unparsed yes/no as false; use the original skip contract instead.
  const fact=hasUncertainty(answer)||unparsed?'':answer;
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
  let canClarify=!uncertain&&!next.clarified.includes(concept)&&['incomplete','ambiguous','needs_clarification'].includes(result.status);
  if(q.kind!=='followup'&&!uncertain&&!unparsed){
    next.followUpQueue=getContextualN400FollowUps(q,answer,next.state.applicantProfile).map((text,i)=>createN400FollowUpPrompt(q,text,i+1,next.state.applicantProfile));
  }
  const grounded=clarificationIsGrounded(evaluation,answer,next);
  const clarification=grounded?evaluation.suggested_follow_up:q.english;
  if(next.module==='citizenship')canClarify=canClarify&&(unparsed||grounded);
  if(next.module!=='citizenship'){
    // One grounded clarification per main concept; never chase a follow-up with
    // another follow-up or force a discrepancy just to explore an ambiguity.
    canClarify=canClarify&&q.kind!=='followup'
      &&evaluation.next_action==='clarify'
      &&grounded
      &&distinctClarification(evaluation.suggested_follow_up?.trim(),q.english);
    if(evaluation.consistency_status==='possible_discrepancy')canClarify=canClarify&&next.revision-(next.lastClarificationRevision??-3)>=3;
    if(canClarify)next.lastClarificationRevision=next.revision;
  }
  if(canClarify){
    next.clarified.push(concept);
    // A clarification has its own follow-up ID; bank follow-ups remain queued.
    next.question=unparsed?{...q,english:clarification}:createN400FollowUpPrompt(q,clarification,99,next.state.applicantProfile);
  }else if(next.followUpQueue.length){next.question=next.followUpQueue.shift();}
  else {Object.assign(next,selectDomainQuestion(next));}
  next.revision++;
  return {flow:next,result,reviewed:q};
}
export function domainIntervention(flow,locale,feedback=''){
  const question=flow.question?.english;
  return [feedback,question||(locale==='es'?'La práctica ha terminado. Puedes revisar tus respuestas.':'Practice is complete. You can review your answers.')].filter(Boolean).join(' ');
}

export function skipDomainQuestion(flow){
 const next=structuredClone(flow),q=next.question;
 if(!q)throw Error('INTERVIEW_COMPLETE');
 next.state=q.kind==='followup'?recordN400FollowUpAnswer(next.state,q,''):recordN400Answer(next.state,q,'');
 next.followUpQueue=[];
 Object.assign(next,selectDomainQuestion(next));next.revision++;
 return next;
}
