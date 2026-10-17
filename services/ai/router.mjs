import {validateAiReport} from '../../modules/citizenship/server/aiReportService.js';
import {readingFeedback} from './reading-feedback.mjs';
import {interviewTestingEnabled} from '../../shared/interview-ui/access-policy.mjs';
import {createDemoAccess} from './demo-access.mjs';
import {logDiagnostic} from '../../shared/interview-ui/diagnostics.mjs';
import {aosFeedback} from '../../modules/residency/src/aosFeedback.mjs';
import {mountAsylumTranscription} from './asylum-transcription.mjs';
import {handle as analyzeAsylum} from '../../modules/asylum/services/analysis/worker.mjs';
import express from '../../modules/citizenship/node_modules/express/index.js';
import cors from '../../modules/citizenship/node_modules/cors/lib/index.js';
import {createInterviewAIEngine} from './interview-engine.mjs';
// Dependencies are injected for HTTP tests without credentials or paid calls.
export function createPlatformRouter({citizenship,requireAccount,submitAiReport,requirePractice=(_req,res)=>res.status(503).json({error:"ACCESS_UNAVAILABLE"}),getUsageSnapshot,reserveAsylumQuota,reserveAudioQuota,reserveInterviewQuota,reserveConversationQuota,reserveGuestDemo,limitDemo,analysisFetch=fetch,env={}}){
 const app=express();app.disable('x-powered-by');
 const allowedOrigins=new Set(['http://127.0.0.1:4388','http://localhost:4388','capacitor://localhost','http://localhost','https://localhost',...(env.CORS_ORIGIN||'').split(',').map(origin=>origin.trim()).filter(Boolean)]);
 app.use((req,res,next)=>{res.set('Cache-Control','no-store');const origin=req.get('origin');if(origin&&!allowedOrigins.has(origin))return res.status(403).json({error:'ORIGIN_DENIED'});next();});
 app.set('trust proxy',1);
 app.use(cors({origin:(origin,callback)=>callback(null,!origin||allowedOrigins.has(origin)),maxAge:600}));
 app.post('/api/ai-reports',requireAccount,express.json({limit:'8kb'}),async(req,res)=>{
  try{
   const body=validateAiReport(req.body);
   if(!submitAiReport||!reserveInterviewQuota)return res.status(503).json({code:'report_unavailable'});
   if(!await reserveInterviewQuota(req.account.userId,'ai-report'))return res.status(429).json({code:'report_rate_limit'});
   res.status(201).json(await submitAiReport(req.account.userId,body));
  }catch(error){res.status(error.status===400?400:503).json({code:error.status===400?'invalid_report':'report_unavailable'});}
 });
 const demo=createDemoAccess({secret:env.DEMO_SIGNING_SECRET||env.SUPABASE_SECRET_KEY,reserve:reserveGuestDemo,limit:limitDemo});
 const signedIn=req=>Boolean(req.get('authorization'));
 const interviewAccess=(req,res,next)=>signedIn(req)?requireAccount(req,res,()=>requirePractice(req,res,next)):demo.authorize(['realInterview','classicInterview','speaking','coach'])(req,res,next);
 app.post('/api/demo/start',express.json({limit:'2kb'}),demo.start);
 const interviews=createInterviewAIEngine({env,fetchImpl:analysisFetch,reserveSessionQuota:reserveConversationQuota,reserveTurnQuota:reserveInterviewQuota});
 const interviewError=(res,error)=>{const code=error?.message;logDiagnostic('INTERVIEW_ERROR',{code,status:error?.status});const known={LOCAL_EVALUATOR_REQUIRED:400,STALE_QUESTION:409,INTERVIEW_COMPLETE:409,GUEST_SESSION_EXPIRED:401,PROVIDER_AUTH_FAILED:502,PROVIDER_ACCESS_DENIED:502,PROVIDER_BAD_REQUEST:502,INVALID_PROVIDER_SESSION:502,QUOTA_UNAVAILABLE:503,AI_NOT_CONFIGURED:503,INVALID_SETTINGS:400,INVALID_SDP:400,INVALID_INPUT:400,DAILY_LIMIT:429,SESSION_EXPIRED:410,SESSION_LIMIT:429,TURN_IN_PROGRESS:409,PROVIDER_LIMIT:502,PROVIDER_UNAVAILABLE:502,INCOMPLETE_EVALUATION:502,INVALID_EVALUATION:502,UNGROUNDED_EVALUATION:502};return res.status(known[code]||503).json({error:known[code]?code:'INTERVIEW_UNAVAILABLE'});};
 app.get('/api/interview/status',(_req,res)=>res.json({ready:interviews.available(),authentication_required:!demo.available,demo_uses:2,max_duration_seconds:600,testing_access:interviewTestingEnabled(env)}));
 app.post('/api/interview/reading',interviewAccess,express.json({limit:'12kb'}),async(req,res)=>{const result=await readingFeedback(req.body,{env,fetchImpl:analysisFetch,reserveQuota:reserveInterviewQuota,userId:req.account.userId});res.status(result.status).json(result);});
 app.post('/api/interview/sessions',interviewAccess,express.json({limit:'48kb'}),async(req,res)=>{try{res.json(await interviews.start(req.account.userId,req.body));}catch(error){interviewError(res,error);}});
 app.post('/api/interview/sessions/:id/turn',interviewAccess,express.json({limit:'12kb'}),async(req,res)=>{try{res.json(await interviews.turn(req.account.userId,req.params.id,req.body));}catch(error){interviewError(res,error);}});
 app.delete('/api/interview/sessions/:id',(req,res,next)=>signedIn(req)?requireAccount(req,res,next):demo.identity(req,res,next),async(req,res)=>{await interviews.close(req.params.id,req.account.userId);res.status(204).end();});
 const status=module=>{
  if(env.PLATFORM_AI_ENABLED!=='true')return {ready:false,reason:'AI_DISABLED'};
  if(!env.OPENAI_API_KEY||!env.SUPABASE_URL||!env.SUPABASE_SECRET_KEY||(module==='asylum'&&!env.OPENAI_TEXT_MODEL))return {ready:false,reason:'AI_NOT_CONFIGURED'};
  if(module==='asylum'&&reserveAsylumQuota)return {ready:true,provider:'OpenAI',daily_limit:null,trial_days:7};
  return {ready:false,reason:'MODULE_POLICY_NOT_CONFIGURED'};
 };
 app.get('/api/v1/me/access',requireAccount,async(req,res)=>res.json({identity:req.account.userId,citizenship:{authority:'immigration-ai',usage:await getUsageSnapshot(req.account.userId)},asylum:status('asylum'),residency:status('residency')}));
 app.get('/api/asylum/session',(req,res,next)=>signedIn(req)?requireAccount(req,res,next):demo.identity(req,res,next),(req,res)=>res.json({authenticated:true,provider:req.account.userId.startsWith('guest:')?'demo':'supabase'}));
 for(const [module,path] of [['asylum','/api/asylum/status'],['residency','/api/realtime/status']])app.get(path,(req,res)=>res.json({...status(module),authentication_required:!demo.available}));
 // Paid actions share Immigra's seven-day first-use policy.
 // Domain handlers and source grounding remain isolated.
 app.post('/api/asylum/analyze',interviewAccess,express.text({type:'application/json',limit:'24kb'}),async(req,res)=>{
  if(!status('asylum').ready)return res.status(503).json({error:status('asylum').reason});
  const request=new Request('https://immigration-ai.internal/api/analyze',{method:'POST',headers:{'content-type':req.get('content-type')||''},body:req.body||''});
  let quotaDenied=false,quotaFailed=false;
  const guardedFetch=async(...args)=>{
   try{if(!await (req.account.userId.startsWith('guest:')?reserveInterviewQuota:reserveAsylumQuota)(req.account.userId)){quotaDenied=true;throw new Error('quota');}}catch(error){if(!quotaDenied)quotaFailed=true;throw error;}
   return analysisFetch(...args);
  };
  const response=await analyzeAsylum(request,{AI_ENABLED:'true',OPENAI_API_KEY:env.OPENAI_API_KEY,OPENAI_MODEL:env.OPENAI_TEXT_MODEL},guardedFetch,{authorized:true});
  if(quotaDenied)return res.status(429).json({error:'DAILY_LIMIT'});
  if(quotaFailed)return res.status(503).json({error:'QUOTA_UNAVAILABLE'});
  res.status(response.status).type('json').send(await response.text());
 });
 // Educational answer feedback is separate from realtime voice and source extraction.
 app.post('/api/interview/feedback',interviewAccess,express.json({limit:'24kb'}),async(req,res)=>{
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
 app.post('/api/residency/conversation',interviewAccess,express.json({limit:'48kb'}),async(req,res)=>{const result=await aosFeedback(req.body,{env,fetchImpl:analysisFetch,reserveQuota:reserveInterviewQuota,userId:req.account.userId});res.status(result.status).json(result);});
 app.post(['/api/realtime/session'],requireAccount,(req,res)=>res.status(503).json({error:status(req.path.includes('/asylum/')?'asylum':'residency').reason}));
 // Guided coach is authorized by the citizenship backend using the same Immigra account.
 if(reserveAudioQuota)mountAsylumTranscription(app,{requireAccount:interviewAccess,env,reserveQuota:reserveAudioQuota,path:'/api/interview/transcribe',consent:'interview-audio-v1'});
 if(reserveAudioQuota)mountAsylumTranscription(app,{requireAccount:interviewAccess,env,reserveQuota:reserveAudioQuota});
 const paid=new Set(['/evaluate-writing','/transcribe','/evaluate-reading','/coach','/avatar/session']);
 app.use('/api',(req,res,next)=>{
  if(!paid.has(req.path))return next();
  if(env.PLATFORM_AI_ENABLED!=='true')return res.status(503).json({error:'AI_DISABLED'});
  // The original server alone authorizes the AI session and meters its usage.
  if(signedIn(req))return requireAccount(req,res,next);
  const features={'/evaluate-writing':['writing'],'/transcribe':['speaking','coach','classicInterview','realInterview'],'/evaluate-reading':['speaking'],'/coach':['coach','realInterview'],'/avatar/session':['realInterview']};
  return demo.authorize(features[req.path])(req,res,next);
 },citizenship);
 app.use((error,req,res,next)=>res.status(error?.status===413?413:503).json({error:error?.status===413?'BODY_TOO_LARGE':'SERVICE_UNAVAILABLE'}));
 return app;
}
