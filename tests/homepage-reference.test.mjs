import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {moduleHash,moduleFromHash} from '../shared/navigation/routes.mjs';
const home=readFileSync(new URL('../src/ImmigraHome.jsx',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
test('web homepage uses existing navigation and preserves native homepage boundary',()=>{
 assert.match(main,/!isNativeExperience\?<ImmigraHome lang=\{lang\} onNavigate=\{navigate\}/);
 assert.match(home,/onNavigate\(freeStudyRoutes\[choice.id\]\)/);
 for(const id of ['citizenship','asylum','residency'])assert.equal(moduleFromHash(moduleHash(id)),id);
});
test('homepage offers study and a real sample reader without microphone capture',()=>{
 assert.match(home,/Estudiar gratis/);
 assert.match(home,/no asesoría legal/);
 assert.doesNotMatch(home,/getUserMedia|MediaRecorder|fetch\(|InterviewPreview|setTimeout|useReducer/);
 assert.match(home,/type="button"/);
});
