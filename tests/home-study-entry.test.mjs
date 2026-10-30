import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freeStudyRoutes} from '../src/home-study.mjs';
import {residencyStudyRoute} from '../modules/residency/src/study-route.mjs';
import {moduleFromHash} from '../shared/navigation/routes.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('three study actions go directly to existing free views in their own module',()=>{
 assert.deepEqual(freeStudyRoutes,{citizenship:'citizenship/civics',asylum:'asylum/full-bank',residency:'residency/study'});
 for(const [module,path] of Object.entries(freeStudyRoutes))assert.equal(moduleFromHash('#/'+path),module);
 const home=read('src/ImmigraHome.jsx');
 assert.match(home,/onNavigate\(freeStudyRoutes\[choice.id\]\)/);
 assert.equal((home.match(/onNavigate\(freeStudyRoutes\[choice.id\]\)/g)||[]).length,1,'one direct study action per card');
 assert.doesNotMatch(home,/InterviewPreview|ih-features|ih-highlights|setTimeout|setInterval|useState|useReducer/);
 assert.match(home,/Comienza a/);assert.match(home,/studying /);
 assert.match(home,/AI interviews have separate access requirements/);
 assert.match(home,/aria-label=\{`\$\{t\('Estudiar','Study'\)\} \$\{choice.title\}`\}/);
});
test('free study entry does not start recording, AI evaluation or bypass consent',()=>{
 const home=read('src/ImmigraHome.jsx');
 assert.doesNotMatch(home,/getUserMedia|MediaRecorder|fetch\(|apiFetch|authenticatedFetch|speakAppText|<textarea|<input|<video/);
 const residency=read('modules/residency/src/Residency.jsx');
 assert.match(residency,/required checked=\{consent\}/);
 assert.match(residency,/<LegacyResidency \{\.\.\.props\}\/>/);
 assert.match(read('modules/residency/src/AosPractice.jsx'),/PremiumPracticeBoundary feature="realInterview"/);
 assert.match(read('modules/asylum/Module.jsx'),/route==='full-bank'&&!call&&<AsylumStudyBook/);
 assert.match(read('modules/citizenship/src/App.jsx'),/screen === "civics"/);
});
test('residency study deep link and browser history preserve hidden module work',()=>{
 assert.equal(residencyStudyRoute('#/residency/study'),true);
 assert.equal(residencyStudyRoute('#/residency'),false);
 for(const path of ['#/asylum','#/citizenship/civics','#/','#/residency/not-study'])assert.equal(residencyStudyRoute(path),null);
 const source=read('modules/residency/src/Residency.jsx');
 assert.match(source,/if\(study!==null\)setLegacy\(study\)/);
 assert.match(source,/removeEventListener\('hashchange',sync\)/);
});
test('compact cards remain readable on narrow screens and companion cannot cover CTAs',()=>{
 const css=read('src/ImmigraHome.css');
 assert.match(css,/@media\(max-width:700px\).*ih-study-options\{grid-template-columns:1fr/s);
 assert.match(css,/min-height:52px/);
 assert.match(css,/html\[data-experience="web"\] #root:has\(\.immigra-home\) citizenship-companion\.platform-study-companion\{position:relative;display:block;inset:auto;z-index:auto;/);
 assert.doesNotMatch(css,/line-clamp|text-overflow:ellipsis/);
 assert.match(read('src/style.css'),/citizenship-companion.platform-study-companion \{\s*position: fixed;/);
 assert.match(read('src/main.jsx'),/citizenship-companion class="platform-study-companion"/);
});
