import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readAsylumRoute} from '../modules/asylum/routes.mjs';

test('explicit asylum module root stays on dashboard; practice deep links retain their meaning',()=>{
 for(const hash of ['#/asylum','#/asylum/','#/asylum?from=home'])assert.equal(readAsylumRoute(hash),'app');
 for(const route of ['app','practice','full-bank','practice-report','case-workspace','fiction','adaptive'])assert.equal(readAsylumRoute('#/asylum/'+route),route);
 for(const hash of ['#/','#/citizenship','#/residency','#/asylum-other'])assert.equal(readAsylumRoute(hash),null);
 const history=['#/','#/asylum','#/asylum/practice','#/asylum','#/'];
 assert.deepEqual(history.map(readAsylumRoute),[null,'app','practice','app',null]);
});
test('module mount and hash sync do not rewrite explicit root or create an extra history entry',()=>{
 const source=readFileSync(new URL('../modules/asylum/Module.jsx',import.meta.url),'utf8');
 assert.match(source,/useState\(\(\)=>readAsylumRoute\(window.location.hash\)\|\|'app'\)/);
 assert.match(source,/const next=readAsylumRoute\(window.location.hash\);if\(next\)setRoute\(next\)/);
 assert.match(source,/removeEventListener\('hashchange',sync\)/);
 const effect=source.slice(source.indexOf('useEffect(()=>'),source.indexOf('const items='));
 assert.doesNotMatch(effect,/location.hash\s*=/);
 assert.match(source,/\['app','Inicio'\]/);
 const runtime=readFileSync(new URL('../modules/asylum/runtime.generated.js',import.meta.url),'utf8');
 assert.match(runtime,/\|\|'app'\);\},set hash/);
 assert.match(runtime,/app:dashboard,practice/);
 assert.match(source,/<AsylumPreparation/,'existing setup and consent remain');
});
