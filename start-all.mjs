import http from 'node:http';
import {seoPages} from './shared/seo-pages.mjs';
import {applySecurityHeaders} from './server/security-headers.mjs';
import {serveFile} from './server/static-file.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const base=path.dirname(fileURLToPath(import.meta.url));
const mime={'.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.ico':'image/vnd.microsoft.icon','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp4':'video/mp4','.m4a':'audio/mp4','.pdf':'application/pdf','.wasm':'application/wasm'};
try{process.loadEnvFile(path.join(base,'.env'));}catch(e){if(e.code!=='ENOENT')throw e;}
process.env.CORS_ORIGIN ||= 'http://127.0.0.1:4388,http://localhost:4388';
const backend=process.env.PLATFORM_BACKEND_ENABLED==='true'?(await import('./services/ai/platform.mjs')).app:null;
const configuredPort=Number(process.env.PORT||4388);
if(!Number.isInteger(configuredPort)||configuredPort<1||configuredPort>65535)throw new Error('Invalid PORT');
const host=process.env.HOST||'127.0.0.1';
const servers=[];
for(const [name,port,dir] of [['ImmigrationAI',configuredPort,'dist']]){
 const root=path.join(base,dir);
 const server=http.createServer(async(req,res)=>{
  applySecurityHeaders(req,res,{production:process.env.NODE_ENV==='production'||process.env.RENDER==='true'});
  try{
   const url=new URL(req.url,'http://localhost');const pathname=decodeURIComponent(url.pathname);
   const seoRedirect=seoPages.find(p=>pathname.replace(/^\/|\/$/g,'')===p.alias);
   if(seoRedirect){res.writeHead(301,{Location:'/'+seoRedirect.path});return res.end();}
   if(pathname.startsWith('/api/'))res.setHeader('X-Robots-Tag','noindex, nofollow');
   if(pathname==='/healthz'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({ok:true,service:'immigration-ai'}));}
   if(pathname.startsWith('/api/')&&backend)return backend(req,res);
   if(pathname.startsWith('/api/')){res.writeHead(pathname==='/api/status'?200:503,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(JSON.stringify({ready:false,configured:false,promotionAccess:false,billing:{enabled:false},error:'LOCAL_API_NOT_CONFIGURED'}));}
   const publicPage=/^\/(sources|fuentes|privacy|privacidad|terms|terminos|support|soporte|delete-account|eliminar-cuenta|ciudadania|asilo|residencia|en\/(citizenship|asylum|residency))\/?$/.test(pathname);
   const relative=pathname==='/'?'index.html':publicPage?pathname.replace(/^\/+|\/+$/g,'')+'/index.html':pathname.replace(/^\/+/, '');
   if(relative.split('/').some(s=>s.startsWith('.')||s.startsWith('_'))){res.writeHead(404);return res.end();}
   const target=path.resolve(root,relative);if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
   await serveFile(req,res,target,mime[path.extname(target)]||'application/octet-stream');
  }catch{res.writeHead(404);res.end('Not found');}
 });
 server.on('error',error=>{console.error(name+': '+error.code);for(const s of servers)s.close();process.exitCode=1;});
 servers.push(server);server.listen(port,host,()=>console.log(name+': http://127.0.0.1:'+port));
}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{for(const s of servers)s.close();});
