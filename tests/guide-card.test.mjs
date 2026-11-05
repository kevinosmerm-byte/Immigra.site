import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const root=fileURLToPath(new URL('..',import.meta.url));
const result=await build({entryPoints:[root+'/src/GuideCard.jsx'],bundle:true,write:false,platform:'node',format:'cjs',external:['react'],loader:{'.css':'empty'}});
const module={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(require,module,module.exports);
const Card=module.exports.default;
test('guide card renders exact bilingual HTML copy with the existing functional URL',()=>{
 for(const [lang,title,description,label] of [
  ['es','Toma el control de tu trámite migratorio','Hazlo tú mismo. Te guiamos paso a paso con imágenes, formularios y listas de documentos.','Elige tu trámite'],
  ['en','Take charge of your immigration application','Do it yourself. We’ll guide you step by step with illustrated instructions, forms, and document checklists.','Choose your application type'],
 ]){
  const html=renderToStaticMarkup(React.createElement(Card,{lang}));
  for(const text of [title,description,label])assert(html.includes(text));
  assert.match(html,/<a class="guide-card-button" href="\/guias\/index.html">/);
  assert.equal((html.match(/<a /g)||[]).length,1);
  assert.match(html,/aria-labelledby="guide-card-title"/);
 }
});
test('guide replaces header shortcut and precedes downloads only in web homepage',()=>{
 const home=readFileSync(root+'/src/ImmigraHome.jsx','utf8');
 const main=readFileSync(root+'/src/main.jsx','utf8');
 assert.doesNotMatch(home,/ih-guide-entry|My process, step by step/);
 assert(home.indexOf('<GuideCard')>home.indexOf('id="ih-study"'));
 assert(home.indexOf('<GuideCard')<home.indexOf('<StoreDownloads'));
 assert.match(main,/!isNativeExperience\?<ImmigraHome/);
});
test('mobile card stacks with a full-width link and visible keyboard focus',()=>{
 const css=readFileSync(root+'/src/GuideCard.css','utf8');
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/\.guide-card-button\{width:100%/);
 assert.match(css,/:focus-visible\{outline:3px/);
});
