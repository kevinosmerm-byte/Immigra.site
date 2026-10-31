import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
async function component(name){
 const result=await build({entryPoints:[fileURLToPath(new URL(`../src/${name}.jsx`,import.meta.url))],bundle:true,write:false,platform:'node',format:'cjs',external:['react','react-dom'],loader:{'.css':'empty'}});
 const module={exports:{}};
 new Function('require','module','exports',result.outputFiles[0].text)(require,module,module.exports);
 return module.exports.default;
}
for(const [name,className] of [['StudyMessagesRibbon','study-messages-duplicate'],['ReviewsRibbon','reviews-duplicate']]){
 test(`${name} emits a real boolean inert attribute for duplicate content`,async()=>{
  const Component=await component(name);
  const html=renderToStaticMarkup(React.createElement(Component,{lang:'es',previewExamples:true}));
  const tag=html.match(new RegExp(`<div[^>]*class="[^"]*${className}[^"]*"[^>]*>`))?.[0];
  assert.ok(tag,'duplicate group is rendered');
  assert.match(tag,/aria-hidden="true"/);
  assert.match(tag,/\sinert=""/,'React must emit inert rather than drop a falsey string prop');
 });
}
