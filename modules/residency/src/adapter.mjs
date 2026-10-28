import questions from '../data/questions.json' with {type:'json'};
import scenarios from '../data/scenarios.json' with {type:'json'};
import {createSession,addTurn,selectQuestions,relationships} from './engine.mjs';
import {neutralReview} from './consistency.mjs';
export {relationships};
export const scenarioList=scenarios;
const byId=new Map(questions.map(q=>[q.id,q]));
const key=id=>id.replace(/-(es|en)$/,'');
const copy=value=>structuredClone(value);
export function createLocalAdapter(){
 const sessions=new Map();
 function get(id){const s=sessions.get(id);if(!s||s.engine_id!=='residency')throw Error('Session unavailable');return s;}
 function snapshot(s){const {observations,pendingReview,...visible}=s;return copy(visible);}
 function enterReview(s){
  // Only the answers in this session are inspected. A category is not a single event:
  // differing years request context, never establish a contradiction.
  s.pendingReview=neutralReview(s.turns,byId).slice(0,2);
  s.phase=s.pendingReview.length?'clarification':'done';s.finished=!s.pendingReview.length;
 }
 return {
  start({relationshipType,locale='es',mode='fictional',scenarioId=null,count=12,consent=false}){
   if(!consent)throw Error('Consent required');
   if(mode==='personal'&&scenarioId)throw Error('Personal mode cannot include a fictional scenario');
   const raw=createSession({relationshipType,locale,mode,scenarioId});
   const chosen=selectQuestions({relationshipType,locale:'es',count,seed:1});
   const id=crypto.randomUUID();
   sessions.set(id,{...raw,id,questionKeys:chosen.map(q=>key(q.id)),index:0,responses:[],followups:[],pendingReview:[],phase:'questions',finished:false,consentVersion:'local-residency-v1'});
   return id;
  },
  read(id){return snapshot(get(id));},
  question(id,locale){
   const s=get(id);if(!['es','en'].includes(locale))throw Error('Invalid locale');if(s.finished)return null;
   if(s.phase==='clarification'){const review=s.pendingReview[0];return {id:'clarification-'+review.topic,question:review['prompt_'+locale],locale,kind:'clarification',number:s.followups.length+1,total:s.followups.length+s.pendingReview.length};}
   const q=byId.get(s.questionKeys[s.index]+'-'+locale);if(!q||q.engine_id!==s.engine_id||q.relationship_type!==s.relationshipType)throw Error('Question mismatch');return copy(q);
  },
  respond(id,{questionId,text='',skip=false,clarification='',locale}){
   const s=get(id);if(s.finished)throw Error('Session finished');
   if(typeof text!=='string'||text.length>5000||typeof clarification!=='string'||clarification.length>5000||(!skip&&!text.trim()))throw Error('Invalid response');
   if(s.phase==='clarification'){
    const review=s.pendingReview[0];
    if(questionId!=='clarification-'+review.topic||!['es','en'].includes(locale))throw Error('Clarification mismatch');
    const prompt=review['prompt_'+locale];
    addTurn(s,{speaker:'officer',text:prompt,questionId});
    if(!skip)addTurn(s,{speaker:'applicant',text:text.trim(),questionId});
    s.followups.push({questionId,prompt_es:review.prompt_es,prompt_en:review.prompt_en,locale,text:skip?'':text.trim(),skipped:skip});
    s.pendingReview.shift();
    if(!s.pendingReview.length){s.phase='done';s.finished=true;}
    return;
   }
   const q=byId.get(questionId);
   if(!q||q.engine_id!==s.engine_id||q.relationship_type!==s.relationshipType||key(q.id)!==s.questionKeys[s.index])throw Error('Question mismatch');
   addTurn(s,{speaker:'officer',text:q.question,questionId:q.id});
   if(!skip)addTurn(s,{speaker:'applicant',text:text.trim(),questionId:q.id});
   if(!skip&&clarification.trim())addTurn(s,{speaker:'applicant',text:clarification.trim(),questionId:q.id});
   s.responses.push({questionKey:key(q.id),question:q.question,category:q.category,locale:q.locale,text:skip?'':text.trim(),clarification:skip?'':clarification.trim(),skipped:skip});
   s.index++;if(s.index===s.questionKeys.length)enterReview(s);
  },
  finish(id){const s=get(id);s.pendingReview.length=0;s.phase='done';s.finished=true;},
  summary(id){const s=get(id);return {answered:s.responses.filter(r=>!r.skipped).length,skipped:s.responses.filter(r=>r.skipped).length,remaining:s.questionKeys.length-s.responses.length,responses:copy(s.responses),followups:copy(s.followups),clarificationsAnswered:s.followups.filter(r=>!r.skipped).length,reviewTopics:[...new Set(s.responses.filter(r=>r.skipped).map(r=>r.category))],legalAdvice:false};},
  export(id){return snapshot(get(id));},
  delete(id){const s=get(id);for(const field of ['turns','responses','observations','questionKeys','followups','pendingReview'])s[field].length=0;sessions.delete(id);},
  clear(){for(const id of [...sessions.keys()])this.delete(id);}
 };
}
export function translatedQuestion(questionKey,locale){return byId.get(questionKey+'-'+locale)?.question||'';}
