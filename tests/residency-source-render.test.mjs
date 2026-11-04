import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
async function component(path){
 const output=await build({entryPoints:[fileURLToPath(new URL('../'+path,import.meta.url))],bundle:true,write:false,jsx:'automatic',platform:'node',format:'cjs',external:['react','react-dom','react/jsx-runtime'],loader:{'.css':'empty'},define:{'import.meta.env.BASE_URL':'"/"'}});
 const module={exports:{}};new Function('require','module','exports',output.outputFiles[0].text)(name=>name==='react-dom'?{createPortal:x=>x}:require(name),module,module.exports);return module.exports.default;
}
test('ES/EN source note distinguishes adaptation, original reflection and checked-edition caveat',async()=>{
 const Note=await component('modules/residency/src/QuestionSourceNote.jsx');
 for(const lang of ['es','en']){
  const html=renderToStaticMarkup(React.createElement(Note,{question:{bloque:'Hogar'},lang}));
  assert.match(html,/https:\/\/www.uscis.gov\/sites\/default\/files\/document\/forms\/i-130instr.pdf/);
  assert.match(html,/rel="noopener noreferrer"/);assert.match(html,lang==='es'?/no es una pregunta textual/:/not a verbatim/);
  assert.match(html,lang==='es'?/edición vigente/:/current edition/);
  const own=renderToStaticMarkup(React.createElement(Note,{question:{category:'routine'},lang}));assert.doesNotMatch(own,/<a /);assert.match(own,/original_reflection/);
 }
});
test('source context renders outside keyboard-only response area in call',async()=>{
 const Call=await component('shared/interview-ui/CallView.jsx');const old=globalThis.document;globalThis.document={body:{}};
 try{
  const html=renderToStaticMarkup(React.createElement(Call,{lang:'es',moduleId:'residency',state:'listening',muted:true,captions:[{who:'ai',text:'Synthetic question'}],showCaptions:true,questionNote:React.createElement('small',{'data-test-source':true},'Synthetic source'),onText:()=>{}}));
  assert(html.indexOf('Synthetic question')<html.indexOf('Synthetic source'));
  assert(html.indexOf('Synthetic source')<html.indexOf('id="call-response-panel"'));
 }finally{globalThis.document=old;}
});
test('source metadata is bounded to the actual document in ES/EN',async()=>{
 const Note=await component('modules/residency/src/QuestionSourceNote.jsx');
 for(const lang of ['es','en']){
  const render=props=>renderToStaticMarkup(React.createElement(Note,{...props,lang}));
  const i130=render({question:{bloque:'Hogar'}});
  assert.match(i130,/04\/01\/24/);
  assert.match(i130,lang==='es'?/Edición observada/:/Observed edition/);
  assert.match(i130,lang==='es'?/extractos indexados.*no el documento completo/:/Indexed excerpts.*not the full document/);
  assert.doesNotMatch(i130,lang==='es'?/Página observada/:/Observed page/);
  const i485=render({question:{bloque:'Historia migratoria'}});
  assert.match(i485,/i-485instr.pdf/);
  assert.doesNotMatch(i485,/04\/01\/24|Edición observada|Observed edition/);
  assert.match(i485,lang==='es'?/extractos indexados/:/Indexed excerpts/);
  const own=render({question:{category:'routine'}});
  assert.doesNotMatch(own,/04\/01\/24|extractos indexados|Indexed excerpts/);
 }
});
test('stable question ID preserves derived reference despite rephrased captions',async()=>{
 const Note=await component('modules/residency/src/QuestionSourceNote.jsx');
 for(const lang of ['es','en']){
  const html=renderToStaticMarkup(React.createElement(Note,{questionId:'RES-DERIVED-001',prompt:'Rephrased synthetic caption.',lang}));
  assert.match(html,/i-130instr.pdf/);
  assert.match(html,/04\/01\/24/);
  assert.match(html,lang==='es'?/Página observada: 7/:/Observed page: 7/);
  assert.match(html,/adapted_practice/);
 }
 const fallback=renderToStaticMarkup(React.createElement(Note,{prompt:'Acknowledgment. Describe your current living arrangements, whether together or separately.',lang:'en'}));
 assert.match(fallback,/Observed page: 7/);
});
