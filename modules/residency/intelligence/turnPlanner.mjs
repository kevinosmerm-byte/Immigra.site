import {reviewClaims} from './memory.mjs';
import {interviewPolicy} from './interviewer.mjs';
export function planNextTurn({memory,priorQuestionIds=[],maxFollowups=3,followupsUsed=0,level='normal'}={}){
 if(memory?.engine!=='residency')throw Error('Wrong engine');
 if(!['normal','rigorous','pressure'].includes(level))throw Error('Invalid level');
 if(!Number.isInteger(maxFollowups)||maxFollowups<0||!Number.isInteger(followupsUsed)||followupsUsed<0)throw Error('Invalid followup limit');
 if(followupsUsed>=Math.min(maxFollowups,interviewPolicy(level).maxFollowups))return {action:'advance',reason:'followup_limit'};
 const finding=reviewClaims(memory).find(f=>!priorQuestionIds.includes('clarify:'+f.topic));
 if(finding)return {action:'clarify',questionId:'clarify:'+finding.topic,sourceClaimIds:finding.claimIds,question:memory.locale==='es'?'¿Puede aclarar a qué acontecimiento corresponde cada año mencionado?':'Could you clarify which event each year refers to?',verified:false};
 return {action:'advance',reason:'no_grounded_clarification'};
}
export function realtimeInstructionsForPlan(plan){return plan.action==='clarify'?`Ask one neutral clarification question: ${plan.question}. Do not assert any inconsistency, deception or fraud.`:'Move to a new topic; ask one question at a time.'}
