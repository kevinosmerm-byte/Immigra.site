import {app as citizenship} from '../../modules/citizenship/server/server.js';
import {requireAccount,getUsageSnapshot} from '../../modules/citizenship/server/accountService.js';
import {createPlatformRouter} from './router.mjs';
async function reserveAsylumQuota(userId){
 const response=await fetch(process.env.SUPABASE_URL+'/rest/v1/rpc/consume_api_rate_limit',{
  method:'POST',signal:AbortSignal.timeout(10000),headers:{apikey:process.env.SUPABASE_SECRET_KEY,'content-type':'application/json'},
  body:JSON.stringify({p_bucket:'asylum-analysis',p_subject_hash:userId,p_limit:2,p_window_seconds:86400})
 });
 if(!response.ok)throw new Error('QUOTA_UNAVAILABLE');
 const result=await response.json();return result.allowed===true;
}
export const app=createPlatformRouter({citizenship,requireAccount,getUsageSnapshot,reserveAsylumQuota,env:{...process.env,OPENAI_TEXT_MODEL:process.env.OPENAI_TEXT_MODEL||'gpt-4o-mini'}});
