import {buildAdvancedReport} from '../intelligence/advancedReport.mjs';
import {memoryFromReviewed} from '../intelligence/reviewedMemory.mjs';
import {featureFlags} from '../../../src/features.js';
import {extractStatements,findReviewCandidates} from './facts.mjs';
import {redactSensitive} from './privacy.mjs';
const messages={es:{uncertainty:'Se expresó incertidumbre. Es válido no recordar.',brief_answer:'Respuesta breve; puede ampliarse voluntariamente.',date_clarification:'Años distintos en una pregunta repetida y vinculada por ti. Aclara si describen eventos diferentes; no demuestra contradicción.'},en:{uncertainty:'Uncertainty was expressed. It is valid not to remember.',brief_answer:'Brief answer; may be expanded voluntarily.',date_clarification:'Different years for a repeated question linked by you. Clarify whether these describe different events; this does not establish a contradiction.'}};
export function buildVoiceReport(record,{redact=true}={}){
 if(record?.engine!=='residency'||record.reviewed!==true||!messages[record.locale])throw Error('Human review required');
 const statements=extractStatements(record.turns);if(!statements.length)throw Error('No answers');const safe=s=>redact?redactSensitive(s):s;
 const excerpts=statements.map(s=>({index:s.turnIndex,questionIndex:s.questionIndex,question:safe(s.question),text:safe(s.answer)}));
 const memory=featureFlags.residency_memory_enabled?memoryFromReviewed(record):null;
 return {advanced:memory?buildAdvancedReport(memory,{answered:statements.length}):null,claims:memory?.claims.map(c=>({...c,statement:safe(c.statement),questionId:c.questionId?safe(c.questionId):null}))||[],schemaVersion:3,engine:'residency',locale:record.locale,mode:record.mode,relationshipType:record.relationshipType,level:record.level,answered:statements.length,turnCount:record.turns.length,unlinked:statements.filter(s=>!s.question).length,redacted:redact,title:record.locale==='es'?'Informe educativo de voz':'Educational voice report',disclaimer:record.locale==='es'?'No evalúa credibilidad, fraude, elegibilidad ni aprobación. Solo considera los textos revisados; pueden faltar turnos o partes de audio.':'Does not assess credibility, fraud, eligibility or approval. Only reviewed text is considered; turns or audio segments may be missing.',excerpts,items:findReviewCandidates(statements).map(c=>({...c,explanation:messages[record.locale][c.kind],excerpts:c.evidence.map(i=>excerpts.find(e=>e.index===i))}))};
}
export function asPlainText(r){return [r.title,r.mode==='fictional'?'FICTICIO / FICTIONAL':'PERSONAL',r.disclaimer,`Respuestas / Answers: ${r.answered}`,`Sin pregunta vinculada / Unlinked: ${r.unlinked}`,...r.items.flatMap(i=>['',i.explanation,...i.excerpts.map(e=>`[T${e.index+1}] ${e.question}\n${e.text}`)]),'','TEXTOS REVISADOS / REVIEWED TEXT',...r.excerpts.map(e=>`[T${e.index+1}] ${e.question}\n${e.text}`)].join('\n');}
export function exportJson(r){return JSON.stringify(r,null,2)}
export function safeFilename(s){return String(s).replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,64)||'report'}
