import test from 'node:test';
import assert from 'node:assert/strict';
import {createAiReportStore,validateAiReport,AI_REPORT_EVENT} from '../server/aiReportService.js';
function fixture(){
 const rows=[];let now=1780000000000;
 const db={from(table){assert.equal(table,'usage_events');let mode='select',predicates=[];const query={select(){return query},eq(key,value){predicates.push(row=>row[key]===value);return query},contains(key,value){predicates.push(row=>Object.entries(value).every(([k,v])=>row[key]?.[k]===v));return query},lt(key,value){predicates.push(row=>row[key]<value);return query},gte(key,value){predicates.push(row=>row[key]>=value);return query},limit(){return query},delete(){mode='delete';return query},insert(row){rows.push({...row,id:rows.length+1});return Promise.resolve({error:null});},then(resolve){const selected=rows.filter(row=>predicates.every(p=>p(row)));if(mode==='delete')for(const row of selected)rows.splice(rows.indexOf(row),1);return Promise.resolve({data:mode==='select'?selected:[],error:null}).then(resolve);}};return query;}};
 const store=createAiReportStore({db,secret:'server-fixture-secret',now:()=>now});return {rows,store,advance:ms=>{now+=ms}};
}
const report={reportId:'10000000-0000-4000-8000-000000000001',module:'asylum',category:'legal_advice',locale:'es',note:'Private fixture description',includeResponse:true,responseExcerpt:'A response to review'};
test('AI reports require explicit excerpt consent and reject unsafe categories and oversized content',()=>{
 assert.throws(()=>validateAiReport({...report,includeResponse:false}));assert.throws(()=>validateAiReport({...report,category:'untrusted'}));assert.throws(()=>validateAiReport({...report,note:'x'.repeat(1001)}));assert.throws(()=>validateAiReport({...report,module:'arbitrary'}));
 assert.equal(validateAiReport({...report,includeResponse:false,responseExcerpt:''}).responseExcerpt,'');
});
test('AI report body is encrypted at rest; export and deletion remain scoped to the owner',async()=>{
 const f=fixture();const result=await f.store.submit('user-a',report);assert.equal(result.received,true);assert.equal(f.rows[0].event_name,AI_REPORT_EVENT);assert.doesNotMatch(JSON.stringify(f.rows),/Private fixture description|A response to review/);
 assert.equal((await f.store.exportForUser('user-a'))[0].note,report.note);assert.deepEqual(await f.store.exportForUser('user-b'),[]);
 await f.store.submit('user-a',report);assert.equal(f.rows.length,1);await f.store.removeForUser('user-b');assert.equal(f.rows.length,1);await f.store.removeForUser('user-a');assert.equal(f.rows.length,0);
});
test('retention deletes only expired AI reports and never ordinary financial usage records',async()=>{
 const f=fixture();await f.store.submit('user-a',report);f.rows.push({id:99,event_name:'ai_provider_request',created_at:new Date(0).toISOString()});f.advance(31*86400000);await f.store.purge();assert.equal(f.rows.length,1);assert.equal(f.rows[0].event_name,'ai_provider_request');
});
test('unconfigured storage cannot claim that an AI report was saved',async()=>{const store=createAiReportStore({db:null,secret:null});await assert.rejects(store.submit('user-a',report),{code:'report_unavailable'});});
