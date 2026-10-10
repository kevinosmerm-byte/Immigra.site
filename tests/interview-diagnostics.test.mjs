import test from 'node:test';
import assert from 'node:assert/strict';
import {safeDiagnostic} from '../shared/interview-ui/diagnostics.mjs';
import {createGuestAccess} from '../services/ai/guest-access.mjs';
test('diagnostics discard arbitrary content and identifiers',()=>{
 const d=safeDiagnostic('INTERVIEW_ERROR',{code:'PROVIDER_AUTH_FAILED',status:401,transcript:'private',token:'secret',userId:'private',message:'secret'});
 assert.deepEqual(d,{phase:'INTERVIEW_ERROR',code:'PROVIDER_AUTH_FAILED',status:401});
 assert.equal(safeDiagnostic('private text'),null);
});
test('guest identity is signed, isolated and unavailable for account routes',()=>{
 const middleware=createGuestAccess({secret:'test-only'});let cookie;
 const res={setHeader:(k,v)=>cookie=v,status(n){this.code=n;return this;},json(){}};
 const req={path:'/api/interview/sessions',headers:{}};let calls=0;
 middleware(req,res,()=>calls++);assert.equal(calls,1);assert.match(cookie,/HttpOnly; Secure; SameSite=Strict/);
 const next={path:'/api/interview/sessions/x/turn',headers:{cookie:cookie.split(';')[0]}};
 middleware(next,res,()=>calls++);assert.equal(next.account.userId,req.account.userId);
 middleware({path:'/api/interview/sessions/x/turn',headers:{cookie:cookie.replace(/.$/,'x').split(';')[0].replace('=','=bad')}},res,()=>calls++);
 assert.equal(calls,2);assert.equal(res.code,401);
 middleware({path:'/api/account',headers:{}},res,()=>calls++);assert.equal(calls,2);
});
