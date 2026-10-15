import test from 'node:test';
import assert from 'node:assert/strict';
import {applySecurityHeaders} from '../server/security-headers.mjs';
import {createNativeApiFetch} from '../shared/native/api-transport.mjs';
import {moduleFromHash} from '../shared/navigation/routes.mjs';
import {publicPages,publicPageHtml} from '../scripts/public-pages.mjs';
test('production headers restrict executable content and embedding while preserving speech/media transport',()=>{
 const headers={};applySecurityHeaders({}, {setHeader:(key,value)=>headers[key]=value},{production:true});
 assert.match(headers['Content-Security-Policy'],/script-src 'self' 'wasm-unsafe-eval'/);assert.doesNotMatch(headers['Content-Security-Policy'],/script-src[^;]*'unsafe-inline'/);assert.match(headers['Content-Security-Policy'],/script-src[^;]*https:\/\/agent\.d-id\.com/);assert.match(headers['Content-Security-Policy'],/frame-ancestors 'none'/);assert.match(headers['Content-Security-Policy'],/connect-src 'self' https: wss:/);assert.equal(headers['X-Content-Type-Options'],'nosniff');assert.match(headers['Strict-Transport-Security'],/max-age=/);
});
test('native API transport preserves authorization, rewrites only own API calls and never enables cookie transport',async()=>{
 const calls=[],fetcher=createNativeApiFetch(async(...args)=>{calls.push(args);return 'ok'});
 await fetcher('/api/account/usage',{method:'GET',headers:{Authorization:'Bearer fixture'}});assert.equal(calls[0][0],'https://immigra.site/api/account/usage');assert.equal(calls[0][1].headers.get('Authorization'),'Bearer fixture');assert.equal(calls[0][1].headers.get('X-Immigra-Client'),'native');assert.equal(calls[0][1].credentials,'omit');
 await fetcher('/images/test.png');assert.equal(calls[1][0],'/images/test.png');await fetcher('https://provider.example/api/test');assert.equal(calls[2][0],'https://provider.example/api/test');
 for(const origin of ['http://immigra.site','https://user:pass@immigra.site','https://immigra.site/private','https://immigra.site/?secret=test'])assert.throws(()=>createNativeApiFetch(fetch,origin));
});
test('legacy legal links reach settings and public pages expose truthful educational and deletion information',()=>{
 for(const hash of ['#privacy','#/privacy','#terms'])assert.equal(moduleFromHash(hash),'settings');
 for(const page of publicPages){const html=publicPageHtml(page,'/assets/test.css');assert.match(html,/https:\/\/immigra.site\//);assert.match(html,/No somos abogados|We are not lawyers/);assert.match(html,/mailto:info@citizenshipai.us/);assert.doesNotMatch(html,/<script/);}
 const deletion=publicPageHtml(publicPages.find(p=>p[0]==='delete-account'),'/assets/test.css');assert.match(deletion,/Delete account/);assert.match(deletion,/stops future renewal/);assert.match(deletion,/Apple or Google purchases/);
});
