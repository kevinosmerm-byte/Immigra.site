import test from 'node:test';
import assert from 'node:assert/strict';
import express from '../modules/citizenship/node_modules/express/index.js';
import {mountAsylumTranscription} from '../services/ai/asylum-transcription.mjs';
test('asylum audio requires identity, consent and quota before calling provider',async t=>{
 let calls=0,allowed=true;const owners=[];const app=express();
 mountAsylumTranscription(app,{env:{PLATFORM_AI_ENABLED:'true',OPENAI_API_KEY:'test'},requireAccount:(req,res,next)=>{if(req.get('authorization')!=='Bearer test')return res.sendStatus(401);req.account={userId:'verified'};next();},reserveQuota:async id=>{owners.push(id);return allowed;},transcribe:async input=>{calls++;assert.equal(input.language,'es');return {text:'Respuesta ficticia'};}});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>{server.closeAllConnections();server.close();});
 const url=`http://127.0.0.1:${server.address().port}/api/asylum/transcribe`;
 assert.equal((await fetch(url,{method:'POST'})).status,401);
 assert.equal((await fetch(url,{method:'POST',headers:{authorization:'Bearer test'}})).status,400);
 const send=()=>{const body=new FormData();body.append('audio',new Blob(['synthetic'],{type:'audio/webm'}),'test.webm');body.append('language','es');return fetch(url,{method:'POST',headers:{authorization:'Bearer test','x-audio-consent':'asylum-audio-v1'},body});};
 const response=await send();assert.equal(response.status,200);assert.equal((await response.json()).transcript,'Respuesta ficticia');assert.deepEqual(owners,['verified']);
 allowed=false;assert.equal((await send()).status,429);assert.equal(calls,1);
});
