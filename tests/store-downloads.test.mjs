import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const component=read('src/StoreDownloads.jsx').toString();
const css=read('src/StoreDownloads.css').toString();
test('store badges retain exact approved originals',()=>{
 for(const [path,hash] of [
  ['google-play.svg','4ffa4c7edd2f10b297ca4de2131eddaa00d03b2278d1e178fe512920d824ca34'],
  ['app-store.png','5f619ea733ed675b980fca4b20d5783ba29fff2e3ac96356c673cbacb969c088'],
 ])assert.equal(createHash('sha256').update(read('public/images/stores/'+path)).digest('hex'),hash);
});
test('Android and iPhone link to the published listings in both languages',()=>{
 assert.match(component,/https:\/\/play.google.com\/store\/apps\/details\?id=us.citizenshipai.app/);
 assert.ok(component.includes('https://apps.apple.com/us/app/immigra-interview-practice/id6814679992'));
 assert.match(component,/href=\{appStoreUrl\}/);
 assert.match(component,/'Descargar para iPhone', 'Download for iPhone'/);
 assert.match(component,/alt="Google Play"/);
 assert.match(component,/alt="App Store"/);
});
test('equal badge slots and height preserve aspect ratios and visible keyboard focus',()=>{
 assert.match(css,/\.store-badge-frame\{[^}]*width:184px;height:54px/);
 assert.match(css,/\.store-badge-google\{[^}]*width:auto;height:54px/);
 assert.match(css,/\.store-badge-apple-crop\{[^}]*width:160px;height:54px;overflow:hidden/);
 assert.match(css,/focus-visible\{outline:3px/);
});
