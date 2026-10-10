import express from '../../modules/citizenship/node_modules/express/index.js';
// Dependencies are injected for HTTP tests without credentials or paid calls.
export function createPlatformRouter({citizenship,requireAccount,getUsageSnapshot,env={}}){
 const app=express();app.disable('x-powered-by');
 const allowedOrigins=new Set(['http://127.0.0.1:4388','http://localhost:4388',...(env.CORS_ORIGIN||'').split(',').map(origin=>origin.trim()).filter(Boolean)]);
 app.use((req,res,next)=>{res.set('Cache-Control','no-store');const origin=req.get('origin');if(origin&&!allowedOrigins.has(origin))return res.status(403).json({error:'ORIGIN_DENIED'});next();});
 const status=module=>{
  if(env.PLATFORM_AI_ENABLED!=='true')return {ready:false,reason:'AI_DISABLED'};
  if(!env.OPENAI_API_KEY||!env.SUPABASE_URL||!env.SUPABASE_SECRET_KEY||(module==='asylum'&&!env.OPENAI_TEXT_MODEL))return {ready:false,reason:'AI_NOT_CONFIGURED'};
  return {ready:false,reason:'MODULE_POLICY_NOT_CONFIGURED'};
 };
 app.get('/api/v1/me/access',requireAccount,async(req,res)=>res.json({identity:req.account.userId,citizenship:{authority:'immigration-ai',usage:await getUsageSnapshot(req.account.userId)},asylum:status('asylum'),residency:status('residency')}));
 app.get('/api/asylum/session',requireAccount,(req,res)=>res.json({authenticated:true,provider:'supabase'}));
 for(const [module,path] of [['asylum','/api/asylum/status'],['residency','/api/realtime/status']])app.get(path,(req,res)=>res.json({...status(module),authentication_required:true}));
 // No production grants/ledger have been approved or deployed for new domains.
 // Keep the original domain handlers intact; never use Citizenship Pro as a grant.
 app.post(['/api/asylum/analyze','/api/realtime/session'],requireAccount,(req,res)=>res.status(503).json({error:status(req.path.includes('/asylum/')?'asylum':'residency').reason}));
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
