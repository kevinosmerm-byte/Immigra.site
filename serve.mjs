import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';const target=path.resolve(root,relative);if(!target.startsWith(root)){res.writeHead(403);return res.end();}const data=await readFile(target);res.writeHead(200,{'Content-Type':target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':target.endsWith('.mp4')?'video/mp4':'text/html; charset=utf-8'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(4388,'127.0.0.1',()=>console.log('Immigration AI: http://127.0.0.1:4388'));
