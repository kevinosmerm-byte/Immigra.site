import test from 'node:test';
import assert from 'node:assert/strict';
import {eligible,installAds,initAdsConsent} from '../public/google-ads.mjs';
test('Ads exclude app, native, local, query strings and fragment screens',()=>{
 for(const u of ['https://immigra.site/','https://immigra.site/#/account','https://immigra.site/asilo?email=private','https://immigra.site/asilo#private','capacitor://localhost/asilo','http://localhost/asilo'])assert.equal(eligible(new URL(u)),false);
 assert.equal(eligible(new URL('https://immigra.site/en/asylum')),true);
 assert.equal(eligible(new URL('https://immigra.site/en/asylum?gclid=example-123')),true);
});
test('tag is loaded once with denied defaults before configuration and no personal data',()=>{
 const scripts=[],win={location:new URL('https://immigra.site/asilo')},doc={getElementById:()=>scripts[0],createElement:()=>({}),head:{append:x=>scripts.push(x)}};
 assert.equal(installAds(win,doc),true);assert.equal(installAds(win,doc),false);assert.equal(scripts.length,1);
 const calls=win.dataLayer.map(x=>Array.from(x));assert.equal(calls[0][0],'consent');assert.equal(calls[0][1],'default');assert.equal(calls[0][2].ad_storage,'denied');
 const config=calls.find(c=>c[0]==='config');assert.equal(config[1],'AW-17910999514');assert.equal(config[2].allow_ad_personalization_signals,false);assert.equal(config[2].page_referrer,'');
});
test('unanswered or declined consent loads no third-party script',()=>{
 for(const choice of [null,'denied']){
  let loads=0;const node=()=>({setAttribute(){},addEventListener(){},append(){}});
  const doc={documentElement:{lang:'es'},createElement:node,body:node(),querySelector:()=>node(),head:{append(){loads++;}}};
  initAdsConsent({location:new URL('https://immigra.site/asilo'),localStorage:{getItem:()=>choice}},doc);assert.equal(loads,0);
 }
});
