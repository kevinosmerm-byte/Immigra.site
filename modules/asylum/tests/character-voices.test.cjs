const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const win={};vm.runInNewContext(fs.readFileSync('apps/web/character-voices.js','utf8'),{window:win});
const voices=[{name:'Microsoft Helena',lang:'es-ES'},{name:'Microsoft Pablo',lang:'es-ES'},{name:'Microsoft Zira',lang:'en-US'},{name:'Microsoft David',lang:'en-US'}];
test('character voices respect character and language',()=>{const pick=win.AsiloCharacterVoices.select;assert.equal(pick(voices,'kevin','es-ES').name,'Microsoft Pablo');assert.equal(pick(voices,'sahara','es-ES').name,'Microsoft Helena');assert.equal(pick(voices,'kevin','en-US').name,'Microsoft David');assert.equal(pick(voices,'sahara','en-US').name,'Microsoft Zira');assert.equal(pick([voices[0]],'kevin','es-ES'),voices[0]);assert.equal(pick([voices[1]],'kevin','en-US'),null);});

test('no English fallback for Spanish',()=>{assert.equal(win.AsiloCharacterVoices.select([{name:'Microsoft David',lang:'en-US'}],'kevin','es-ES'),null);});
