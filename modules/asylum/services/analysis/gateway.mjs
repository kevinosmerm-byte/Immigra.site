import {handle} from './worker.mjs';
import {verifyAccess,reserveQuota} from './access.mjs';
const json=(status,data)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
export function configured(env){return env.AI_ENABLED==='true'&&!!env.OPENAI_API_KEY&&!!env.OPENAI_MODEL&&!!env.ACCESS_TEAM_DOMAIN&&!!env.ACCESS_AUD&&!!env.AI_USAGE;}
export async function gateway(request,env,fetcher=fetch){
 const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
 if(url.pathname==='/api/status'&&request.method==='GET')return json(200,{ready:configured(env),provider:'OpenAI',mode:'private-preview',consent_version:'ai-excerpts-v1'});
 if(!['/api/analyze','/api/session'].includes(url.pathname))return json(404,{error:'NOT_FOUND'});
 if(!configured(env))return json(503,{error:'AI_NOT_CONFIGURED'});
 if(url.pathname==='/api/analyze'&&request.method!=='POST')return json(405,{error:'METHOD_NOT_ALLOWED'});
 if(url.pathname==='/api/analyze'&&request.headers.get('origin')!==url.origin)return json(403,{error:'ORIGIN_REJECTED'});
 const subject=await verifyAccess(request,env,fetcher);if(!subject)return json(401,{error:'LOGIN_REQUIRED'});
 if(url.pathname==='/api/session')return new Response('Acceso privado verificado. Puedes cerrar esta pestaña y volver a AsiloAI.',{headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
 try{if(!await reserveQuota(env.AI_USAGE,subject))return json(429,{error:'DAILY_LIMIT'});}catch{return json(503,{error:'QUOTA_UNAVAILABLE'});}
 return handle(request,env,fetcher,{authorized:true});
}
export default {fetch:(request,env)=>gateway(request,env)};
