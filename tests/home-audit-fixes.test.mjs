import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {isImmutableAsset} from '../shared/asset-cache.mjs';
import {campaignQuery} from '../shared/campaign-query.mjs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
test('aliases retain validated campaign attribution, not arbitrary private inputs',()=>{
 const query=campaignQuery(new URLSearchParams('utm_source=google&utm_medium=cpc&utm_campaign=fall-2026&gclid=Ab_C-123&email=person@example.com&story=private&answer=secret'));
 assert.equal(query,'?utm_source=google&utm_medium=cpc&utm_campaign=fall-2026&gclid=Ab_C-123');
 assert.match(read('start-all.mjs'),/seoRedirect.path\+campaignQuery\(url.searchParams\)/);
});
test('campaign forwarding rejects prose, URLs, duplicate keys and oversized values',()=>{
 for(const value of ['private story','person@example.com','https://example.com','x'.repeat(201),'bad\r\nLocation:evil','<script>'])assert.equal(campaignQuery(new URLSearchParams({utm_campaign:value})), '');
 assert.equal(campaignQuery(new URLSearchParams('utm_source=one&utm_source=two&unknown=ok')), '');
 assert.equal(campaignQuery(new URLSearchParams('gclid=&utm_source=valid')), '?utm_source=valid');
});
test('first explanation click focuses after render; repeat click keeps navigation available',()=>{
 const home=read('src/ImmigraHome.jsx');
 assert.match(home,/useEffect\(\(\)=>\{if\(expanded\)focusAndScroll\(explanation\);\},\[expanded\]\)/);
 assert.match(home,/if\(expanded\)focusAndScroll\(explanation\);else setExpanded\(true\)/);
 assert.match(home,/hidden=\{!expanded\}/);
 assert.doesNotMatch(home,/setExpanded\(true\);scroll\(explanation\)/);
});
test('Continue confirms highlighted language but does not bypass explicit notice acceptance',()=>{
 const welcome=read('src/welcome/WelcomeExperience.jsx');
 assert.doesNotMatch(welcome,/disabled=\{!chosen\}/);
 assert.match(welcome,/setChecked\(false\);setDialog\(true\)/);
 assert.match(welcome,/disabled=\{!checked\}/);
 assert.match(welcome,/if\(checked\)onComplete\(language\)/);
});
test('homepage uses approved artwork derivatives with responsive size choices',()=>{
 const home=read('src/ImmigraHome.jsx');
 assert.match(home,/william-home-640.webp 640w/);
 for(const name of ['citizenship','asylum','residency'])for(const width of [80,160,240])assert.ok(existsSync(new URL(`../public/images/home/${name}-20261014-${width}.webp`,import.meta.url)));
 assert.doesNotMatch(home,/20261014.png|william-home.png/);
});

test('only generated JS/CSS get immutable cache policy',()=>{
 for(const name of ['assets/index-ABcd_123.js','assets/index-D21a-x9Z.css'])assert.equal(isImmutableAsset(name),true);
 for(const name of ['app-boot.js','google-ads.mjs','index.html','assets/app.js','images/home/citizenship-20261014.png','assets/stable-20261014.png','assets/nested/index-ABcd_123.js'])assert.equal(isImmutableAsset(name),false);
});
