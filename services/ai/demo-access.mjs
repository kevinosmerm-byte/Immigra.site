import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import {getAiFeatureConfig} from '../../modules/citizenship/shared/featureAccessConfig.js';
const COOKIE='__Host-immigra_demo';
const TTL=600000;
// Signed opaque browser identity; the lifetime two-use counter lives in the database.
export function createDemoAccess({secret,reserve,limit,now=Date.now}){
 const sign=s=>createHmac('sha256',secret).update('demo-v1:'+s).digest('hex');
 function read(req){
  if(!secret)return null;
  const raw=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';
  const [data,sig]=raw.split('.');
  if(!data||data.length>1200||!/^[a-zA-Z0-9_-]+$/.test(data)||!/^[a-f0-9]{64}$/.test(sig||''))return null;
  if(!timingSafeEqual(Buffer.from(sign(data)),Buffer.from(sig)))return null;
  try{const value=JSON.parse(Buffer.from(data,'base64url').toString());return /^[a-f0-9-]{36}$/.test(value.id)?value:null;}catch{return null;}
 }
 function write(res,value){const data=Buffer.from(JSON.stringify(value)).toString('base64url');res.setHeader('Set-Cookie',`${COOKIE}=${data}.${sign(data)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`);}
 const hash=id=>createHmac('sha256',secret).update('demo-subject:'+id).digest('hex');
 const deny=(res,status,reason)=>res.status(status).json({error:reason,code:reason});
 async function start(req,res){
  if(!secret||!reserve||!limit)return deny(res,503,'access_unavailable');
  const feature=req.body?.feature,requestId=req.body?.requestId;
  if(!getAiFeatureConfig(feature)||!/^[a-f0-9-]{36}$/i.test(requestId||''))return deny(res,400,'invalid_demo_request');
  const value=read(req)||{id:randomUUID()};
  // Persist identity even on a denied request; no counter supplied by the browser is trusted.
  write(res,value);
  try{
   if(!await limit('demo-start',hash(value.id),12,60))return deny(res,429,'demo_rate_limited');
   if(!await limit('demo-ip',hash(req.ip||req.socket?.remoteAddress||'unknown'),12,86400))return deny(res,429,'demo_rate_limited');
   const result=await reserve(hash(value.id),requestId,feature);
   if(!result?.allowed)return deny(res,403,result?.reason||'account_required');
   const end=Date.parse(result.expiresAt);
   if(!Number.isFinite(end)||end<=now()||end>now()+TTL+5000)return deny(res,503,'access_unavailable');
   write(res,{id:value.id,sessionId:requestId,feature,end});
   return res.json({sessionId:requestId,demo:true,remaining:result.remaining,access:{policyVersion:'seven_day_first_use_v1',allowed:true,status:'trial_active',demo:true,requiresAccount:false,accessEndsAt:new Date(end).toISOString()}});
  }catch{return deny(res,503,'access_unavailable');}
 }
 function identity(req,res,next){const v=read(req);if(!v)return deny(res,401,'account_required');req.account={userId:'guest:'+v.id};return next();}
 function authorize(features){return async(req,res,next)=>{
  const v=read(req);
  if(!v?.sessionId||v.end<=now()||!Number.isFinite(v.end))return deny(res,401,'account_required');
  if(features&&!features.includes(v.feature))return deny(res,403,'demo_feature_mismatch');
  try{if(!limit||!await limit('demo-requests',hash(v.sessionId),120,600))return deny(res,429,'demo_rate_limited');}catch{return deny(res,503,'access_unavailable');}
  req.account={userId:'guest:'+v.id};req.aiSession={id:v.sessionId,userId:req.account.userId,feature:v.feature,source:'guest_demo'};
  req.demoVerified=true;return next();
 };}
 return {start,identity,authorize,available:Boolean(secret&&reserve&&limit)};
}
