import test from 'node:test';
import assert from 'node:assert/strict';
import {aosQuestions,aosRoutes,selectAosQuestions,difficulty,isUncertain} from '../src/aosEngine.mjs';
import {aosFeedback} from '../src/aosFeedback.mjs';
test('AOS bank preserves 300 unique questions, three isolated routes and progressive difficulty',()=>{
 assert.equal(aosQuestions.length,300);assert.equal(new Set(aosQuestions.map(q=>q.id)).size,300);
 for(const route of Object.keys(aosRoutes))for(const count of [6,12,30,100]){
  const selected=selectAosQuestions({route,count,random:()=>.5});assert.equal(selected.length,count);assert.equal(new Set(selected.map(q=>q.id)).size,count);assert(selected.every(q=>q.ruta===route));
  assert.deepEqual(selected.map(difficulty),selected.map(difficulty).sort());assert.equal(new Set(selected.map(difficulty)).size,3);assert(new Set(selected.map(q=>q.bloque)).size>=Math.min(3,count));
 }
 assert.throws(()=>selectAosQuestions({route:'other'}));assert(isUncertain('Necesito revisar mis documentos'));
});
test('AI requires consent, respects quota, rejects invented quotes and bounds followups',async()=>{
 let calls=0;const payload={question:'¿Cuándo?',answer:'No recuerdo',history:[],consent:true,allowFollowup:false};
 let output={observations:[{quote:'No recuerdo',kind:'uncertain'}],followup:'¿Puede aclarar?'};
 const config={env:{PLATFORM_AI_ENABLED:'true',OPENAI_API_KEY:'test',OPENAI_TEXT_MODEL:'test'},reserveQuota:async()=>true,userId:'verified',fetchImpl:async(_url,options)=>{calls++;const body=JSON.parse(options.body);assert.equal(body.store,false);return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(output)}]}]});}};
 assert.equal((await aosFeedback({...payload,consent:false},config)).status,400);assert.equal(calls,0);
 assert.equal((await aosFeedback(payload,{...config,reserveQuota:async()=>false})).status,429);assert.equal(calls,0);
 const result=await aosFeedback(payload,config);assert.equal(result.status,200);assert.equal(result.followup,'');
 output={observations:[{quote:'Invented fact',kind:'context'}],followup:''};assert.equal((await aosFeedback(payload,config)).status,502);
 assert.equal((await aosFeedback({...payload,history:Array(7).fill({question:'q',answer:'a'})},config)).status,400);
});
