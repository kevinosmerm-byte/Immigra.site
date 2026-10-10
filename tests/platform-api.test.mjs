import test from 'node:test';
import assert from 'node:assert/strict';
import express from '../modules/citizenship/node_modules/express/index.js';
import {createPlatformRouter} from '../services/ai/router.mjs';
async function fixture(t,env={},dependencies={}){
 let calls=0,usageUsers=[];const legacy=express();
 legacy.get('/account/public-config',(req,res)=>res.json({promotionAccess:true,billing:{enabled:false}}));
 legacy.post('/transcribe',(req,res)=>{calls++;res.json({session:req.get('x-citizenship-ai-session'),authority:'legacy'});});
 legacy.post('/billing/webhook',express.raw({type:'application/json'}),(req,res)=>res.json({raw:req.body.toString()}));
 const app=createPlatformRouter({citizenship:legacy,env,...dependencies,requireAccount:(req,res,next)=>{const token=req.get('authorization');if(!['Bearer A','Bearer B'].includes(token))return res.status(401).json({error:'AUTHENTICATION_REQUIRED'});req.account={userId:token.slice(-1)};next();},getUsageSnapshot:async id=>{usageUsers.push(id);return {owner:id,remaining:15};}});
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 return {request:async(path,options)=>fetch(`http://127.0.0.1:${server.address().port}${path}`,options),calls:()=>calls,usageUsers};
}
test('legacy promotion and billing config are not overwritten by platform',async t=>{const f=await fixture(t);assert.deepEqual(await (await f.request('/api/account/public-config')).json(),{promotionAccess:true,billing:{enabled:false}});});
test('citizenship request delegates once, preserving original session without a second quota',async t=>{const f=await fixture(t,{PLATFORM_AI_ENABLED:'true'});const response=await f.request('/api/transcribe',{method:'POST',headers:{authorization:'Bearer A','x-citizenship-ai-session':'existing-session'}});assert.equal(response.status,200);assert.deepEqual(await response.json(),{session:'existing-session',authority:'legacy'});assert.equal(f.calls(),1);});
test('disabled AI and absent identity cannot reach the paid legacy handler',async t=>{const f=await fixture(t);assert.equal((await f.request('/api/transcribe',{method:'POST',headers:{authorization:'Bearer A'}})).status,503);assert.equal(f.calls(),0);const g=await fixture(t,{PLATFORM_AI_ENABLED:'true'});assert.equal((await g.request('/api/transcribe',{method:'POST'})).status,401);assert.equal(g.calls(),0);});
test('access snapshot derives ownership exclusively from verified identity',async t=>{const f=await fixture(t);assert.equal((await f.request('/api/v1/me/access')).status,401);for(const id of ['A','B']){const r=await f.request('/api/v1/me/access?userId=attacker&tier=pro',{headers:{authorization:'Bearer '+id}});const body=await r.json();assert.equal(body.identity,id);assert.equal(body.citizenship.usage.owner,id);assert.equal(body.asylum.ready,false);}assert.deepEqual(f.usageUsers,['A','B']);});
test('asylum session uses shared identity; missing model and unapproved grants stay unavailable',async t=>{const f=await fixture(t,{PLATFORM_AI_ENABLED:'true',OPENAI_API_KEY:'mock',SUPABASE_URL:'mock',SUPABASE_SECRET_KEY:'mock'});assert.equal((await f.request('/api/asylum/session')).status,401);assert.equal((await f.request('/api/asylum/session',{headers:{authorization:'Bearer A'}})).status,200);assert.equal((await (await f.request('/api/asylum/status')).json()).reason,'AI_NOT_CONFIGURED');assert.equal((await (await f.request('/api/realtime/status')).json()).reason,'MODULE_POLICY_NOT_CONFIGURED');assert.equal((await f.request('/api/realtime/session',{method:'POST',headers:{authorization:'Bearer A'}})).status,503);});
test('webhook raw body survives mounting and untrusted browser origins are rejected',async t=>{const f=await fixture(t);const raw='{ "id": "synthetic-event" }';const r=await f.request('/api/billing/webhook',{method:'POST',headers:{'content-type':'application/json'},body:raw});assert.equal((await r.json()).raw,raw);assert.equal((await f.request('/api/account/public-config',{headers:{origin:'https://untrusted.invalid'}})).status,403);});

test('configured ImmigrationAI origin is allowed and unrelated origins are rejected',async t=>{
 const f=await fixture(t,{CORS_ORIGIN:'https://immigration-ai-e590.onrender.com'});
 assert.equal((await f.request('/api/account/public-config',{headers:{origin:'https://immigration-ai-e590.onrender.com'}})).status,200);
 assert.equal((await f.request('/api/account/public-config',{headers:{origin:'https://citizenshipai.us'}})).status,403);
});

