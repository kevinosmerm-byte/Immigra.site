import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {seoPages} from '../shared/seo-pages.mjs';
import {publicPageHtml} from '../scripts/public-pages.mjs';
import {initialLanguage,LANGUAGE_KEY,WELCOME_KEY,saveAcceptance} from '../src/welcome/state.mjs';

const compiled=await build({entryPoints:[fileURLToPath(new URL('../src/welcome/WelcomeGate.jsx',import.meta.url))],bundle:true,write:false,platform:'node',format:'cjs',external:['react','react/jsx-runtime'],jsx:'automatic',loader:{'.css':'empty'}});
const module={exports:{}};
new Function('require','module','exports',compiled.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const WelcomeGate=module.exports.default;
const makeStorage=()=>{const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),values};};

// Render the real welcome gate, not only its resolver, with links emitted by all six guides.
for(const page of seoPages)for(const browserLanguage of ['en-US','es-MX'])for(const returning of [false,true]){
 test(`${page.path}: ${browserLanguage}, ${returning?'returning with opposite preference':'fresh'} entry`,()=>{
  const html=publicPageHtml([page.path,page.lang,page.heading],'');
  const href=html.match(/href="(\/\?lang=[^" ]+)"/)[1];
  const url=new URL(href,'https://immigra.site');
  const storage=makeStorage();
  if(returning)storage.setItem(LANGUAGE_KEY,page.lang==='es'?'en':'es');
  const names=['localStorage','location','navigator','matchMedia'];
  const previous=new Map(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
  Object.defineProperties(globalThis,{
   localStorage:{configurable:true,value:storage},
   location:{configurable:true,value:url},
   navigator:{configurable:true,value:{language:browserLanguage}},
   matchMedia:{configurable:true,value:()=>({matches:true})},
  });
  try{
   const rendered=renderToStaticMarkup(React.createElement(WelcomeGate,null,'APP'));
   assert.match(rendered,new RegExp(`class="immigra-welcome" lang="${page.lang}"`));
   assert.match(rendered,new RegExp(`aria-pressed="true"><b>${page.lang.toUpperCase()}</b>`));
   assert.ok(rendered.includes(page.lang==='en'?'Choose your language':'Elige tu idioma'));
   assert.equal(storage.getItem(WELCOME_KEY),null,'entry never accepts the notice for the visitor');
   // An already accepted returning visitor bypasses welcome and uses the same resolver in App.
   saveAcceptance(storage,page.lang==='en'?'es':'en');
   assert.equal(renderToStaticMarkup(React.createElement(WelcomeGate,null,'APP')),'APP');
   assert.equal(initialLanguage(storage,browserLanguage,url.search),page.lang);
  }finally{
   for(const name of names){const descriptor=previous.get(name);if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}
  }
 });
}

test('invalid hints preserve the saved preference; blocked storage still respects explicit entry',()=>{
 const storage=makeStorage();storage.setItem(LANGUAGE_KEY,'es');
 for(const search of ['','?lang=fr','?lang=','?lang=EN'])assert.equal(initialLanguage(storage,'en-US',search),'es');
 const blocked={getItem(){throw Error('blocked');}};
 assert.equal(initialLanguage(blocked,'es-MX','?lang=en'),'en');
 assert.equal(initialLanguage(blocked,'en-US','?lang=es'),'es');
});

test('explicit welcome selection supersedes the consumed guide hint without changing route or campaign',()=>{
 const storage=makeStorage();
 const url=new URL('https://immigra.site/?lang=en&utm_source=test#/citizenship/interview?mode=n400');
 assert.equal(initialLanguage(storage,'es',url.search),'en');
 saveAcceptance(storage,'es');
 url.searchParams.delete('lang');
 assert.equal(initialLanguage(storage,'en',url.search),'es');
 assert.equal(url.search,'?utm_source=test');
 assert.equal(url.hash,'#/citizenship/interview?mode=n400');
});
