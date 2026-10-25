import test from 'node:test';
import assert from 'node:assert/strict';
import {sendPayment,initConfirmation} from '../public/payment-confirmation.mjs';
import {applySecurityHeaders} from '../server/security-headers.mjs';
test('Google conversion frame permission is limited to public measurement documents',()=>{
 for(const url of ['/payment-confirmation.html','/asilo','/','/api/account/session']){
  const headers={};applySecurityHeaders({url},{setHeader:(k,v)=>headers[k]=v});
  const frame=headers['Content-Security-Policy'].split('; ').find(v=>v.startsWith('frame-src'));
  assert.equal(frame.includes('https://www.googletagmanager.com'),['/payment-confirmation.html','/asilo'].includes(url));
 }
});
const receipt={transaction_id:'a'.repeat(64),value:24.99,currency:'USD'};
function fixture(url='https://immigra.site/payment-confirmation.html'){
 const scripts=[],storage=new Map(),nodes=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,textContent:'',handlers:{},addEventListener(event,fn){this.handlers[event]=fn;}});return nodes.get(id);};
 const doc={documentElement:{},getElementById:id=>id==='payment-google-tag'?scripts[0]:node(id),createElement:()=>({}),head:{append:s=>scripts.push(s)}};
 const win={location:new URL(url),navigator:{language:'en'},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},fetch:async()=>({ok:true,json:async()=>({receipt})})};
 return {scripts,storage,node,doc,win};
}
test('no tag before explicit payment consent; declining never loads it',async()=>{
 const f=fixture();await initConfirmation(f.win,f.doc);assert.equal(f.scripts.length,0);assert.equal(f.node('measurement').hidden,false);
 f.node('decline').handlers.click();assert.equal(f.scripts.length,0);
 await initConfirmation(f.win,f.doc);assert.equal(f.node('measurement').hidden,true);
});
test('confirmed payment uses exact value and opaque dedup key without account or session data',()=>{
 const f=fixture();assert.equal(sendPayment(f.win,f.doc,receipt),true);assert.equal(sendPayment(f.win,f.doc,receipt),false);
 const events=f.win.dataLayer.map(x=>Array.from(x)),conversion=events.find(x=>x[0]==='event')[2];
 assert.equal(conversion.send_to,'AW-17910999514/oryYCMy6yKkdENrT0NxC');assert.equal(conversion.value,24.99);assert.equal(conversion.transaction_id,receipt.transaction_id);
 assert.equal(events[0][2].ad_storage,'denied');assert.equal(events.find(x=>x[0]==='config')[2].page_referrer,'');
 conversion.event_callback();f.scripts.length=0;assert.equal(sendPayment(f.win,f.doc,receipt),false);
});
test('no event on private/native/query URLs, invalid receipts, or missing confirmation',async()=>{
 for(const url of ['https://immigra.site/#/account','https://immigra.site/payment-confirmation.html?session_id=private','https://immigra.site/payment-confirmation.html#private','capacitor://localhost/payment-confirmation.html']){const f=fixture(url);assert.equal(sendPayment(f.win,f.doc,receipt),false);assert.equal(f.scripts.length,0);}
 for(const r of [null,{...receipt,value:0},{...receipt,transaction_id:'cs_live_private'}]){const f=fixture();assert.equal(sendPayment(f.win,f.doc,r),false);}
 const f=fixture();f.win.fetch=async()=>({ok:true,json:async()=>({receipt:null})});await initConfirmation(f.win,f.doc);assert.equal(f.node('measurement').hidden,true);assert.equal(f.scripts.length,0);
});
