import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {heroExamples,freeStudyRoutes,initialHeroDemo,heroDemoReducer as reduce} from '../src/hero-demo.mjs';
import {residencyStudyRoute} from '../modules/residency/src/study-route.mjs';
import {moduleFromHash} from '../shared/navigation/routes.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('demo is explicit, finite, replayable and pauses on manual step selection',()=>{
 let state=initialHeroDemo();assert.equal(state.playing,false);
 state=reduce(state,{type:'play'});assert.equal(state.step,0);
 state=reduce(state,{type:'tick',revision:state.revision});assert.equal(state.step,1);
 state=reduce(state,{type:'tick',revision:state.revision});assert.equal(state.step,2);assert.equal(state.playing,false);
 state=reduce(state,{type:'replay'});assert.equal(state.step,0);assert.equal(state.playing,true);
 state=reduce(state,{type:'step',step:2});assert.equal(state.playing,false);assert.equal(state.step,2);
 assert.equal(reduce(state,{type:'step',step:99}),state);
});
test('old callbacks cannot advance paused, replayed, translated or changed-route demos',()=>{
 const playing=reduce(initialHeroDemo(),{type:'play'});
 for(const action of [{type:'pause'},{type:'reset'},{type:'replay'},{type:'route',route:'residency'},{type:'step',step:1}]){
  const next=reduce(playing,action);assert.equal(reduce(next,{type:'tick',revision:playing.revision}),next);
 }
 let state=playing;for(let i=0;i<50;i++)state=reduce(state,{type:'replay'});
 assert.equal(state.step,0);assert.equal(reduce(state,{type:'tick',revision:playing.revision}),state);
});
test('all three routes have localized specific fictional examples and genuine free entry',()=>{
 for(const route of ['citizenship','asylum','residency']){
  for(const lang of ['es','en'])for(const key of ['question','answer','feedback'])assert.ok(heroExamples[route][lang][key].length>15);
  assert.equal(reduce(initialHeroDemo(),{type:'route',route}).route,route);
  assert.equal(moduleFromHash('#/'+freeStudyRoutes[route]),route);
 }
 assert.deepEqual(freeStudyRoutes,{citizenship:'citizenship/civics',asylum:'asylum/full-bank',residency:'residency/study'});
 assert.match(heroExamples.residency.en.feedback,/year.*month/);
 assert.match(heroExamples.asylum.en.feedback,/Do not guess/);
 assert.match(heroExamples.citizenship.en.feedback,/do not copy/);
 assert.equal(reduce(initialHeroDemo(),{type:'route',route:'unknown'}).route,'asylum');
});
test('home demo cannot record, call providers, collect answers or invent video time',()=>{
 const home=read('src/ImmigraHome.jsx'),data=read('src/hero-demo.mjs');
 assert.doesNotMatch(home+data,/getUserMedia|MediaRecorder|fetch\(|apiFetch|authenticatedFetch|speakAppText|<textarea|<input|<video|0:18|1:24/);
 assert.match(home,/return\(\)=>clearTimeout\(timer\)/);
 assert.match(home,/dispatch\(\{type:'reset'\}\);\},\[lang\]/);
 assert.match(home,/onNavigate\(freeStudyRoutes\[demo.route\]\)/);
 assert.match(home,/Comienza a estudiar gratis/);
 assert.match(home,/AI interviews have separate access requirements/);
 assert.match(home,/no asesoría legal ni garantía de aprobación/);
 assert.match(home,/aria-pressed=\{demo.route===m.id\}/);
 assert.match(home,/aria-current=\{demo.step===i\?'step'/);
});
test('residency study route preserves hidden work and uses existing local consent view',()=>{
 assert.equal(residencyStudyRoute('#/residency/study'),true);
 assert.equal(residencyStudyRoute('#/residency'),false);
 for(const path of ['#/asylum','#/citizenship/civics','#/','#/residency/not-study'])assert.equal(residencyStudyRoute(path),null);
 const source=read('modules/residency/src/Residency.jsx');
 assert.match(source,/if\(study!==null\)setLegacy\(study\)/);
 assert.match(source,/removeEventListener\('hashchange',sync\)/);
 assert.match(source,/required checked=\{consent\}/);
 assert.match(source,/<LegacyResidency \{\.\.\.props\}\/>/);
 const premium=read('modules/residency/src/AosPractice.jsx');
 assert.match(premium,/PremiumPracticeBoundary feature="realInterview"/);
});
test('demo layout and motion safeguards preserve readable responsive content',()=>{
 const css=read('src/ImmigraHome.css'),home=read('src/ImmigraHome.jsx');
 assert.match(css,/@media\(max-width:600px\).*ih-demo-scene\{display:block/s);
 assert.match(css,/ih-demo-cards>div\{[^}]*overflow-wrap:anywhere/);
 assert.match(css,/ih-demo-controls button\{min-width:44px;min-height:44px/);
 assert.match(home,/dataset.reduceMotion==='true'\?'auto':'smooth'/);
 assert.match(home,/if\(document.hidden\)dispatch\(\{type:'pause'\}\)/);
 assert.match(home,/removeEventListener\('visibilitychange',pauseHidden\)/);
 assert.doesNotMatch(css,/line-clamp|text-overflow:ellipsis/);
});
