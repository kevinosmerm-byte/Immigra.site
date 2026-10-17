import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createDemoAccess} from '../services/ai/demo-access.mjs';
function fixture(){
 let clock=Date.now();const rows=new Map();
 const api=createDemoAccess({secret:'test-only-secret',now:()=>clock,limit:async()=>true,reserve:async(id,key,feature)=>{const r=rows.get(id)||new Map();rows.set(id,r);if(r.has(key))return r.get(key);if(r.size===2)return {allowed:false,reason:'account_required'};const v={allowed:true,remaining:1-r.size,expiresAt:new Date(clock+600000).toISOString(),feature};r.set(key,v);return v;}});
 let cookie='';
 const response=()=>({code:200,headers:{},status(n){this.code=n;return this;},json(v){this.body=v;return this;},setHeader(k,v){this.headers[k]=v;if(k==='Set-Cookie')cookie=v.split(';')[0];}});
 const req=()=>({headers:{cookie},ip:'127.0.0.1',body:{feature:'realInterview',requestId:randomUUID()}});
 return {api,req,response,rows,cookie:()=>cookie,setCookie:c=>cookie=c,advance:()=>clock+=600001};
}
test('two demo reservations allowed, third requests email; persistence is server-side',async()=>{
 const f=fixture();for(let i=0;i<2;i++){const r=f.response();await f.api.start(f.req(),r);assert.equal(r.code,200);assert.equal(r.body.remaining,1-i);assert.match(r.headers['Set-Cookie'],/HttpOnly; Secure; SameSite=Strict/);}
 const r=f.response();await f.api.start(f.req(),r);assert.equal(r.code,403);assert.equal(r.body.code,'account_required');assert.equal(f.rows.size,1);
});
test('idempotent retry does not consume a second use',async()=>{
 const f=fixture(),r=f.response(),q=f.req();await f.api.start(q,r);q.headers.cookie=f.cookie();const r2=f.response();await f.api.start(q,r2);assert.equal(r2.body.remaining,1);
});
test('authorized lease attaches identity and cannot cross features or survive expiry',async()=>{
 const f=fixture();await f.api.start(f.req(),f.response());let calls=0;const q=f.req();await f.api.authorize(['realInterview'])(q,f.response(),()=>calls++);assert.equal(calls,1);assert.equal(q.demoVerified,true);assert.match(q.account.userId,/^guest:/);
 const mismatch=f.response();await f.api.authorize(['writing'])(f.req(),mismatch,()=>calls++);assert.equal(mismatch.code,403);
 f.advance();const expired=f.response();await f.api.authorize(['realInterview'])(f.req(),expired,()=>calls++);assert.equal(expired.code,401);assert.equal(calls,1);
});
test('modified cookies and missing configuration never authorize paid requests',async()=>{
 const f=fixture();await f.api.start(f.req(),f.response());f.setCookie(f.cookie()+'tampered');const r=f.response();await f.api.authorize()(f.req(),r,()=>assert.fail());assert.equal(r.code,401);
 const unavailable=f.response();await createDemoAccess({}).start(f.req(),unavailable);assert.equal(unavailable.code,503);
});
test('database failure fails closed and no provider is reached',async()=>{
 const f=fixture(),r=f.response();await createDemoAccess({secret:'test',limit:async()=>true,reserve:async()=>{throw Error('db');}}).start(f.req(),r);assert.equal(r.code,503);
});
test('signed identity survives lease expiry and keeps the same demo counter',async()=>{
 const f=fixture();await f.api.start(f.req(),f.response());f.advance();await f.api.start(f.req(),f.response());f.advance();const r=f.response();await f.api.start(f.req(),r);assert.equal(r.code,403);assert.equal(f.rows.size,1);
});
