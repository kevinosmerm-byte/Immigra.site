import {mountAsylumTranscription} from './asylum-transcription.mjs';
import {handle as analyzeAsylum} from '../../modules/asylum/services/analysis/worker.mjs';
import express from '../../modules/citizenship/node_modules/express/index.js';
// Dependencies are injected for HTTP tests without credentials or paid calls.
export function createPlatformRouter({citizenship,requireAccount,getUsageSnapshot,reserveAsylumQuota,reserveAudioQuota,reserveInterviewQuota,analysisFetch=fetch,env={}}){
 const app=express();app.disable('x-powered-by');
 const allowedOrigins=new Set(['http://127.0.0.1:4388','http://localhost:4388',...(env.CORS_ORIGIN||'').split(',').map(origin=>origin.trim()).filter(Boolean)]);
 app.use((req,res,next)=>{res.set('Cache-Control','no-store');const origin=req.get('origin');if(origin&&!allowedOrigins.has(origin))return res.status(403).json({error:'ORIGIN_DENIED'});next();});
 const status=module=>{
  if(env.PLATFORM_AI_ENABLED!=='true')return {ready:false,reason:'AI_DISABLED'};
  if(!env.OPENAI_API_KEY||!env.SUPABASE_URL||!env.SUPABASE_SECRET_KEY||(module==='asylum'&&!env.OPENAI_TEXT_MODEL))return {ready:false,reason:'AI_NOT_CONFIGURED'};
  if(module==='asylum'&&reserveAsylumQuota)return {ready:true,provider:'OpenAI',daily_limit:2};
  return {ready:false,reason:'MODULE_POLICY_NOT_CONFIGURED'};
 };
 app.get('/api/v1/me/access',requireAccount,async(req,res)=>res.json({identity:req.account.userId,citizenship:{authority:'immigration-ai',usage:await getUsageSnapshot(req.account.userId)},asylum:status('asylum'),residency:status('residency')}));
 app.get('/api/asylum/session',requireAccount,(req,res)=>res.json({authenticated:true,provider:'supabase'}));
 for(const [module,path] of [['asylum','/api/asylum/status'],['residency','/api/realtime/status']])app.get(path,(req,res)=>res.json({...status(module),authentication_required:true}));
 // Asylum uses its own bounded allowance; residency remains disabled.
 // Keep the original domain handlers intact; never use Citizenship Pro as a grant.
 app.post('/api/asylum/analyze',requireAccount,express.text({type:'application/json',limit:'24kb'}),async(req,res)=>{
  if(!status('asylum').ready)return res.status(503).json({error:status('asylum').reason});
  const request=new Request('https://immigration-ai.internal/api/analyze',{method:'POST',headers:{'content-type':req.get('content-type')||''},body:req.body||''});
  let quotaDenied=false,quotaFailed=false;
  const guardedFetch=async(...args)=>{
   try{if(!await reserveAsylumQuota(req.account.userId)){quotaDenied=true;throw new Error('quota');}}catch(error){if(!quotaDenied)quotaFailed=true;throw error;}
   return analysisFetch(...args);
  };
  const response=await analyzeAsylum(request,{AI_ENABLED:'true',OPENAI_API_KEY:env.OPENAI_API_KEY,OPENAI_MODEL:env.OPENAI_TEXT_MODEL},guardedFetch,{authorized:true});
  if(quotaDenied)return res.status(429).json({error:'DAILY_LIMIT'});
  if(quotaFailed)return res.status(503).json({error:'QUOTA_UNAVAILABLE'});
  res.status(response.status).type('json').send(await response.text());
 });
 // Educational answer feedback is separate from realtime voice and source extraction.
 app.post('/api/interview/feedback',requireAccount,express.json({limit:'24kb'}),async(req,res)=>{
  if(!status('asylum').ready||!reserveInterviewQuota)return res.status(503).json({error:'AI_NOT_CONFIGURED'});
  if(!['n400','asylum','residency'].includes(req.body?.module))return res.status(400).json({error:'INVALID_MODULE'});
  if(req.body.task!=='interview_feedback')return res.status(400).json({error:'INVALID_TASK'});
  let denied=false,failed=false;
  const guarded=async(...args)=>{
   try{if(!await reserveInterviewQuota(req.account.userId)){denied=true;throw Error('quota');}}catch(e){if(!denied)failed=true;throw e;}
   return analysisFetch(...args);
  };
  const request=new Request('https://immigration-ai.internal/api/analyze',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(req.body)});
  const result=await analyzeAsylum(request,{AI_ENABLED:'true',OPENAI_API_KEY:env.OPENAI_API_KEY,OPENAI_MODEL:env.OPENAI_TEXT_MODEL},guarded,{authorized:true});
  if(denied)return res.status(429).json({error:'DAILY_LIMIT'});
  if(failed)return res.status(503).json({error:'QUOTA_UNAVAILABLE'});
  res.status(result.status).type('json').send(await result.text());
 });
 app.post(['/api/realtime/session'],requireAccount,(req,res)=>res.status(503).json({error:status(req.path.includes('/asylum/')?'asylum':'residency').reason}));
 app.post('/api/coach',(_req,res)=>res.status(410).json({error:'FEATURE_REMOVED'}));
 if(reserveAudioQuota)mountAsylumTranscription(app,{requireAccount,env,reserveQuota:reserveAudioQuota});
 const paid=new Set(['/evaluate-writing','/transcribe','/evaluate-reading','/coach','/avatar/session']);
 app.use('/api',(req,res,next)=>{
  if(!paid.has(req.path))return next();
  if(env.PLATFORM_AI_ENABLED!=='true')return res.status(503).json({error:'AI_DISABLED'});
  // The original server alone authorizes the AI session and meters its usage.
  return requireAccount(req,res,next);
 },citizenship);
 app.use((error,req,res,next)=>res.status(error?.status===413?413:503).json({error:error?.status===413?'BODY_TOO_LARGE':'SERVICE_UNAVAILABLE'}));
 return app;
}
