import express from '../../modules/citizenship/node_modules/express/index.js';
import {app as citizenship} from '../../modules/citizenship/server/server.js';
import {requireAccount} from '../../modules/citizenship/server/accountService.js';
import {authorizeModule} from '../../shared/subscriptions/quota.mjs';
import {handle as analyze} from '../../modules/asylum/services/analysis/worker.mjs';
import {createClientSecret,validateRequest} from '../../server/realtime.mjs';
export const app=express();
app.disable('x-powered-by');
app.use((req,res,next)=>{const origin=req.get('origin');if(origin&&!['http://127.0.0.1:4388','http://localhost:4388'].includes(origin))return res.status(403).json({error:'ORIGIN_DENIED'});next();});
app.use('/api/account/public-config',(req,res,next)=>{const json=res.json.bind(res);res.json=body=>json({...body,promotionAccess:false});next();});
const configured=()=>process.env.PLATFORM_AI_ENABLED==='true'&&!!process.env.OPENAI_API_KEY&&!!process.env.SUPABASE_URL&&!!process.env.SUPABASE_SECRET_KEY;
app.get(['/api/realtime/status','/api/asylum/status'],(req,res)=>res.json({ready:configured(),authentication_required:true}));
app.post(['/api/realtime/session','/api/asylum/analyze'],express.json({limit:'24kb'}),requireAccount,async(req,res)=>{
 if(!configured())return res.status(503).json({error:'AI_NOT_CONFIGURED'});
 const module=req.path.includes('/asylum/')?'asylum':'residency';
 let input=req.body; if(module==='residency'){try{input=validateRequest(input);}catch{return res.status(400).json({error:'INVALID_INPUT'});}}
 const access=await authorizeModule({userId:req.account.userId,module,consent:input?.consent});
 if(access.status!==200)return res.status(access.status).json({error:access.error});
 try{
  if(module==='residency')return res.json(await createClientSecret(input,{apiKey:process.env.OPENAI_API_KEY}));
  const request=new Request('http://localhost/api/analyze',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)});
  const response=await analyze(request,{...process.env,AI_ENABLED:'true',OPENAI_MODEL:process.env.OPENAI_TEXT_MODEL},fetch, {authorized:true});
  res.status(response.status).type('json').send(await response.text());
 }catch{res.status(503).json({error:'SERVICE_UNAVAILABLE'});}
});
const paid=new Set(['/evaluate-writing','/transcribe','/evaluate-reading','/coach','/avatar/session']);
app.use('/api',async(req,res,next)=>{
 if(!paid.has(req.path))return next();
 if(!configured())return res.status(503).json({error:'AI_NOT_CONFIGURED'});
 return requireAccount(req,res,async()=>{const access=await authorizeModule({userId:req.account.userId,module:'citizenship',consent:true});return access.status===200?next():res.status(access.status).json({error:access.error});});
},citizenship);
app.use((error,req,res,next)=>res.status(error?.status===413?413:503).json({error:'SERVICE_UNAVAILABLE'}));
