// Server only. Never import this module from browser code.
import {validateLevel} from '../modules/residency/rigor/config.mjs';
import {rigorInstructions} from './rigor.mjs';
import questions from '../modules/residency/data/questions.json' with {type:'json'};
import scenarios from '../modules/residency/data/scenarios.json' with {type:'json'};
export const DEFAULT_MODEL='gpt-realtime';
const relations=new Set(questions.map(q=>q.relationship_type));
export function validateRequest(body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw Error('Invalid request');
 if(body.engine_id!=='residency'||!relations.has(body.relationshipType))throw Error('Invalid engine or relationship');
 if(!['es','en'].includes(body.locale)||!['personal','fictional'].includes(body.mode))throw Error('Invalid settings');
 if(body.consent!==true)throw Error('Invalid consent');
 const scenarioId=body.scenarioId||null;
 const scenario=scenarioId?scenarios.find(s=>s.id===scenarioId):null;
 if(scenarioId&&(!scenario||scenario.relationship_type!==body.relationshipType||body.mode!=='fictional'))throw Error('Invalid scenario');
 return {engine_id:'residency',relationshipType:body.relationshipType,locale:body.locale,mode:body.mode,scenarioId,consent:true,level:validateLevel(body.level===undefined?'normal':body.level)};
}
export function buildInstructions(input){
 const scenario=scenarios.find(s=>s.id===input.scenarioId);
 return `You are Sahara, an AI educational interview practice facilitator. Engine: residency ONLY. You are not a government officer or lawyer. Use a feminine voice and the selected interview style in ${input.locale==='es'?'Spanish':'English'}. Relationship: ${input.relationshipType}.
Mode: ${input.mode}. ${input.mode==='fictional'?`All practice is FICTIONAL; never treat it as the user's biography. Scenario context: ${scenario?.title_en||'No specific scenario'}. This is context, not a complete profile; do not invent missing facts. Allow the user to say the case does not specify.`:'Ask only about facts the user chooses to share; never invent their history.'}
Ask ONE concise question per turn, then listen. Start with a brief educational introduction and a relationship question. Use neutral open-ended clarification when needed. Different dates may describe different events; never label dishonesty, fraud, credibility, eligibility or likelihood of approval. Do not coach fabrication, suggest facts or provide legal advice. Do not request full names, A-numbers, passport numbers, SSNs or exact addresses. Never switch to asylum or citizenship content. Keep responses brief and respectful. If audio is unclear, ask to repeat. Do not claim the video is lip-synchronized or that you are a real person.
${rigorInstructions(input.level)}
If the user does not remember, accept uncertainty without repeating demands for exact dates. If they request less intensity, immediately use normal supportive practice. Questions about cohabitation or shared finances apply only when relevant to the configured relationship; never assume spouses in parent/child cases.`;
}
export async function createClientSecret(body,{apiKey=process.env.OPENAI_API_KEY,fetchImpl=fetch}={}){
 const input=validateRequest(body);if(!apiKey||apiKey==='replace_with_server_only_key')throw Error('Gateway not configured');
 const request={expires_after:{anchor:'created_at',seconds:60},session:{type:'realtime',model:DEFAULT_MODEL,instructions:buildInstructions(input),output_modalities:['audio'],max_output_tokens:300,audio:{input:{transcription:{model:'gpt-4o-mini-transcribe',language:input.locale},turn_detection:{type:'server_vad',create_response:true,interrupt_response:true}},output:{voice:'marin'}}}};
 let response;try{response=await fetchImpl('https://api.openai.com/v1/realtime/client_secrets',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(15000)});}catch{throw Error('Provider unavailable');}
 if(!response.ok)throw Error('Provider unavailable');
 const payload=await response.json().catch(()=>({}));
 if(typeof payload.value!=='string'||!payload.value.startsWith('ek_'))throw Error('Unexpected provider response');
 return {client_secret:payload.value,expires_at:payload.expires_at,model:DEFAULT_MODEL,voice:'marin',max_duration_seconds:600};
}
