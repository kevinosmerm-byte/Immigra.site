import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';

export const EMAIL_TRIAL_TOKEN='immigra-email-trial-v1';
const COOKIE='__Host-immigra_email_trial';
const COOKIE_SECONDS=90*86400;
const validId=id=>/^[0-9a-f-]{36}$/i.test(id||'');
export function createEmailTrialService({admin,secret,now=Date.now}){
 const sign=value=>createHmac('sha256',secret).update('immigra-email-trial-v1:'+value).digest('hex');
 function cookie(req){
  const bearer=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  const value=bearer.startsWith(EMAIL_TRIAL_TOKEN+'.')?bearer.slice(EMAIL_TRIAL_TOKEN.length+1):(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';
  const [id,expires,signature]=value.split('.');
  if(!validId(id)||!/^\d{13}$/.test(expires||'')||!(/^[a-f0-9]{64}$/).test(signature||'')||Number(expires)<=now())return null;
  return timingSafeEqual(Buffer.from(sign(id+'.'+expires)),Buffer.from(signature))?id:null;
 }
 async function user(req){
  const id=cookie(req);if(!id)return null;
  const {data,error}=await admin.getUserById(id);
  if(error||!data?.user||data.user.app_metadata?.immigra_email_trial!==true||data.user.email_confirmed_at)return null;
  return data.user;
 }
 function session(owner,{native=false}={}){const value=owner?owner.id+'.'+(now()+COOKIE_SECONDS*1000):'';return owner?{access_token:native?EMAIL_TRIAL_TOKEN+'.'+value+'.'+sign(value):EMAIL_TRIAL_TOKEN,isEmailTrial:true,user:{id:owner.id,email:owner.email,app_metadata:{immigra_email_trial:true}}}:null;}
 const clear=res=>res.setHeader('Set-Cookie',`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
 async function register(req,res,email){
  const normalized=typeof email==='string'?email.trim().toLowerCase():'';
  if(normalized.length>254||!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(normalized))throw Object.assign(Error('Enter a valid email address.'),{code:'invalid_email',status:400});
  const current=await user(req);
  if(current?.email?.toLowerCase()===normalized)return session(current,{native:req.headers['x-immigra-client']==='native'});
  const {data,error}=await admin.createUser({email:normalized,password:randomBytes(48).toString('base64url'),email_confirm:false,app_metadata:{immigra_email_trial:true}});
  if(error||!validId(data?.user?.id)){
   const duplicate=['email_exists','user_already_exists','email_address_not_authorized'].includes(error?.code)||/already.*registered|already.*exists/i.test(error?.message||'');
   throw Object.assign(Error(duplicate?'Use a secure sign-in link for this email.':'Email trial is temporarily unavailable.'),{code:duplicate?'verification_required':'trial_unavailable',status:duplicate?409:503});
  }
  const value=data.user.id+'.'+(now()+COOKIE_SECONDS*1000);
  res.setHeader('Set-Cookie',`${COOKIE}=${value}.${sign(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_SECONDS}`);
  return session(data.user,{native:req.headers['x-immigra-client']==='native'});
 }
 return {user,session,register,clear};
}
