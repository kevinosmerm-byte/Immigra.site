import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const C=createRequire(import.meta.url)('../modules/asylum/packages/core/index.cjs');

// Exercise the real entry point in both shipped source variants, not a test copy.
function runtime(file){
 const source=readFileSync(new URL('../'+file,import.meta.url),'utf8');
 const start=source.match(/window\.startPreparedAsylum=payload=>\{[\s\S]*?\n\};/)[0];
 const sandbox={window:{platformCall:()=>{}},personal:C.createCase(),C,go:()=>{}};
 vm.createContext(sandbox);vm.runInContext(start,sandbox);
 const integrated=readFileSync(new URL('../modules/asylum/runtime.generated.js',import.meta.url),'utf8');
 const call=integrated.match(/window\.platformCall\?\.\(route==='adaptive'[\s\S]*?:null\);/)[0];
 sandbox.route='adaptive';sandbox.graph=()=>sandbox.personal;
 let lastCall;sandbox.window.platformCall=payload=>{lastCall=payload;};
 return {sandbox,call:()=>{vm.runInContext(call,sandbox);return lastCall;},start:text=>{sandbox.window.startPreparedAsylum({text,language:'en',interviewer:'kevin'});return sandbox.active.practiceContext;}};
}
for(const file of ['modules/asylum/apps/web/master.js','modules/asylum/runtime.generated.js']){
 test(`${file}: document A then no document does not transmit previous case sources`,()=>{
  const r=runtime(file);assert.equal(r.start('Document A'),'Document A');assert.equal(r.start(''),'');assert.equal(r.start(undefined),'');assert.equal(r.call().context,'');
  assert.equal(r.sandbox.personal.sources.length,1,'preserve existing local case data');
 });
 test(`${file}: corrected document B wins over a long previous A and context is a snapshot`,()=>{
  const r=runtime(file);assert.equal(r.start('A'.repeat(9000)).length,6000);const firstId=r.call().sessionId;assert.equal(r.start('Corrected document B'),'Corrected document B');assert.equal(r.call().context,'Corrected document B');assert.notEqual(r.call().sessionId,firstId);
  r.sandbox.personal.sources.push({text:'Later unrelated source'});assert.equal(r.sandbox.active.practiceContext,'Corrected document B');assert.equal(r.sandbox.personal.sources[0].text.length,9000);
 });
 test(`${file}: separate runtime/account has no previous context`,()=>{
  const a=runtime(file),b=runtime(file);a.start('Private A');assert.equal(b.start(''),'');assert.equal(b.sandbox.personal.sources.length,0);
 });
}
test('integrated call uses only the active session snapshot and account changes remount the app',()=>{
 const source=readFileSync(new URL('../modules/asylum/runtime.generated.js',import.meta.url),'utf8');
 const module=readFileSync(new URL('../modules/asylum/Module.jsx',import.meta.url),'utf8');assert.match(module,/<ConversationInterview key=\{call.sessionId\}/);
 assert.match(source,/context:active\.practiceContext\|\|''/);assert.doesNotMatch(source,/context:graph\(\)\.sources/);
 const app=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');assert.match(app,/<App key=\{session\?\.user\?\.id\|\|'guest'\}/);
});
