import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
const user='10000000-0000-4000-8000-000000000001';
const id='20000000-0000-4000-8000-000000000001';
test('provider session middleware rechecks current server access, never trusting source or client dates', async()=>{
 let access={policyVersion:'seven_day_first_use_v1',allowed:true,status:'trial_active'};
 let fail=false;
 const upstream=createServer((req,res)=>{
  res.setHeader('Content-Type','application/json');
  if(req.url.startsWith('/auth/v1/user'))return res.end(JSON.stringify({id:user,email:'fixture@example.test'}));
  if(req.url.startsWith('/rest/v1/ai_sessions'))return res.end(JSON.stringify({id,feature:'coach',status:'started',source:'free_trial'}));
  if(req.url==='/rest/v1/rpc/get_practice_access'){
   if(fail){res.statusCode=503;return res.end(JSON.stringify({code:'fixture_unavailable',message:'Service unavailable'}));}
   return res.end(JSON.stringify(access));
  }
  res.statusCode=404;res.end('{}');
 });
 await new Promise(resolve=>upstream.listen(0,'127.0.0.1',resolve));
 const previous={url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SECRET_KEY};
 process.env.SUPABASE_URL='http://127.0.0.1:'+upstream.address().port;process.env.SUPABASE_SECRET_KEY='fixture-test-key';
 try{
  const {attachOptionalAiSession}=await import('../server/accountService.js?trial-test='+Date.now());
  const run=async headers=>{
   const req={get:name=>headers[name.toLowerCase()]||'',body:{source:'pro_allowance',trialStartedAt:'2099-01-01'}};
   const res={statusCode:200,status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;},set(){}};
   let next=false;await attachOptionalAiSession(req,res,()=>{next=true;});return {next,req,res};
  };
  const headers={'x-citizenship-ai-session':id,authorization:'Bearer fixture-token','x-citizenship-ai-feature':'coach'};
  assert.equal((await run(headers)).next,true);
  access={...access,allowed:false,status:'trial_expired'};let result=await run(headers);assert.equal(result.next,false);assert.equal(result.res.statusCode,403);assert.equal(result.res.body.code,'trial_expired');
  access={policyVersion:'seven_day_first_use_v1',allowed:true,status:'subscribed'};assert.equal((await run(headers)).next,true);
  result=await run({...headers,'x-citizenship-ai-feature':'writing'});assert.equal(result.res.statusCode,403);
  result=await run({...headers,authorization:''});assert.equal(result.res.statusCode,401);
  fail=true;result=await run(headers);assert.equal(result.res.statusCode,503);assert.equal(result.next,false);
 } finally{
  for(const [name,value] of [['SUPABASE_URL',previous.url],['SUPABASE_SECRET_KEY',previous.key]]){if(value===undefined)delete process.env[name];else process.env[name]=value;}
  await new Promise(resolve=>upstream.close(resolve));
 }
});
