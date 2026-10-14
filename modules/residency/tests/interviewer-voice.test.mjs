import test from 'node:test';
import assert from 'node:assert/strict';
import {selectInterviewerVoice,selectSaharaVoice,createVoiceController} from '../voice/voiceAdapter.mjs';

test('local interviewer voice selection preserves Sahara and the chosen language',()=>{
 const voices=[{name:'Microsoft Sabina',lang:'es-MX'},{name:'Microsoft Pablo',lang:'es-ES'},{name:'Microsoft Zira',lang:'en-US'},{name:'Microsoft David',lang:'en-US'}];
 for(const locale of ['es','en'])assert.equal(selectInterviewerVoice(voices,locale,'sarah'),selectSaharaVoice(voices,locale));
 for(const avatar of ['kevin','william']){
  assert.equal(selectInterviewerVoice(voices,'es',avatar).name,'Microsoft Pablo');
  assert.equal(selectInterviewerVoice(voices,'en',avatar).name,'Microsoft David');
  assert.equal(selectInterviewerVoice(voices.slice(0,1),'en',avatar),null);
  assert.equal(selectInterviewerVoice(voices.slice(0,1),'es',avatar),null);
 }
});

test('local William playback uses his selected voice and emits speaking only on actual start',()=>{
 const spoken=[],states=[];
 const env={SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},speechSynthesis:{getVoices:()=>[{name:'Microsoft Zira',lang:'en-US'},{name:'Microsoft David',lang:'en-US'}],speak:u=>spoken.push(u),cancel:()=>{}}};
 const voice=createVoiceController({env,avatar:'william',onState:s=>states.push(s)});
 assert.equal(voice.speak('Practice question','en'),true);
 assert.equal(spoken[0].voice.name,'Microsoft David');assert.equal(states.at(-1),'loading');
 spoken[0].onstart();assert.equal(states.at(-1),'speaking');spoken[0].onend();assert.equal(states.at(-1),'idle');voice.dispose();
});
