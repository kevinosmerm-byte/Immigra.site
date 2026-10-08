import {validateLevel} from '../rigor/config.mjs';
export const MAX_TURNS=150,MAX_TEXT=4000,MAX_CHARS=200000;
export function cleanText(value){return String(value??'').normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,MAX_TEXT)}
export function createTranscript({engine='residency',locale='es',relationshipType,level='normal',mode='fictional',scenarioId=null}={}){
 if(engine!=='residency'||!['es','en'].includes(locale)||!['personal','fictional'].includes(mode))throw Error('Invalid residency settings');validateLevel(level);
 return {schemaVersion:3,engine,locale,relationshipType,level,mode,scenarioId,turns:[],createdAt:new Date().toISOString(),reviewed:false};
}
export function appendTurn(record,{speaker,text,source='voice',eventId=null}={}){
 if(record?.engine!=='residency'||!Array.isArray(record.turns))throw Error('Invalid session');
 if(!['officer','applicant'].includes(speaker)||!['voice','text','import'].includes(source))throw Error('Invalid turn');
 const value=cleanText(text);if(!value)return record;
 if(eventId&&record.turns.some(t=>t.eventId===eventId&&t.speaker===speaker))return record;
 if(record.turns.length>=MAX_TURNS||record.turns.reduce((n,t)=>n+t.text.length,0)+value.length>MAX_CHARS)throw Error('Transcript limit reached');
 return {...record,reviewed:false,turns:[...record.turns,{index:record.turns.length,speaker,text:value,source,eventId,questionIndex:null,excluded:false}]};
}
export function transcriptFromCaptions(captions,options){let r=createTranscript(options);for(const c of captions){if(!['user','ai','applicant','officer'].includes(c?.who))continue;r=appendTurn(r,{speaker:['user','applicant'].includes(c.who)?'applicant':'officer',text:c.text,source:'import',eventId:c.id||null});}return r;}
export function confirmTranscript(record){
 if(record?.engine!=='residency'||!record.turns.some(t=>t.speaker==='applicant'&&!t.excluded&&t.text.trim()))throw Error('No available answers');
 for(const t of record.turns)if(t.speaker==='applicant'&&!t.excluded&&t.questionIndex!==null&&!record.turns.some(q=>q.index===t.questionIndex&&q.speaker==='officer'&&!q.excluded&&q.text.trim()))throw Error('Invalid question link');
 return {...structuredClone(record),reviewed:true};
}
