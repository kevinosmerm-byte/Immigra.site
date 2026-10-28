import test from 'node:test';
import assert from 'node:assert/strict';
import {publicPages,publicPageHtml} from '../scripts/public-pages.mjs';
import {seoPages,siteOrigin} from '../shared/seo-pages.mjs';
import {emitSeoEvent} from '../public/seo-events.mjs';

test('every public page has unique metadata, canonical, reciprocal language links and parseable schema',()=>{
 const titles=new Set();
 for(const p of publicPages){
  const html=publicPageHtml(p,'/assets/app.css');
  const title=html.match(/<title>(.*?)<\/title>/)[1];
  assert.ok(!titles.has(title),title);titles.add(title);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
  assert.ok(html.includes(`rel="canonical" href="${siteOrigin}/${p[0]}"`));
  for(const name of ['og:title','og:description','og:image','twitter:title','twitter:description','twitter:image'])assert.ok(html.includes(`="${name}"`),name);
  for(const lang of ['es','en','x-default'])assert.ok(html.includes(`hreflang="${lang}"`));
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.ok(schema['@graph'].some(n=>n['@type']==='BreadcrumbList'));
  assert.doesNotMatch(JSON.stringify(schema),/aggregateRating|reviewCount|"price"/);
 }
});
test('landing pages use working module links and visible independent educational content',()=>{
 for(const p of seoPages){
  const html=publicPageHtml([p.path,p.lang,p.heading],'');
  assert.ok(html.includes(`href="/?lang=${p.lang}#/${p.module}"`));
  assert.ok(html.includes(`href="/${p.alternate}"`));
  assert.ok(html.includes('https://www.uscis.gov/'));
  assert.equal((html.match(/<details open>/g)||[]).length,3);
  assert.doesNotMatch(html,/display:none|type="password"|<form/);
 }
});
test('analytics is opt-in and drops all non-allowlisted data',()=>{
 const events=[];const oldWindow=globalThis.window,oldCustom=globalThis.CustomEvent;
 globalThis.window={dispatchEvent:e=>events.push(e)};
 globalThis.CustomEvent=class {constructor(type,options){this.type=type;this.detail=options.detail;}};
 try{
  assert.equal(emitSeoEvent('seo_page_view',{email:'private'}),false);
  window.immigraAnalyticsConsent=true;
  assert.equal(emitSeoEvent('unknown'),false);
  emitSeoEvent('interview_start',{language:'es',module:'asylum',email:'private',answer:'sensitive',url:'secret'});
  assert.deepEqual(events[0].detail,{event:'interview_start',language:'es',module:'asylum'});
 }finally{if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;if(oldCustom===undefined)delete globalThis.CustomEvent;else globalThis.CustomEvent=oldCustom;}
});
