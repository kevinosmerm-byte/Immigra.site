import test from 'node:test';
import assert from 'node:assert/strict';
import {createPersistentSessionService,WEB_SESSION_TOKEN} from '../server/persistentSessionService.js';
function fixture(){
 let now=1780000000000,revoked=false,refreshes=0,cookie='';const user={id:'owner',email:'owner@example.com',email_confirmed_at:'2026-01-01'};
 const token=()=>`header.${Buffer.from(JSON.stringify({exp:Math.floor(now/1000)+3600})).toString('base64url')}.fixture`;
 const options={secret:'fixture-only-secret',now:()=>now,validate:async()=>revoked?{error:Error('revoked')}:{data:{user}},refresh:async()=>{refreshes++;return revoked?{error:Error('revoked')}:{data:{session:{access_token:token(),refresh_token:'rotated',expires_at:now/1000+3600}}};},revoke:async()=>{revoked=true;}};
 const res={setHeader:(key,value)=>{cookie=value;}};return {service:createPersistentSessionService(options),options,res,req:()=>({headers:{cookie}}),cookie:()=>cookie,token,advance:ms=>{now+=ms;},refreshes:()=>refreshes};
}
test('verified session survives server restart using encrypted HttpOnly cookie without exposing tokens',async()=>{
 const f=fixture();const session=await f.service.exchange(f.res,{access_token:f.token(),refresh_token:'private-refresh'});
 assert.equal(session.access_token,WEB_SESSION_TOKEN);assert.equal(session.refresh_token,undefined);assert.match(f.cookie(),/HttpOnly; Secure; SameSite=Strict/);assert.ok(!f.cookie().includes('private-refresh'));
 const restarted=createPersistentSessionService(f.options);assert.equal((await restarted.restore(f.req(),f.res)).user.email,'owner@example.com');
 const forged={headers:{cookie:f.cookie().replace('__Host-immigra_session=','__Host-immigra_session=x')}};assert.equal(await restarted.restore(forged,f.res),null);
});
test('expired access is renewed once for concurrent requests and sign out clears and revokes persistence',async()=>{
 const f=fixture();await f.service.exchange(f.res,{access_token:f.token(),refresh_token:'old-refresh'});f.advance(3600000);const req=f.req();
 const sessions=await Promise.all([f.service.restore(req,f.res),f.service.restore(req,f.res)]);assert.ok(sessions.every(Boolean));assert.equal(f.refreshes(),1);
 const saved=f.req();await f.service.logout(saved,f.res);assert.match(f.cookie(),/Max-Age=0/);assert.equal(await f.service.restore(saved,f.res),null);
});
test('refresh rejection and unconfirmed identities cannot persist verified access',async()=>{
 const f=fixture();const service=createPersistentSessionService({...f.options,validate:async()=>({data:{user:{email_confirmed_at:null}}})});await assert.rejects(service.exchange(f.res,{access_token:f.token(),refresh_token:'r'}),{status:401});
 await f.service.exchange(f.res,{access_token:f.token(),refresh_token:'r'});f.advance(3600000);const broken=createPersistentSessionService({...f.options,refresh:async()=>({error:Error('expired')})});assert.equal(await broken.restore(f.req(),f.res),null);assert.match(f.cookie(),/Max-Age=0/);
});
test('provider outages preserve the saved cookie for a later retry',async()=>{
 const f=fixture();await f.service.exchange(f.res,{access_token:f.token(),refresh_token:'r'});const saved=f.cookie();f.advance(3600000);
 const outage=createPersistentSessionService({...f.options,refresh:async()=>({error:{name:'AuthRetryableFetchError',status:503}})});
 await assert.rejects(outage.restore(f.req(),f.res),/temporarily unavailable/);assert.equal(f.cookie(),saved);
});
