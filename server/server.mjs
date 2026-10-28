import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createClientSecret,validateRequest} from './realtime.mjs';
const loopback=h=>['localhost','127.0.0.1','[::1]'].includes(h);
export function createHandler({apiKey=process.env.OPENAI_API_KEY,enabled=process.env.REALTIME_ENABLED==='true',port=Number(process.env.PORT||8787),fetchImpl=fetch,now=Date.now}={}){
 const origins=new Set([`http://localhost:${port}`,`http://127.0.0.1:${port}`,'http://localhost:5173','http://127.0.0.1:5173']);
 const counts=[];const root=fileURLToPath(new URL('../dist/',import.meta.url));
 const configured=()=>enabled&&!!apiKey&&apiKey!=='replace_with_server_only_key';
 return async(req,res)=>{
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  let host;try{host=new URL('http://'+req.headers.host);if(!loopback(host.hostname))return json(403,{error:'Local access only'});}catch{return json(403,{error:'Local access only'});}
  const route=new URL(req.url,'http://localhost').pathname;
  if(route.startsWith('/api/')){
   if(req.method==='GET'&&route==='/api/realtime/status')return json(200,{ready:configured(),local_only:true,voice:'marin',model:'gpt-realtime'});
   if(route!=='/api/realtime/session'||req.method!=='POST')return json(404,{error:'Not found'});
   if(!origins.has(req.headers.origin)||req.headers['x-immigration-client']!=='local-demo')return json(403,{error:'Origin denied'});
   if(!req.headers['content-type']?.startsWith('application/json'))return json(415,{error:'JSON required'});
   const time=now();while(counts.length&&time-counts[0]>=60000)counts.shift();if(counts.length>=4)return json(429,{error:'Session limit reached'});counts.push(time);
   if(!configured())return json(503,{error:'Realtime not configured'});
   try{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>4096){json(413,{error:'Request too large'});req.resume();return;}chunks.push(chunk);}let input;try{input=validateRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{return json(400,{error:'Invalid request'});}
    const result=await createClientSecret(input,{apiKey,fetchImpl});return json(200,result);
   }catch{return json(503,{error:'Realtime unavailable'});}
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return json(405,{error:'Method not allowed'});
  try{const relative=decodeURIComponent(route).replace(/^\/+/, '')||'index.html';const target=path.resolve(root,relative);if(!target.startsWith(root))return json(403,{error:'Denied'});const info=await stat(target);if(!info.isFile())return json(404,{error:'Not found'});const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html; charset=utf-8','.mp4':'video/mp4'}[path.extname(target)]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime,'X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:await readFile(target));}catch{return json(404,{error:'Not found'});}
 };
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{process.loadEnvFile(fileURLToPath(new URL('../.env',import.meta.url)));}catch(e){if(e.code!=='ENOENT')throw e;}
 const port=Number(process.env.PORT||8787);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');
 createServer(createHandler({port})).listen(port,'127.0.0.1',()=>console.log(`ImmigrationAI local beta: http://127.0.0.1:${port}`));
}
