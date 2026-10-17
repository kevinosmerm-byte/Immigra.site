import {readFile,access} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {publicPages} from './public-pages.mjs';
const html=await readFile('dist/index.html','utf8');
assert.match(html,/<title>Immigra/);
assert.match(html,/summary_large_image/);
for(const [path] of publicPages){const page=await readFile(`dist/${path}/index.html`,'utf8');assert.match(page,/Immigra/);assert.doesNotMatch(page,/ACCOUNT HOLDER TO ENTER/);}
assert.match(await readFile('dist/robots.txt','utf8'),/Sitemap: https:\/\/immigra.site\/sitemap.xml/);
assert.match(await readFile('dist/sitemap.xml','utf8'),/https:\/\/immigra.site\/privacy/);
const config=await readFile('modules/citizenship/capacitor.config.ts','utf8');assert.match(config,/appName:\s*"Immigra"/);assert.match(config,/webDir:\s*"\.\.\/\.\.\/dist"/);
const metadata=JSON.parse(await readFile('modules/citizenship/app-store/metadata.json','utf8'));
for(const value of Object.values(metadata.localizations))assert.equal(value.name,'Immigra');
for(const key of ['privacyPolicyUrl','supportUrl','marketingUrl'])assert.equal(new URL(metadata.app[key]).origin,'https://immigra.site');
await access('dist/social/immigra-preview-20261015.png');
console.log('Static release checks passed. External payment, store and backup verification remain separate.');
if(process.argv.includes('--production')){
 const checks=JSON.parse(await readFile('docs/launch-readiness.json','utf8'));
 const missing=checks.externalChecks.filter(item=>item.verified!==true);
 if(missing.length){console.error('Production launch verification pending: '+missing.map(item=>item.id).join(', '));process.exitCode=1;}
}
