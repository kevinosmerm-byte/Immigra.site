import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
export const WEB_SESSION_TOKEN='immigra-web-session-v1';
const NAME='__Host-immigra_session',SECONDS=90*86400;
export function createPersistentSessionService({secret,validate,refresh,revoke,now=Date.now}){
 const key=createHash('sha256').update('immigra-session-v1:'+secret).digest();
 const inflight=new Map();
 const transient=error=>error&&(Number(error.status)>=500||error.name==='AuthRetryableFetchError'||error.name==='AuthUnknownError');
 const clear=res=>res.setHeader('Set-Cookie',`${NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
 function save(res,session){
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(NAME));
  const body=Buffer.concat([cipher.update(JSON.stringify({access_token:session.access_token,refresh_token:session.refresh_token,expires_at:session.expires_at,until:now()+SECONDS*1000})),cipher.final()]);
  const value=Buffer.concat([iv,cipher.getAuthTag(),body]).toString('base64url');
  res.setHeader('Set-Cookie',`${NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SECONDS}`);
 }
 function read(req){try{
  const value=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(NAME+'='))?.slice(NAME.length+1);if(!value)return null;
  const data=Buffer.from(value,'base64url');const decipher=createDecipheriv('aes-256-gcm',key,data.subarray(0,12));decipher.setAAD(Buffer.from(NAME));decipher.setAuthTag(data.subarray(12,28));
  const session=JSON.parse(Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]).toString());
  return session.until>now()&&session.access_token&&session.refresh_token?session:null;
 }catch{return null;}}
 const view=user=>({access_token:WEB_SESSION_TOKEN,isCookieSession:true,user:{id:user.id,email:user.email,app_metadata:user.app_metadata||{}}});
 async function exchange(res,tokens){
  if(!tokens?.access_token||!tokens?.refresh_token)throw Object.assign(Error('Session required'),{status:400});
  const {data,error}=await validate(tokens.access_token);if(error||!data?.user?.email_confirmed_at)throw Object.assign(Error('Verified session required'),{status:401});
  const claims=JSON.parse(Buffer.from(tokens.access_token.split('.')[1],'base64url').toString());
  save(res,{...tokens,expires_at:claims.exp});return view(data.user);
 }
 async function restore(req,res){
  let tokens=read(req);if(!tokens)return null;
  if(Number(tokens.expires_at)*1000<=now()+60000){
   const id=createHash('sha256').update(tokens.refresh_token).digest('hex');
   if(!inflight.has(id))inflight.set(id,refresh(tokens.refresh_token).finally(()=>inflight.delete(id)));
   const {data,error}=await inflight.get(id);
   if(transient(error))throw Error('Authentication temporarily unavailable');
   if(error||!data?.session){clear(res);return null;}
   tokens=data.session;save(res,tokens);
  }
  const {data,error}=await validate(tokens.access_token);
  if(transient(error))throw Error('Authentication temporarily unavailable');
  if(error||!data?.user?.email_confirmed_at){clear(res);return null;}
  return view(data.user);
 }
 async function logout(req,res){const tokens=read(req);clear(res);if(tokens)await revoke(tokens.access_token).catch(()=>{});}
 return {exchange,restore,logout,read,clear};
}
