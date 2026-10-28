// Service-role-only atomic quota reservation. No client-selected user or tier.
export async function reserveModuleQuota({userId,module,env=process.env,fetchImpl=fetch}){
 if(!['citizenship','asylum','residency'].includes(module)||!userId)throw Error('INVALID_SCOPE');
 if(!env.SUPABASE_URL||!env.SUPABASE_SECRET_KEY)throw Error('QUOTA_UNAVAILABLE');
 const response=await fetchImpl(env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/rpc/immigration_reserve_usage',{method:'POST',headers:{apikey:env.SUPABASE_SECRET_KEY,authorization:'Bearer '+env.SUPABASE_SECRET_KEY,'content-type':'application/json'},body:JSON.stringify({p_user_id:userId,p_module:module}),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('QUOTA_UNAVAILABLE');const result=await response.json();return result?.allowed===true;
}
export async function authorizeModule({userId,module,consent,reserve=reserveModuleQuota}){
 if(!userId)return {status:401,error:'AUTHENTICATION_REQUIRED'};
 if(consent!==true)return {status:400,error:'CONSENT_REQUIRED'};
 try{return await reserve({userId,module})?{status:200}:{status:429,error:'USAGE_LIMIT'};}catch{return {status:503,error:'QUOTA_UNAVAILABLE'};}
}
