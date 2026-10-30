import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {glassQuestions,glassIndex,interviewRoutes,progressRoutes} from '../src/interview-glass-bank.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const banks={civics:JSON.parse(read('modules/citizenship/src/data/uscis2025Civics.json')),asylum:read('modules/asylum/master-package/03_question_bank/question_bank.jsonl').trim().split(/\r?\n/).map(line=>JSON.parse(line)),residency:JSON.parse(read('modules/residency/data/questions.json'))};
test('all displayed questions come verbatim from existing bilingual banks',()=>{
 const civics=glassQuestions('citizenship',banks);assert.equal(civics.length,128);
 civics.forEach((q,i)=>{assert.equal(q.en,banks.civics.questions[i].question);assert.equal(q.es,banks.civics.questions[i].spanish);});
 const asylum=glassQuestions('asylum',banks);assert.equal(asylum.length,banks.asylum.length);asylum.forEach((q,i)=>{assert.equal(q.en,banks.asylum[i].question_en);assert.equal(q.es,banks.asylum[i].question_es);});
 const residency=glassQuestions('residency',banks);assert.ok(residency.length>3);residency.forEach(q=>{for(const lang of ['es','en'])assert.equal(q[lang],banks.residency.find(row=>row.id===q.id+'-'+lang).question);});
 assert.deepEqual(glassQuestions('unknown',banks),[]);
});
test('navigation is bounded and progress uses actual selected-bank length',()=>{
 for(const category of ['citizenship','asylum','residency']){const length=glassQuestions(category,banks).length;assert.equal(glassIndex(0,-1,length),0);assert.equal(glassIndex(length-1,1,length),length-1);let i=0;for(let n=0;n<1000;n++)i=glassIndex(i,1,length);assert.equal(i,length-1);}
 const source=read('src/InterviewGlassDemo.jsx');assert.match(source,/max=\{list.length\}/);assert.match(source,/setCategory\(value\);setIndex\(0\)/);assert.match(source,/ArrowRight/);
});
test('reader cancels stale results across navigation language visibility and unmount',()=>{
 const source=read('src/InterviewGlassDemo.jsx');assert.match(source,/token!==generation.current/);assert.match(source,/\[category,index,lang\]/);assert.match(source,/return\(\)=>\{generation.current\+\+;void stopAppSpeech/);assert.match(source,/if\(document.hidden\)stop\(\)/);assert.match(source,/requireLanguageVoice:true/);assert.match(source,/setSpeaking\(false\);setError\(!ok\)/);assert.doesNotMatch(source,/setInterval|SpeechRecognition|MediaRecorder|getUserMedia|fetch\(/);
});
test('microphone and side controls enter real existing consent or study flows',()=>{
 assert.deepEqual(interviewRoutes,{citizenship:'citizenship/practice',asylum:'asylum/practice',residency:'residency'});assert.equal(progressRoutes.residency,'residency/study');
 const source=read('src/InterviewGlassDemo.jsx');assert.match(source,/go\(interviewRoutes\[category\]\)/);assert.match(source,/go\(freeStudyRoutes\[category\]\)/);assert.match(source,/go\(progressRoutes\[category\]\)/);assert.match(source,/microphone does not start/);assert.match(source,/No recording here/);
});
test('source HTML glass materials remain three ribbons two panes and original effects',()=>{
 const css=read('src/InterviewGlassDemo.css'),source=read('src/InterviewGlassDemo.jsx');
 for(const name of ['ribbon one','ribbon two','ribbon three','pane-back','pane-back second'])assert.ok(source.includes(name));
 for(const original of ['perspective:1400px','backdrop-filter:blur(28px) saturate(140%)','transform:rotate(-4deg)','transform:rotate(63deg)','background:rgba(255,255,255,.54)'])assert.ok(css.includes(original),original);
 assert.doesNotMatch(css,/data:image|matrix3d|clip-path/);assert.match(css,/pointer-events:none/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/data-reduce-transparency=true/);assert.match(css,/min-width:44px;min-height:44px/);
});
test('new image composition remains functional DOM with free study destinations and existing photos',()=>{
 const home=read('src/ImmigraHome.jsx'),css=read('src/ImmigraHome.css');assert.match(home,/InterviewGlassDemo lang=\{lang\} onNavigate=\{onNavigate\}/);assert.match(home,/Prepárate para/);assert.match(home,/con IA/);assert.match(home,/freeStudyRoutes\[selectedCategory\]/);for(const asset of ['citizenship-background.webp','asylum-scene.webp','residency-scene.webp'])assert.ok(css.includes(asset));assert.doesNotMatch(home,/100,000|4\.9|expertos|Preguntas reales/);
});
test('scene edge feather affects only aria-hidden decorations not controls',()=>{const css=read('src/InterviewGlassDemo.css'),source=read('src/InterviewGlassDemo.jsx');assert.match(source,/glass-atmosphere" aria-hidden="true"/);assert.match(css,/\.glass-atmosphere\{mask-image:/);assert.doesNotMatch(css,/\.demo\{[^}]*mask-image/);assert.match(css,/mask-composite:intersect/);});
