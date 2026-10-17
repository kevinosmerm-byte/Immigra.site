import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {interviewerMediaBase,interviewerLabel,INTERVIEWERS} from '../shared/interview-ui/interviewer-media.mjs';
test('all Sahara aliases use the newer Residency videos',()=>{
 for(const name of ['Sarah','Sahara','sarah'])for(const old of ['/modules/citizenship/sarah-','/modules/asylum/assets/sarah-'])assert.equal(interviewerMediaBase(name,old),'/interviewer/');
 for(const state of ['speaking','listening'])assert.ok(existsSync(new URL(`../public/interviewer/${state}.mp4`,import.meta.url)));
});
test('Kevin retains his own media',()=>assert.equal(interviewerMediaBase('Kevin','/interviewer/kevin-20261014/'),'/interviewer/kevin-20261014/'));
test('William has distinct speaking and listening media in every module',()=>{
 for(const name of ['william','William'])for(const prefix of ['/modules/asylum/assets/sarah-','/modules/citizenship/kevin-','/interviewer/'])assert.equal(interviewerMediaBase(name,prefix),'/interviewer/william-20261014/');
 for(const state of ['speaking','listening'])assert.ok(existsSync(new URL(`../public/interviewer/william-20261014/${state}.mp4`,import.meta.url)));
 assert.deepEqual(INTERVIEWERS.map(x=>interviewerLabel(x.id)),['Sahara','Kevin','William']);
 assert.equal(interviewerLabel('sahara'),'Sahara');
});
test('local residency keeps consent and uses the shared call layout',()=>{
 const source=readFileSync(new URL('../modules/residency/voice/ResidencyCall.jsx',import.meta.url),'utf8');
 assert.match(source,/<CallView/);assert.match(source,/locale:lang,consent/);assert.match(source,/voice.dispose\(\)/);assert.match(source,/has-reviewed-answer/);
});
