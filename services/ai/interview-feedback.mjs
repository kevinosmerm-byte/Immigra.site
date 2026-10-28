import bank from './clarification-bank.json' with {type:'json'};
// Conservative lexical admission, not a semantic fact/credibility check. The
// evaluator must still match each condition to the CURRENT answer and evidence.
const admits={
 'ASY-004':/\b(ocurri[oó]|sucedi[oó]|pas[oó]|happened|occurred)\b/i,
 'ASY-005':/\b(me dijeron|me contaron|supe|heard|told me|learned)\b/i,
 'RES-004':/\b(me mud[eé]|nos mudamos|i moved|we moved)\b/i,
 'RES-006':/\b(trabajo|actividad|work|activity)\b/i,
 'RES-008':/\b(viaj[eé]|viajamos|i traveled|i travelled|we traveled|we travelled)\b/i,
 'RES-009':/\b(persona|person|alguien|someone)\b/i,
 'CIT-005':/^(no entiendo|no entend[ií]|i don.t understand|i didn.t understand|what do you mean|qu[eé] significa)\b/i,
 'CIT-006':/\S/,
 'CIT-007':/\b(trabaj[eé]|trabajaba|i worked|my job|mi trabajo)\b/i,
 'CIT-010':/\b(viaj[eé]|viajamos|i traveled|i travelled|we traveled|we travelled)\b/i,
 'CIT-011':/\b(persona|person|alguien|someone)\b/i,
 'RES-016':/\b(quiero corregir|necesito corregir|i want to correct|i need to correct)\b/i,
 'CIT-016':/\b(quiero corregir|necesito corregir|i want to correct|i need to correct)\b/i
};
export const displayableQuotes=answer=>[answer,...(answer.match(/[^.!?\n]+[.!?]?/g)||[])].map(q=>q.trim()).filter(q=>q&&q.length<=240);
export function clarificationOptions(settings,answer){
 const module=settings.module==='citizenship'?'citizenship_personal':settings.module;
 // If negated/uncertain, avoid presupposing an event, trip, job or relationship.
 const qualified=/\b(no|not|never|nunca|maybe|perhaps|quiz[aá]s|tal vez|unsure|uncertain|don['’]t|can['’]t|cannot)\b/i.test(answer);
 return bank.questions.filter(q=>(q.module===module||q.id==='CIT-006'||q.id==='CIT-005')&&admits[q.id]?.test(answer)&&(q.id!=='CIT-006'||displayableQuotes(answer).length>0)&&(!qualified||['CIT-005','CIT-006','RES-016','CIT-016'].includes(q.id)))
  .map(q=>({id:q.id,text:q[settings.locale==='es'?'es':'en'],condition:q.required_context[0].requirement}));
}
export function currentEvidence(evaluation,answer){return (evaluation.evidence||[]).filter(q=>typeof q==='string'&&q.trim()&&answer.includes(q));}
export function interviewerAcknowledgment(evaluation,answer,locale){
 // Quotes are explicit user statements, not verified biography. Avoid chopping a
 // sentence and thereby dropping negation, uncertainty or an adverse detail.
 const quote=currentEvidence(evaluation,answer).find(q=>q.length<=240);
 if(!quote)return '';
 return locale==='es'?`Mencionaste: «${quote}».`:`You said: “${quote}”.`;
}
export function clarificationIsGrounded(evaluation,answer,settings){
 return Boolean(evaluation.suggested_follow_up&&currentEvidence(evaluation,answer).length
  &&clarificationOptions(settings,answer).some(q=>q.text===evaluation.suggested_follow_up&&(q.id!=='CIT-006'||currentEvidence(evaluation,answer).some(quote=>quote.length<=240))));
}
