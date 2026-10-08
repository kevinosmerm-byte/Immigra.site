import questions from '../data/questions.json' with {type:'json'};
import scenarios from '../data/scenarios.json' with {type:'json'};
export const ENGINE_ID='residency';
export const relationships=Object.freeze([...new Set(questions.map(q=>q.relationship_type))]);
export function selectQuestions({relationshipType,locale='es',count=15,seed=1}){
 if(!relationships.includes(relationshipType))throw new Error('Invalid relationship type');
 if(!['es','en'].includes(locale))throw new Error('Invalid locale');
 if(!Number.isInteger(count)||count<1)throw new Error('Invalid count');
 const pool=questions.filter(q=>q.engine_id===ENGINE_ID&&q.relationship_type===relationshipType&&q.locale===locale);
 const sorted=[...pool].sort((a,b)=>hash(a.id+seed)-hash(b.id+seed));
 return sorted.slice(0,count);
}
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export function getScenario(id){return scenarios.find(s=>s.id===id)||null}
export function createSession({relationshipType,locale='es',scenarioId=null,mode='personal'}){
 if(!relationships.includes(relationshipType))throw new Error('Invalid relationship type');
 if(!['es','en'].includes(locale))throw new Error('Invalid locale');
 if(!['personal','fictional'].includes(mode))throw new Error('Invalid mode');
 const scenario=scenarioId?getScenario(scenarioId):null;
 if(scenarioId&&(!scenario||scenario.relationship_type!==relationshipType||mode!=='fictional'))throw new Error('Scenario mismatch');
 return {engine_id:ENGINE_ID,relationshipType,locale,scenarioId,mode,turns:[],observations:[],createdAt:new Date().toISOString()};
}
export function addTurn(session,{speaker,text,questionId=null}){
 if(session.engine_id!==ENGINE_ID)throw new Error('Cross-engine session denied');
 if(!['officer','applicant'].includes(speaker)||typeof text!=='string'||text.length>5000)throw new Error('Invalid turn');
 session.turns.push({index:session.turns.length,speaker,text,questionId});return session;
}
export function summarize(session){if(session.engine_id!==ENGINE_ID)throw new Error('Cross-engine session denied');return {answered:session.turns.filter(t=>t.speaker==='applicant').length,reviewTopics:[...new Set(session.observations.map(x=>x.topic))],legalAdvice:false};}
