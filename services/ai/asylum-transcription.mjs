import multer from '../../modules/citizenship/node_modules/multer/index.js';
import OpenAI from '../../modules/citizenship/node_modules/openai/index.mjs';
export function mountAsylumTranscription(app,{requireAccount,env,reserveQuota,transcribe,path='/api/asylum/transcribe',consent='asylum-audio-v1'}){
 const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:8*1024*1024,files:1,fields:2}});
 app.post(path,requireAccount,(req,res,next)=>{
  if(env.PLATFORM_AI_ENABLED!=='true'||!env.OPENAI_API_KEY)return res.status(503).json({error:'AI_DISABLED'});
  if(req.get('x-audio-consent')!==consent)return res.status(400).json({error:'CONSENT_REQUIRED'});
  next();
 },upload.single('audio'),async(req,res)=>{
  if(!req.file||!/^audio\/(webm|mp4|ogg|wav|mpeg)(;|$)/.test(req.file.mimetype)||!['es','en'].includes(req.body.language))return res.status(400).json({error:'INVALID_AUDIO'});
  try{
   if(!await reserveQuota(req.account.userId))return res.status(429).json({error:'DAILY_LIMIT'});
   const file=new File([req.file.buffer],'answer.'+(req.file.mimetype.includes('mp4')?'mp4':'webm'),{type:req.file.mimetype});
   const run=transcribe||((input)=>new OpenAI({apiKey:env.OPENAI_API_KEY,timeout:30000,maxRetries:0}).audio.transcriptions.create(input));
   const result=await run({file,model:'gpt-4o-mini-transcribe',language:req.body.language});
   res.json({transcript:typeof result.text==='string'?result.text.slice(0,10000):''});
  }catch{res.status(503).json({error:'TRANSCRIPTION_UNAVAILABLE'});}
 });
}
