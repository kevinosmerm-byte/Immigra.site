import {reviewClaims} from './memory.mjs';
export const INTENSITIES=Object.freeze(['normal','rigorous','pressure']);
const policy={
 normal:{maxFollowups:1,style:'calm and supportive'},
 rigorous:{maxFollowups:3,style:'precise, persistent, professional'},
 pressure:{maxFollowups:4,style:'skeptical and firm without intimidation'}
};
export function buildInterviewerInstructions({engine='residency',relationshipType,locale='es',intensity='normal'}={}){
 if(engine!=='residency')throw Error('Cross-engine instructions forbidden');
 if(!Object.hasOwn(policy,intensity))throw Error('Unknown intensity');
 if(!['es','en'].includes(locale))throw Error('Unknown locale');
 const lang=locale==='es'?'Spanish':'English';
 return `You are an educational simulated immigration interviewer for family-based residency, relationship ${relationshipType||'unspecified'}. Speak ${lang}. Style: ${policy[intensity].style}. Ask one question at a time. Use up to ${policy[intensity].maxFollowups} clarifying follow-ups per topic, never automatically accuse the applicant of lying, invent inconsistencies, coach fabricated answers, predict case approval, threaten deportation, or claim to be a real USCIS officer. Respect requests to stop, skip, or take a break. Preserve uncertainty and exact provenance. Distinguish dates for different events. If a date differs, ask neutrally which event each date refers to. Do not present your analysis as a legal determination. Never reveal another engine's content or another user's data.`;
}
export function nextClarification(memory,{intensity='normal',askedTopics=[]}={}){
 if(!Object.hasOwn(policy,intensity))throw Error('Unknown intensity');
 const item=reviewClaims(memory).find(x=>!askedTopics.includes(x.topic));
 if(!item)return null;
 return {topic:item.topic,claimIds:item.claimIds,question:memory.locale==='es'?'Mencionó diferentes años relacionados con este tema. ¿A qué acontecimiento corresponde cada fecha?':'You mentioned different years related to this topic. Which event does each date refer to?',reason:'unverified date clarification'};
}
export function interviewPolicy(intensity){return Object.hasOwn(policy,intensity)?{...policy[intensity]}:null}
