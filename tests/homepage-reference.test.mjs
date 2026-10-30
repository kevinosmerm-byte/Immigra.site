import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {moduleHash,moduleFromHash} from '../shared/navigation/routes.mjs';
const home=readFileSync(new URL('../src/ImmigraHome.jsx',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
test('web homepage uses existing navigation and preserves native homepage boundary',()=>{
 assert.match(main,/!isNativeExperience\?<ImmigraHome lang=\{lang\} onNavigate=\{navigate\}/);
 assert.match(home,/onClick=\{\(\)=>onNavigate\(m.id\)\}/);
 for(const id of ['citizenship','asylum','residency'])assert.equal(moduleFromHash(moduleHash(id)),id);
});
test('preview is explicitly fictional and never captures audio or sends requests',()=>{
 assert.match(home,/DEMO · EJEMPLO FICTICIO/);
 assert.doesNotMatch(home,/getUserMedia|MediaRecorder|fetch\(/);
 assert.ok(existsSync(new URL('../public/interviewer/portraits/william.jpg',import.meta.url)));
 assert.match(home,/aria-expanded=\{expanded\}/);
 assert.match(home,/prefers-reduced-motion/);
});
