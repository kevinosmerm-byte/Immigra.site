import test from 'node:test';
import assert from 'node:assert/strict';
import express from '../modules/citizenship/node_modules/express/index.js';
import {createBillingRouter} from '../modules/citizenship/server/billingRoutes.js';

test('email-only device access can buy its own subscription while private billing still requires verification',async t=>{
 const calls=[];let policy=true;
 const app=express();app.use(express.json());app.use('/billing',createBillingRouter({
  authenticate:(req,res,next)=>{const token=req.get('authorization');if(!['Bearer trial','Bearer verified'].includes(token))return res.sendStatus(401);req.account={userId:'server-owner',email:'owner@example.test',emailTrial:token==='Bearer trial'};next();},
  verifyAccount:(req,res,next)=>req.account.emailTrial?res.status(401).json({code:'verification_required'}):next(),
  policyReady:async()=>policy,
  checkout:async payload=>{calls.push(payload);return {url:'https://checkout.stripe.com/fixture'};},
  portal:async()=>({url:'https://billing.stripe.com/fixture'}),
 }));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));t.after(()=>{server.closeAllConnections();server.close();});
 const send=(path,token,body={},headers={})=>fetch(`http://127.0.0.1:${server.address().port}/billing/${path}`,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...headers},body:JSON.stringify(body)});
 assert.equal((await send('checkout-session',null,{interval:'monthly'})).status,401);
 for(const interval of ['monthly','annual']){
  const result=await send('checkout-session','trial',{interval,userId:'attacker',email:'other@example.test',price:'untrusted'});
  assert.equal(result.status,201);assert.equal((await result.json()).url,'https://checkout.stripe.com/fixture');
  assert.deepEqual(calls.at(-1),{userId:'server-owner',email:'owner@example.test',interval});
 }
 assert.equal((await send('checkout-session','trial',{interval:'invalid'})).status,400);
 assert.equal((await send('checkout-session','trial',{interval:'monthly'},{'X-Immigra-Client':'native'})).status,403);
 assert.equal((await send('portal-session','trial')).status,401);
 assert.equal((await send('portal-session','verified')).status,201);
 policy=false;assert.equal((await send('checkout-session','trial',{interval:'monthly'})).status,503);assert.equal(calls.length,2);
});
