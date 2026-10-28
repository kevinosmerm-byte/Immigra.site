import {cleanText} from '../analysis/transcript.mjs';
export const TOPICS=Object.freeze(['wedding','relationship','household','travel','finance','family','history','identity','immigration','contact','documents','support','routine']);
export function createMemory({engine='residency',sessionId='local',locale='es'}={}){
 if(engine!=='residency')throw Error('Engine isolation: residency only');
 if(!['es','en'].includes(locale))throw Error('Unsupported locale');
 return {engine,sessionId,locale,claims:[],questions:[],createdAt:new Date().toISOString()};
}
export function recordClaim(memory,{topic,statement,source='applicant',certainty='stated',questionId=null,turnIndex=null}={}){
 if(memory?.engine!=='residency')throw Error('Engine mismatch');
 if(!TOPICS.includes(topic))throw Error('Unknown topic');
 if(!['applicant','document','fictional'].includes(source))throw Error('Unknown source');
 if(!['stated','approximate','uncertain','unverified'].includes(certainty))throw Error('Unknown certainty');
 const text=cleanText(statement);
 if(!text)return memory;
 if(memory.claims.length>=300)throw Error('Memory capacity reached');
 return {...memory,claims:[...memory.claims,{id:`claim-${memory.claims.length+1}`,topic,statement:text,source,certainty,questionId,turnIndex}]};
}
export function reviewClaims(memory){
 if(memory?.engine!=='residency')throw Error('Engine mismatch');
 const grouped=new Map();
 for(const claim of memory.claims){
  const years=[...claim.statement.matchAll(/\b(?:19|20)\d{2}\b/g)].map(x=>x[0]);
  if(!claim.questionId||years.length!==1||claim.certainty==='uncertain'||claim.source==='fictional')continue;
  const key=JSON.stringify([claim.topic,claim.source,claim.questionId]);
  if(!grouped.has(key))grouped.set(key,[]);
  grouped.get(key).push({...claim,year:years[0]});
 }
 return [...grouped.entries()].flatMap(([topic,items])=>{
  const years=new Set(items.map(x=>x.year));
  if(years.size<2)return [];
  return [{topic:items[0].topic,kind:'possible_timeline_clarification',confidence:'low',claimIds:items.map(x=>x.id),years:[...years],explanation:'Different years were mentioned for the same explicitly linked question. They may refer to different events; do not infer deception.'}];
 });
}
export function clearMemory(memory){if(memory?.engine!=='residency')throw Error('Engine mismatch');return createMemory({sessionId:memory.sessionId,locale:memory.locale})}
