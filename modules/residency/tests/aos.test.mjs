import test from 'node:test';
import assert from 'node:assert/strict';
import {aosQuestions,aosRoutes,selectAosQuestions,difficulty,isUncertain} from '../src/aosEngine.mjs';
import {aosFeedback} from '../src/aosFeedback.mjs';
test('AOS bank preserves 300 unique questions, three isolated routes and progressive difficulty within each topic',()=>{
 assert.equal(aosQuestions.filter(q=>/^AOS-\d+$/.test(q.id)).length,300);assert.equal(aosQuestions.length,318);assert.equal(new Set(aosQuestions.map(q=>q.id)).size,318);
 for(const route of Object.keys(aosRoutes))for(const count of [6,12,30,100]){
  const selected=selectAosQuestions({route,count,random:()=>.5});assert.equal(selected.length,count);assert.equal(new Set(selected.map(q=>q.id)).size,count);assert(selected.every(q=>q.ruta===route));
  const topics=[...new Set(selected.map(q=>q.bloque))];for(const topic of topics){const group=selected.filter(q=>q.bloque===topic);assert.deepEqual(group.map(difficulty),group.map(difficulty).sort());}
  assert.deepEqual(selected.map(q=>q.bloque),topics.flatMap(topic=>selected.filter(q=>q.bloque===topic).map(q=>q.bloque)));
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
