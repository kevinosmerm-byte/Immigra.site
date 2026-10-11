import {createHmac, randomUUID, timingSafeEqual} from 'node:crypto';
export function createGuestAccess({secret,now=Date.now}) {
 const sign=value=>createHmac('sha256',secret).update('interview-guest:'+value).digest('hex');
 return (req,res,next)=>{
  if(!secret)return res.status(503).json({error:'AI_NOT_CONFIGURED'});
  const raw=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-interview_guest='))?.split('=')[1]||'';
  const [id,expires,signature]=raw.split('.');let valid=false;
  if(/^[a-f0-9-]{36}$/.test(id||'')&&/^\d{13}$/.test(expires||'')&&/^[a-f0-9]{64}$/.test(signature||'')&&Number(expires)>now())valid=timingSafeEqual(Buffer.from(sign(id+'.'+expires)),Buffer.from(signature));
  let owner=id;
  if(!valid){
   if(!['/api/interview/sessions','/api/interview/transcribe','/api/interview/reading'].includes(req.path))return res.status(401).json({error:'GUEST_SESSION_EXPIRED'});
   owner=randomUUID();const value=owner+'.'+(now()+86400000);
   res.setHeader('Set-Cookie',`__Host-interview_guest=${value}.${sign(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`);
  }
  req.account={userId:'guest:'+owner};next();
 };
}
