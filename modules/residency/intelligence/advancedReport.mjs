import {reviewClaims} from './memory.mjs';
export function buildAdvancedReport(memory,{answered=0,sessionSeconds=0}={}){
 if(memory?.engine!=='residency')throw Error('Wrong engine');
 const observations=reviewClaims(memory);
 return {schemaVersion:1,engine:'residency',educationalOnly:true,answered,sessionSeconds,claimCount:memory.claims.length,observations:observations.map(x=>({topic:x.topic,kind:x.kind,claimIds:x.claimIds,explanation:x.explanation,verified:false})),recommendations:observations.map(x=>({topic:x.topic,es:'Practique cómo explicar a qué acontecimiento corresponde cada fecha.',en:'Practice explaining which event each date refers to.'})),disclaimer:'This is not a credibility assessment, fraud finding, legal opinion, or approval prediction.'};
}
export function exportReportJSON(report){if(report?.engine!=='residency')throw Error('Wrong engine');return JSON.stringify(report,null,2)}
