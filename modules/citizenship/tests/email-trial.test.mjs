import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmailTrialService,EMAIL_TRIAL_TOKEN} from '../server/emailTrialService.js';
import {requireVerifiedAccount} from '../server/accountService.js';
function fixture(){
 let clock=1780000000000;const users=new Map(),attributes=[];let counter=0;
 const admin={createUser:async input=>{attributes.push(input);if([...users.values()].some(u=>u.email===input.email))return {error:{code:'email_exists'}};const user={id:`10000000-0000-4000-8000-${String(++counter).padStart(12,'0')}`,email:input.email,app_metadata:input.app_metadata,email_confirmed_at:null};users.set(user.id,user);return {data:{user}};},getUserById:async id=>({data:{user:users.get(id)}})};
 const service=createEmailTrialService({admin,secret:'fixture-only-server-secret',now:()=>clock});let cookie='';const res={setHeader:(key,value)=>{if(key==='Set-Cookie')cookie=value;}};
 return {service,admin,now:()=>clock,users,attributes,res,req:()=>({headers:{cookie}}),cookie:()=>cookie,advance:ms=>{clock+=ms;}};
}
test('email entry creates an unverified identity and protected cookie without mail delivery',async()=>{
 const f=fixture();const session=await f.service.register(f.req(),f.res,' Learner@Example.com ');
 assert.equal(session.user.email,'learner@example.com');assert.equal(session.access_token,EMAIL_TRIAL_TOKEN);assert.equal(session.isEmailTrial,true);assert.equal(f.attributes[0].email_confirm,false);assert.ok(f.attributes[0].password.length>=48);assert.match(f.cookie(),/HttpOnly; Secure; SameSite=Strict/);assert.equal((await f.service.user(f.req())).id,session.user.id);
 const same=await f.service.register(f.req(),f.res,'learner@example.com');assert.equal(same.user.id,session.user.id);assert.equal(f.users.size,1);
});
test('invalid email, forged cookies and expired cookies cannot authorize a trial',async()=>{
 const f=fixture();await assert.rejects(f.service.register(f.req(),f.res,'not-an-email'),{code:'invalid_email'});assert.equal(f.users.size,0);await f.service.register(f.req(),f.res,'learner@example.com');assert.equal(await f.service.user({headers:{cookie:f.cookie().replace('10000000','20000000')}}),null);f.advance(90*86400000);assert.equal(await f.service.user(f.req()),null);
});
test('another device cannot claim an existing identity and confirmation revokes the trial cookie',async()=>{
 const f=fixture();const session=await f.service.register(f.req(),f.res,'learner@example.com');await assert.rejects(f.service.register({headers:{}},f.res,'learner@example.com'),{code:'verification_required'});f.users.get(session.user.id).email_confirmed_at=new Date().toISOString();assert.equal(await f.service.user(f.req()),null);
});
test('trial identity cannot access private account data or billing',()=>{
 let status,body,called=false;const res={status:s=>{status=s;return res;},json:value=>{body=value;}};requireVerifiedAccount({account:{emailTrial:true}},res,()=>{called=true;});assert.equal(status,401);assert.equal(body.code,'verification_required');assert.equal(called,false);requireVerifiedAccount({account:{emailTrial:false}},res,()=>{called=true;});assert.equal(called,true);
});

test('device cookie restores the same identity after server restart and seven days without extending access',async()=>{
 const f=fixture();const original=await f.service.register(f.req(),f.res,'remember@example.com');const saved=f.cookie();
 assert.match(saved,/Max-Age=7776000/);f.advance(8*86400000);
 const restored=createEmailTrialService({admin:f.admin,secret:'fixture-only-server-secret',now:f.now});
 const owner=await restored.user(f.req());assert.equal(owner.id,original.user.id);assert.equal(restored.session(owner).user.email,original.user.email);
 assert.equal(f.cookie(),saved);assert.equal(f.attributes.length,1);
 restored.clear(f.res);assert.match(f.cookie(),/Max-Age=0/);assert.equal(await restored.user(f.req()),null);
});

test('native trial credentials are signed and restore without third-party cookies',async()=>{
 const f=fixture(),req={headers:{'x-immigra-client':'native'}};const session=await f.service.register(req,f.res,'native@example.com');assert.ok(session.access_token.startsWith(EMAIL_TRIAL_TOKEN+'.'));assert.equal(session.access_token.includes('native@example.com'),false);
 const restored=await f.service.user({headers:{authorization:'Bearer '+session.access_token}});assert.equal(restored.id,session.user.id);
 const forged=session.access_token.replace('10000000','20000000');assert.equal(await f.service.user({headers:{authorization:'Bearer '+forged}}),null);assert.equal(await f.service.user({headers:{authorization:'Bearer '+EMAIL_TRIAL_TOKEN}}),null);
 f.users.get(restored.id).email_confirmed_at=new Date().toISOString();assert.equal(await f.service.user({headers:{authorization:'Bearer '+session.access_token}}),null);
});
