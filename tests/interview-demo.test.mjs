import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {interviewSamples,sampleIndex} from '../src/interview-samples.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('three bilingual illustrative questions per category; truthful counter and bounded navigation',()=>{
 assert.deepEqual(Object.keys(interviewSamples),['citizenship','asylum','residency']);
 for(const questions of Object.values(interviewSamples)){assert.equal(questions.length,3);for(const q of questions){assert.ok(q.es.endsWith('?'));assert.ok(q.en.endsWith('?'));}}
 assert.equal(new Set(Object.values(interviewSamples).flatMap(q=>q.map(x=>x.en))).size,9);
 assert.equal(sampleIndex(0,-1),0);assert.equal(sampleIndex(2,1),2);assert.equal(sampleIndex(1,-1),0);
 let index=0;for(let i=0;i<100;i++)index=sampleIndex(index,1);assert.equal(index,2);
});
test('reader is explicit, cancels stale speech and hides unavailable audio rather than faking capture',()=>{
 const s=read('src/InterviewDemo.jsx');
 assert.match(s,/useState\(false\)/);
 assert.match(s,/speakAppText\(question,\{language:lang==='es'\?'es':'en',requireLanguageVoice:true\}\)/);
 assert.match(s,/if\(token!==generation.current\)return/);
 assert.match(s,/return\(\)=>\{generation.current\+\+;void stopAppSpeech\(\);\}/);
 assert.match(s,/\[route,index,lang\]/);
 assert.match(s,/const choose=value=>\{stop\(\);setRoute\(value\);setIndex\(0\);\}/);
 assert.match(s,/const move=direction=>\{stop\(\);/);
 assert.match(s,/setAudioAvailable\(false\)/);
 assert.match(s,/audioAvailable\?/);
 assert.match(s,/if\(document.hidden\)stop\(\)/);
 assert.doesNotMatch(s,/getUserMedia|MediaRecorder|fetch\(|authenticatedFetch|onMouseMove|setInterval|setTimeout/);
 assert.match(s,/index\+1\} \/ 3/);
 assert.match(s,/no recording/);
});
test('reference hero is layered DOM, real controls, scoped responsive and reduced motion',()=>{
 const home=read('src/ImmigraHome.jsx'),css=read('src/ImmigraHome.css'),header=read('src/WebExperience.jsx');
 assert.match(home,/<InterviewDemo lang=\{lang\}/);
 assert.match(home,/focusHomeSection\('ih-study'\)/);assert.match(home,/focusHomeSection\('ih-demo'\)/);
 assert.doesNotMatch(home+css,/william-home|portrait|100,000|4\.9\/5|Diseñado por expertos|Preguntas reales/);
 assert.match(css,/ih-layer-one/);assert.match(css,/ih-layer-two/);assert.match(css,/ih-layer-three/);
 assert.match(css,/transform:rotate\(-6deg\)/);
 assert.match(css,/@media\(max-width:850px\).*grid-template-columns:1fr/s);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(header,/href="#\/settings"/);assert.match(header,/href="#\/account"/);assert.match(header,/href="#\/help"/);
 assert.doesNotMatch(header,/<input|search/i);
});

test('glass stays translucent with a solid accessibility fallback and lighter mobile blur',()=>{
 const css=read('src/ImmigraHome.css');
 assert.match(css,/linear-gradient\(145deg,#ffffffb8,#f6f7ffa6 48%,#d5e5fc99\)/);
 assert.match(css,/html\[data-reduce-transparency=true\].*background:#f2f7ff;backdrop-filter:none/);
 assert.match(css,/@media\(max-width:540px\)\{.immigra-home .ih-question-panel\{backdrop-filter:blur\(4px\)\}/);
});

test('decorative overflow is bounded without clipping interactive panel; homepage background and CTA match reference',()=>{
 const css=read('src/ImmigraHome.css'),demo=read('src/InterviewDemo.jsx');
 assert.match(demo,/<div className="ih-glass-decoration" aria-hidden="true">/);
 assert.match(css,/ih-glass-decoration\{inset:0;overflow:visible/);
 assert.doesNotMatch(css,/body:has\(\.immigra-home\)\{overflow-x:(?:clip|hidden)/);
 assert.doesNotMatch(css,/ih-question-panel\{[^}]*overflow:hidden/);
 assert.match(css,/body:has\(\.immigra-home\)::before\{background:radial-gradient/);
 assert.match(css,/@media\(min-width:851px\)\{.immigra-home .ih-hero-actions\{flex-wrap:nowrap;gap:16px/);
});

test('desktop geometry follows measured reference without shrinking interactive targets',()=>{
 const css=read('src/ImmigraHome.css');
 assert.match(css,/height:30vw;align-items:start;margin-bottom:2vw/);
 assert.match(css,/top:3.52vw;left:0;margin:0;font-size:5.32vw/);
 assert.match(css,/top:21.2vw;left:0;margin:0/);
 assert.match(css,/width:64%;min-height:24vw/);
 assert.match(css,/rotateY\(-14deg\) rotateX\(5deg\) rotateZ\(-5deg\)/);
 assert.match(css,/min-width:44px;min-height:44px/);
});


test('reference face is decorative while question well and readable touch controls remain real',()=>{
 const css=read('src/ImmigraHome.css');
 assert.match(css,/h1\{transform:scaleX\(1.04\)/);
 assert.match(css,/ih-question-panel::before\{[^}]*pointer-events:none;[^}]*data:image\/svg\+xml/);
 assert.match(css,/ih-sample-question\{border-radius:12px;background:linear-gradient/);
 assert.match(css,/min-width:52px;min-height:52px/);
 assert.match(css,/transform:none;background:transparent;[^}]*isolation:isolate/);
});
