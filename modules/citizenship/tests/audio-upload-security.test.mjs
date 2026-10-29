import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import multer from 'multer';
import {readFile} from 'node:fs/promises';
import {AUDIO_UPLOAD_LIMITS} from '../server/audioUploadLimits.js';

test('multipart accepts the existing audio/language payload and rejects excess bounded parts',async t=>{
 const app=express(),upload=multer({storage:multer.memoryStorage(),limits:AUDIO_UPLOAD_LIMITS});
 app.post('/',upload.single('audio'),(req,res)=>res.json({language:req.body.language,bytes:req.file.size}));
 app.use((error,req,res,_next)=>res.status(error.code==='LIMIT_FILE_SIZE'?413:400).json({code:error.code}));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 t.after(()=>{server.closeAllConnections();server.close();});
 const send=async extra=>{const form=new FormData();form.append('audio',new Blob(['fixture'],{type:'audio/webm'}),'recording.webm');form.append('language','en');extra?.(form);return fetch(`http://127.0.0.1:${server.address().port}`,{method:'POST',body:form});};
 const valid=await send();assert.equal(valid.status,200);assert.deepEqual(await valid.json(),{language:'en',bytes:7});
 assert.equal((await send(form=>form.append('extra','unexpected'))).status,400);
 assert.equal((await send(form=>form.set('language','x'.repeat(100000)))).status,400);
 assert.equal((await send(form=>form.append('audio',new Blob(['second']),'second.webm'))).status,400);
 assert.equal((await send(form=>form.set('audio',new Blob([new Uint8Array(10*1024*1024+1)]),'large.webm'))).status,413);
});
test('all citizenship Responses API calls explicitly opt out of response storage',async()=>{
 const source=await readFile(new URL('../server/server.js',import.meta.url),'utf8');
 const calls=[...source.matchAll(/openai\.responses\.create\(\{\s*store: false,/g)];
 assert.equal(calls.length,3);assert.equal((source.match(/openai\.responses\.create\(/g)||[]).length,calls.length);
 assert.match(source,/limits: AUDIO_UPLOAD_LIMITS/);
 assert.match(source,/error instanceof multer\.MulterError\) \{[\s\S]*?invalid_audio_upload/);
});
