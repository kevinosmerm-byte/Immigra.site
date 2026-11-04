import prerequisites from './adaptive-prerequisites.json' with {type:'json'};
import {adaptiveDesign} from './reflection-bank.mjs';
const questions=new Map(adaptiveDesign.branches.flatMap(b=>b.questions).map(q=>[q.id,q]));
export const adaptiveCards=prerequisites.map(card=>({...card,...questions.get(card.id)}));
const supported=session=>session.transport==='text'||(session.transport==='voice'&&session.voiceAdaptiveControls===true);
export function offerAdaptive(session,reviewed,answer,result){
 session.adaptiveOffer=null;
 if(typeof answer!=='string'||!answer.trim())return;
 if(session.settings.module!=='asylum'||!supported(session)||reviewed.kind!=='concept'||session.flow.question?.kind==='followup'||result.status!=='adequate')return;
 const priorQuotes=(session.history||[]).map((entry,index)=>({...entry,id:`history:${index}`})).filter(entry=>entry.role==='user'&&entry.source!=='adaptive'&&entry.text?.trim()&&entry.text!==answer).slice(-6).map(entry=>({id:entry.id,quote:entry.text}));
 const options=adaptiveCards.filter(c=>c.enabled&&(!c.requiresPriorQuote||priorQuotes.length>0)&&!session.adaptiveUsed?.includes(c.id)&&!(c.impact&&session.impactClosed));
 if(!options.length)return;
 session.adaptiveOffer={id:`${session.flow.revision}:${reviewed.id}`,quote:answer,sourceQuestionId:reviewed.id,priorQuotes,options:options.map(c=>c.id)};
}
export function adaptiveView(session){return supported(session)&&session.settings.module==='asylum'?{baseImpact:session.flow.question?.kind==='impact_consent'?{id:session.flow.question.id,revision:session.flow.revision}:null,offer:session.adaptiveOffer||null,active:session.adaptiveActive?{id:session.adaptiveActive.card.id,impact:session.adaptiveActive.card.impact}:null}:null;}
export function adaptiveAction(session,action){
 if(session.settings.module!=='asylum'||!supported(session))throw Error('ADAPTIVE_DISABLED');
 if(!action||!['confirm','omit','correct','withdraw'].includes(action.type))throw Error('INVALID_ADAPTIVE_ACTION');
 if(action.type!=='confirm'){
  // Corrections invalidate every earlier confirmation. Nothing is inferred from edited prose.
  if(action.type==='withdraw')session.impactClosed=true;
  session.adaptiveOffer=null;
  if(session.adaptiveActive){session.flow.question=session.adaptiveActive.resume;session.adaptiveActive=null;}
  session.flow.revision++;
  return;
 }
 const offer=session.adaptiveOffer,card=adaptiveCards.find(c=>c.id===action.cardId);
 if(session.adaptiveActive||!offer||action.offerId!==offer.id||!card?.enabled||!offer.options.includes(card.id)||action.quote!==offer.quote||action.sourceKind!=='personal'||action.contextConfirmed!==true||!Array.isArray(action.confirmed)||card.requirements.some(r=>!action.confirmed.includes(r.id))||(card.impact&&(action.impactConsent!==true||session.impactClosed)))throw Error('ADAPTIVE_CONTEXT_REQUIRED');
 const prior=card.requiresPriorQuote?offer.priorQuotes.find(entry=>entry.id===action.priorQuoteId&&entry.quote===action.priorQuote):null;
 if(card.requiresPriorQuote&&(!prior||action.sameMatterConfirmed!==true))throw Error('ADAPTIVE_CONTEXT_REQUIRED');
 if(card.scenario&&(action.scenarioConsent!==true||action.scenarioVersion!==card.scenario.version))throw Error('ADAPTIVE_CONTEXT_REQUIRED');
 session.adaptiveUsed=[...(session.adaptiveUsed||[]),card.id];
 if(card.impact)session.impactClosed=true; // At most one impact question; no automatic renewed request.
 session.adaptiveActive={card,resume:session.flow.question,evidence:{quote:offer.quote,sourceQuestionId:offer.sourceQuestionId,confirmed:[...action.confirmed],...(prior?{priorQuote:prior.quote,priorQuoteId:prior.id,sameMatterConfirmed:true}:{}),...(card.scenario?{scenarioVersion:card.scenario.version,scenarioConsent:true}:{})}};
 session.adaptiveOffer=null;
 session.flow.question={id:card.id,kind:'adaptive',english:[card.scenario?.[session.settings.locale==='es'?'es':'en'],session.settings.locale==='es'?card.question_es:card.question_en].filter(Boolean).join(' ')};
 session.flow.revision++;
}
export function finishAdaptive(session){
 const reviewed=session.flow.question;
 session.flow.question=session.adaptiveActive.resume;session.adaptiveActive=null;session.adaptiveOffer=null;session.flow.revision++;
 return reviewed;
}
