import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareStoryWithAi } from '../shared/storyPreparationApi.mjs';
import { setSessionToken } from '../shared/authentication/fetch.mjs';

test('complete story analysis preserves language, authorization and grounded excerpts across chunks',async()=>{
 const previous=globalThis.fetch,requests=[];
 setSessionToken('fixture-token');
 globalThis.fetch=async(url,options)=>{
  const body=JSON.parse(options.body);requests.push({url,body,headers:options.headers});
  return Response.json({excerpts:[{quote:body.text.slice(0,30),category:'event',user_confirmed:false}]});
 };
 try{
  const text='My story contains only the facts I remember. '.repeat(280).trim();
  const result=await prepareStoryWithAi({text,language:'es',consent:true});
  assert.equal(requests.map(r=>r.body.text).join(''),text);
  assert.ok(requests.length>1);
  for(const r of requests){assert.equal(r.url,'/api/asylum/analyze');assert.equal(r.body.language,'es');assert.equal(r.body.consent,true);assert.equal(r.headers.get('Authorization'),'Bearer fixture-token');}
  assert.equal(result.analysis.topics.length,requests.length);
  assert.deepEqual(result.analysis.questions,[]);
 }finally{globalThis.fetch=previous;setSessionToken(null);}
});

test('analysis rejects missing consent, invented quotations and partial results after a failure',async()=>{
 const previous=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;return Response.json({excerpts:[{quote:'Invented statement',category:'event'}]});};
 try{
  const input={text:'This is a sufficiently long source story to practice with.',language:'en',consent:true};
  await assert.rejects(prepareStoryWithAi({...input,consent:false}),/STORY_CONSENT_REQUIRED/);assert.equal(calls,0);
  await assert.rejects(prepareStoryWithAi(input),/STORY_ANALYSIS_INVALID/);
  calls=0;globalThis.fetch=async()=>++calls===1?Response.json({excerpts:[]}):new Response('{}',{status:503});
  await assert.rejects(prepareStoryWithAi({...input,text:input.text.repeat(150)}),/STORY_SERVICE_UNAVAILABLE/);
  const controller=new AbortController();controller.abort();calls=0;
  await assert.rejects(prepareStoryWithAi({...input,signal:controller.signal}));assert.equal(calls,0);
 }finally{globalThis.fetch=previous;}
});
