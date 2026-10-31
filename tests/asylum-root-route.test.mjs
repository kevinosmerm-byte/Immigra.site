import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {homeStudyEntryRoutes} from '../src/home-study.mjs';

test('selected Asylum enters the restored prior main screen directly without an extra root hop',()=>{
 assert.equal(homeStudyEntryRoutes.asylum,'asylum/practice');
 assert.equal(homeStudyEntryRoutes.citizenship,'citizenship');
 assert.equal(homeStudyEntryRoutes.residency,'residency');
 const destination='#/'+homeStudyEntryRoutes.asylum;
 assert.equal(/^#\/asylum\/?$/.test(destination),false,'direct homepage action does not trigger legacy root normalization');
});
test('Asylum Inicio and direct root retain the original practice homepage and setup gates',()=>{
 const source=readFileSync(new URL('../modules/asylum/Module.jsx',import.meta.url),'utf8');
 assert.match(source,/\['practice','Inicio'\]/);
 assert.match(source,/\['practice','Home'\]/);
 assert.match(source,/window.location.hash='\/asylum\/practice'/);
 assert.match(source,/route==='practice'&&!call/);
 assert.match(source,/<AsylumPreparation/);
 assert.match(source,/removeEventListener\('hashchange',sync\)/);
});
