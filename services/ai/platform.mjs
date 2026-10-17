import {createPracticeAccess} from './practice-access.mjs';
import {createHash} from 'node:crypto';
import {app as citizenship} from '../../modules/citizenship/server/server.js';
import {requireAccount,getUsageSnapshot,consumeDistributedRateLimit,getPracticeAccess,startAiSession,finishAiSession,reserveGuestDemo} from '../../modules/citizenship/server/accountService.js';
import {createPlatformRouter} from './router.mjs';
async function reserveAsylumQuota(userId,bucket="asylum-analysis",limit=120,windowSeconds=60){
 try{
  const result=await consumeDistributedRateLimit({bucket,subjectHash:createHash('sha256').update(userId).digest('hex'),limit,windowSeconds});
  if(!result)throw Error('missing quota');
  return result.allowed===true;
 }catch(error){
  // Only database error codes; never error messages, subjects or database content.
  const code=error?.cause?.code;
  console.error('[interview-quota]',JSON.stringify({code:['PGRST202','42501','P0001','42P01','PGRST301'].includes(code)?code:'QUOTA_UNAVAILABLE'}));
  throw Error('QUOTA_UNAVAILABLE');
 }
}
async function reserveInterviewAccess(id,bucket,limit,globalLimit){
 return reserveAsylumQuota(id, bucket+'-burst', 120, 60);
}
export const app=createPlatformRouter({reserveGuestDemo,limitDemo:async(bucket,subjectHash,limit,windowSeconds)=>{const r=await consumeDistributedRateLimit({bucket,subjectHash,limit,windowSeconds});if(!r)throw Error('quota');return r.allowed===true;},citizenship,requireAccount,requirePractice:createPracticeAccess({getPracticeAccess,startAiSession,finishAiSession}),getUsageSnapshot,reserveAsylumQuota,reserveConversationQuota:id=>reserveInterviewAccess(id,'interview-conversation',3,100),reserveInterviewQuota:id=>reserveInterviewAccess(id,'interview-feedback',30,1000),reserveAudioQuota:id=>reserveInterviewAccess(id,'asylum-transcription',30,1000),env:{...process.env,OPENAI_TEXT_MODEL:process.env.OPENAI_TEXT_MODEL||'gpt-4o-mini'}});
