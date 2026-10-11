import test from 'node:test';
import assert from 'node:assert/strict';
import {readingFeedback} from '../services/ai/reading-feedback.mjs';
const body={consent:true,sentence:'Adams was President.',transcript:'Adams was President.',locale:'es'};
const env={PLATFORM_AI_ENABLED:'true',OPENAI_API_KEY:'test'};
test('reading validates consent and input before quota/provider',async()=>{
 let calls=0;const deps={env,userId:'guest:test',reserveQuota:async()=>{calls++;return true;}};
 assert.equal((await readingFeedback({...body,consent:false},deps)).status,400);
 assert.equal((await readingFeedback({...body,transcript:''},deps)).status,400);
 assert.equal(calls,0);
});
test('reading fails closed on quota and malformed model output',async()=>{
 let calls=0;const deps={env,userId:'guest:test',reserveQuota:async()=>false,fetchImpl:async()=>{calls++;}};
 assert.equal((await readingFeedback(body,deps)).status,429);assert.equal(calls,0);
 deps.reserveQuota=async()=>true;deps.fetchImpl=async()=>({ok:true,json:async()=>({output_text:'{"score":101,"accuracy":"Excellent","feedback":"Good"}'})});
 assert.equal((await readingFeedback(body,deps)).error,'INVALID_EVALUATION');
});
test('reading returns only validated feedback and sends requested locale',async()=>{
 const value={score:100,accuracy:'Excellent',feedback:'Leíste todas las palabras.'};
 const result=await readingFeedback(body,{env,userId:'guest:test',reserveQuota:async id=>id==='guest:test',fetchImpl:async(url,options)=>{const input=JSON.parse(options.body);assert.match(input.instructions,/Spanish/);assert.equal(JSON.parse(input.input).transcript,body.transcript);return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:JSON.stringify({...value,secret:'discard'})}]}]})};}});
 assert.deepEqual(result,{status:200,...value});
});
