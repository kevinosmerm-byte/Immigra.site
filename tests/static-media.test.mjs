import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {serveFile} from '../server/static-file.mjs';
test('media supports mobile byte ranges, suffixes, HEAD and invalid ranges',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'media-test-'));const file=path.join(dir,'clip.mp4');await writeFile(file,'0123456789');
 const server=http.createServer((req,res)=>serveFile(req,res,file,'video/mp4'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${server.address().port}`;
 try{
  for(const [range,body,contentRange] of [['bytes=0-1','01','bytes 0-1/10'],['bytes=4-','456789','bytes 4-9/10'],['bytes=-3','789','bytes 7-9/10']]){
   const r=await fetch(url,{headers:{Range:range}});assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),contentRange);assert.equal(await r.text(),body);
  }
  const bad=await fetch(url,{headers:{Range:'bytes=20-30'}});assert.equal(bad.status,416);
  const head=await fetch(url,{method:'HEAD'});assert.equal(head.headers.get('content-length'),'10');assert.equal(await head.text(),'');
  const full=await fetch(url);assert.equal(full.status,200);assert.equal(await full.text(),'0123456789');
  assert.equal(full.headers.get('cache-control'),'public, max-age=3600');
  const cached=await fetch(url,{headers:{'If-None-Match':full.headers.get('etag')}});assert.equal(cached.status,304);
 }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true});}
});

test('text assets are compressed and HTML revalidates',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'text-test-'));const file=path.join(dir,'index.html');const body='<html>'+ 'content '.repeat(1000)+'</html>';await writeFile(file,body);
 const server=http.createServer((req,res)=>serveFile(req,res,file,'text/html; charset=utf-8'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const response=await fetch(`http://127.0.0.1:${server.address().port}`,{headers:{'Accept-Encoding':'gzip'}});assert.equal(response.headers.get('content-encoding'),'gzip');assert.equal(response.headers.get('cache-control'),'no-cache');assert.equal(await response.text(),body);}
 finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true});}
});

test('explicit content-addressed assets are immutable; HTML never is',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'cache-test-'));const file=path.join(dir,'asset');await writeFile(file,'asset');
 const server=http.createServer((req,res)=>serveFile(req,res,file,req.url==='/html'?'text/html':'text/javascript',{immutable:true}));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const url=`http://127.0.0.1:${server.address().port}`;
  const asset=await fetch(url);assert.equal(asset.headers.get('cache-control'),'public, max-age=31536000, immutable');
  const cached=await fetch(url,{headers:{'If-None-Match':asset.headers.get('etag')}});assert.equal(cached.status,304);assert.equal(cached.headers.get('cache-control'),'public, max-age=31536000, immutable');
  const html=await fetch(url+'/html');assert.equal(html.headers.get('cache-control'),'no-cache');
 }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true});}
});
