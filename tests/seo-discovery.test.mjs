import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {publicPages,publicPageHtml} from '../scripts/public-pages.mjs';
import {seoPages} from '../shared/seo-pages.mjs';
import {practiceSections} from '../shared/seo-practice.mjs';

test('rendered home guide navigation exposes all six canonical links in both languages', async () => {
 const result=await build({entryPoints:[fileURLToPath(new URL('../src/PreparationGuides.jsx',import.meta.url))],bundle:true,write:false,platform:'node',format:'cjs',external:['react']});
 const module={exports:{}};
 new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
 for(const lang of ['es','en']){
  const html=renderToStaticMarkup(React.createElement(module.exports.default,{lang}));
  assert.equal((html.match(/<a /g)||[]).length,6);
  for(const page of seoPages){
   assert.ok(html.includes(`href="/${page.path}"`));
   assert.ok(html.includes(`hrefLang="${page.lang}"`));
  }
  assert.doesNotMatch(html,/hidden|display:\s*none|href="#/);
 }
 const source=await readFile(new URL('../src/main.jsx',import.meta.url),'utf8');
 assert.match(source,/!isNativeExperience&&!page&&<PreparationGuides lang=\{lang\}/);
});

test('topic exercises are readable without JavaScript and all public internal links resolve', async () => {
 const routes=new Set(['/',...publicPages.map(([path])=>'/'+path)]);
 const descriptions=new Set();
 for(const page of seoPages){
  const html=publicPageHtml([page.path,page.lang,page.heading],'');
  for(const [heading,text] of practiceSections(page.module,page.lang)){
   assert.ok(html.includes(heading));
   assert.ok(html.includes(text));
   assert.ok(!descriptions.has(text));descriptions.add(text);
  }
  for(const match of html.matchAll(/href="(\/[^"#?]*)"/g)){
   const target=match[1];
   if(/\.[a-z]+$/.test(target))await access(new URL('../public'+target,import.meta.url));
   else assert.ok(routes.has(target),target);
  }
  for(const image of ['william-home-640.webp','william-home.webp']){
   assert.ok(html.includes(image));
   await access(new URL('../public/images/home/'+image,import.meta.url));
  }
  assert.doesNotMatch(html,/Case Tracker|aggregateRating|reviewCount/);
 }
});
