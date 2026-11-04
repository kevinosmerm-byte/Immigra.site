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
test('only Android is linked and iPhone remains coming soon in both languages',()=>{
 assert.match(component,/https:\/\/play.google.com\/store\/apps\/details\?id=us.citizenshipai.app/);
 assert.equal((component.match(/<a /g)||[]).length,1);
 assert.match(component,/<div className="store-downloads-soon">/);
 assert.match(component,/'Próximamente', 'Coming soon'/);
 assert.doesNotMatch(component,/apps.apple.com|itunes.apple.com/);
 assert.match(component,/alt="Google Play"/);
 assert.match(component,/alt="App Store"/);
});
test('equal badge slots and height preserve aspect ratios and visible keyboard focus',()=>{
 assert.match(css,/\.store-badge-frame\{[^}]*width:184px;height:54px/);
 assert.match(css,/\.store-badge-google\{[^}]*width:auto;height:54px/);
 assert.match(css,/\.store-badge-apple-crop\{[^}]*width:160px;height:54px;overflow:hidden/);
 assert.match(css,/focus-visible\{outline:3px/);
});
