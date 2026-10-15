import test from 'node:test';
import assert from 'node:assert/strict';
import express from '../modules/citizenship/node_modules/express/index.js';
import {createPlatformRouter} from '../services/ai/router.mjs';
test('AI reporting is authenticated but available after trial expiry, with separate rate protection and safe failures',async t=>{
 let saved=[],allowed=true,fail=false,paidChecks=0;
 const app=createPlatformRouter({citizenship:express(),requireAccount:(req,res,next)=>{if(req.get('authorization')!=='Bearer fixture')return res.status(401).end();req.account={userId:'owner',emailTrial:true};next();},requirePractice:()=>{paidChecks++;throw Error('Must not check premium for safety reports')},reserveInterviewQuota:async(user,purpose)=>{assert.equal(user,'owner');assert.equal(purpose,'ai-report');return allowed;},submitAiReport:async(user,body)=>{if(fail)throw Error('private database payload');saved.push({user,body});return {received:true,reportId:body.reportId};}});
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));t.after(()=>{server.closeAllConnections();server.close()});
 const payload={reportId:'10000000-0000-4000-8000-000000000001',module:'residency',category:'incorrect',locale:'es',note:'',responseExcerpt:'',includeResponse:false};
 const send=(body,auth=true)=>fetch(`http://127.0.0.1:${server.address().port}/api/ai-reports`,{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer fixture'}:{})},body:JSON.stringify(body)});
 assert.equal((await send(payload,false)).status,401);assert.equal((await send({...payload,category:'invalid'})).status,400);assert.equal(saved.length,0);assert.equal((await send(payload)).status,201);assert.equal(saved[0].user,'owner');assert.equal(paidChecks,0);
 allowed=false;assert.equal((await send(payload)).status,429);allowed=true;fail=true;const failed=await send(payload);assert.equal(failed.status,503);assert.equal((await failed.text()).includes('private'),false);
});

test('native WebViews can preflight and read root API responses without opening access to untrusted origins',async t=>{
 const app=createPlatformRouter({citizenship:express(),requireAccount:(_req,res)=>res.status(401).json({code:'sign_in_required'})});
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));t.after(()=>{server.closeAllConnections();server.close()});
 const url=`http://127.0.0.1:${server.address().port}/api/ai-reports`;
 for(const origin of ['capacitor://localhost','https://localhost']){
  const preflight=await fetch(url,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type,x-immigra-client'}});
  assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),origin);assert.match(preflight.headers.get('access-control-allow-headers'),/authorization/);
  const denied=await fetch(url,{method:'POST',headers:{Origin:origin}});assert.equal(denied.status,401);assert.equal(denied.headers.get('access-control-allow-origin'),origin);
 }
 const untrusted=await fetch(url,{method:'OPTIONS',headers:{Origin:'https://untrusted.example','Access-Control-Request-Method':'POST'}});assert.equal(untrusted.status,403);assert.equal(untrusted.headers.get('access-control-allow-origin'),null);
});