test('asylum validates consent before quota and charges only verified identity',async t=>{
 const owners=[];let paid=0,allow=true,fail=false;
 const f=await fixture(t,{PLATFORM_AI_ENABLED:'true',OPENAI_API_KEY:'mock',OPENAI_TEXT_MODEL:'mock',SUPABASE_URL:'mock',SUPABASE_SECRET_KEY:'mock'},{reserveAsylumQuota:async id=>{owners.push(id);if(fail)throw Error('offline');return allow;},analysisFetch:async()=>{paid++;return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({excerpts:[{quote:'A fictional event',category:'event'}]})}]}]});}});
 const payload={text:'A fictional event',source_id:'synthetic-test',domain:'synthetic',language:'en',consent:true,consent_version:'ai-excerpts-v1',userId:'attacker'};
 const send=(body,auth=true)=>f.request('/api/asylum/analyze',{method:'POST',headers:{'content-type':'application/json',...(auth?{authorization:'Bearer A'}:{})},body:JSON.stringify(body)});
 assert.equal((await send(payload,false)).status,401);
 assert.equal((await send({...payload,consent:false})).status,400);assert.equal(owners.length,0);
 assert.equal((await send(payload)).status,200);assert.deepEqual(owners,['A']);assert.equal(paid,1);
 allow=false;assert.equal((await send(payload)).status,429);assert.equal(paid,1);
 fail=true;assert.equal((await send(payload)).status,503);assert.equal(paid,1);
});

test('interview feedback supports all personal modules with consent and a shared bounded quota',async t=>{
 let calls=0,allowed=true;const owners=[];
 const f=await fixture(t,{PLATFORM_AI_ENABLED:'true',OPENAI_API_KEY:'mock',OPENAI_TEXT_MODEL:'mock',SUPABASE_URL:'mock',SUPABASE_SECRET_KEY:'mock'},{reserveAsylumQuota:async()=>true,reserveInterviewQuota:async id=>{owners.push(id);return allowed;},analysisFetch:async()=>{calls++;return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({observations:[{quote:'I moved in May',kind:'clear_detail'}]})}]}]});}});
 const payload={module:'asylum',question:'When did you move?',text:'I moved in May',task:'interview_feedback',source_id:'test',domain:'synthetic',language:'en',consent:true,consent_version:'interview-feedback-v1'};
 const send=(body,auth=true)=>f.request('/api/interview/feedback',{method:'POST',headers:{'content-type':'application/json',...(auth?{authorization:'Bearer A'}:{})},body:JSON.stringify(body)});
 assert.equal((await send(payload,false)).status,401);
 assert.equal((await send({...payload,consent:false})).status,400);
 assert.equal((await send({...payload,module:'civics'})).status,400);
 assert.equal((await send({...payload,task:'excerpts'})).status,400);
 assert.equal(calls,0);assert.equal(owners.length,0);
 for(const module of ['asylum','n400','residency']){const r=await send({...payload,module});assert.equal(r.status,200);assert.equal((await r.json()).observations[0].kind,'clear_detail');}
 assert.deepEqual(owners,['A','A','A']);assert.equal(calls,3);
 allowed=false;assert.equal((await send(payload)).status,429);assert.equal(calls,3);
});

test('temporary public interviews retain signed ownership, quota and origin protections',async t=>{
 const f=await fixture(t,{PLATFORM_AI_ENABLED:'true',OPENAI_API_KEY:'mock'},{reserveConversationQuota:async()=>true,reserveInterviewQuota:async()=>true});
 const options={method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({module:'asylum',locale:'es',consent:true,transport:'text'})};
 const start=await f.request('/api/interview/sessions',options);assert.equal(start.status,200);
 const session=await start.json(),cookie=start.headers.get('set-cookie').split(';')[0];
 assert.equal((await f.request('/api/interview/sessions/'+session.id,{method:'DELETE'})).status,401);
 assert.equal((await f.request('/api/interview/sessions/'+session.id,{method:'DELETE',headers:{cookie}})).status,204);
 assert.equal((await f.request('/api/interview/sessions',{...options,headers:{...options.headers,origin:'https://evil.example'}})).status,403);
 assert.equal((await f.request('/api/v1/me/access',{headers:{cookie}})).status,401);
 const off=await fixture(t,{INTERVIEW_PUBLIC_ACCESS:'false',PLATFORM_AI_ENABLED:'true',OPENAI_API_KEY:'mock'},{reserveConversationQuota:async()=>true,reserveInterviewQuota:async()=>true});
 assert.equal((await off.request('/api/interview/sessions',options)).status,401);
});
