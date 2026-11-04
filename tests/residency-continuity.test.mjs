import test from 'node:test';
import assert from 'node:assert/strict';
import {selectAosQuestions,aosQuestion} from '../modules/residency/src/aosEngine.mjs';
import {selectQuestions,relationships} from '../modules/residency/src/engine.mjs';
import {createLocalAdapter} from '../modules/residency/src/adapter.mjs';
import {applicableAosQuestion,explicitAnswer,isTopicSkipCommand,nextAosIndex} from '../modules/residency/src/question-flow.mjs';
import {createDomainInterview,recordDomainTurn,advanceDomainTurn,skipDomainQuestion,skipResidencyTopic} from '../services/ai/interview-domain.mjs';
const routes=['MATRIMONIO','HIJO_A_PADRES','PADRES_A_HIJOS'];
const contiguous=topics=>assert.deepEqual(topics,[...new Set(topics)].flatMap(topic=>topics.filter(x=>x===topic)));
for(const route of routes)for(const locale of ['es','en'])test(`${route} ${locale}: complete synthetic interview never returns to a previous block`,()=>{
 let flow=createDomainInterview({module:'residency',route,locale,practiceOptions:{count:100}},{random:()=>0});
 const ids=[],topics=[];
 while(flow.question){ids.push(flow.question.id);topics.push(flow.question.block);assert.ok(flow.question.english);flow=advanceDomainTurn(recordDomainTurn(flow,'No recuerdo'),{answer_status:'uncertain',next_action:'continue'}).flow;assert(ids.length<=100);}
 contiguous(topics);assert.equal(ids.length,new Set(ids).size);assert.equal(flow.state.complete,true);assert(!ids.includes('AOS-077'));assert(!ids.includes('AOS-128'));
});
test('deterministic topic order survives random source and reviewed IDs',()=>{
 for(const route of routes){const a=selectAosQuestions({route,count:100,random:()=>0}),b=selectAosQuestions({route,count:100,random:()=>.999});assert.deepEqual(a,b);contiguous(a.map(q=>q.bloque));
 const reviewed=a.slice(0,5).map(q=>q.id);const flow=createDomainInterview({module:'residency',route,reviewedQuestionIds:reviewed});assert(!reviewed.includes(flow.question.id));}
});
test('unknown, skipped and uncertain answers cannot enable dependent questions',()=>{
 for(const answer of ['',undefined,'No recuerdo','No sé','No estoy seguro','Not sure','No tengo idea','Yes, perhaps','No, maybe']){assert.equal(explicitAnswer(answer),null);assert.equal(applicableAosQuestion({id:'AOS-077'},{'AOS-076':answer}),false);}
 assert(applicableAosQuestion({id:'AOS-077'},{'AOS-076':'Sí.'}));assert(applicableAosQuestion({id:'AOS-157'},{'AOS-152':'No'}));
 assert(!applicableAosQuestion({id:'AOS-157'},{'AOS-152':'Yes'}));
});
test('local next index respects omission and prerequisites',()=>{
 const qs=[{id:'AOS-076',bloque:'history'},{id:'AOS-077',bloque:'history'},{id:'other',bloque:'next'}];
 assert.equal(nextAosIndex(qs,0,{'AOS-076':'No'}),2);assert.equal(nextAosIndex(qs,0,{'AOS-076':'Yes'}),1);assert.equal(nextAosIndex(qs,0,{'AOS-076':'Yes'},true),2);
});
test('skip topic clears clarifications without adding personal facts',()=>{
 let flow=createDomainInterview({module:'residency',route:'MATRIMONIO',practiceOptions:{count:30}});const block=flow.question.block;
 const profile=structuredClone(flow.state.applicantProfile);flow.followUpQueue=[{id:'synthetic'}];flow=skipResidencyTopic(flow);
 assert.notEqual(flow.question.block,block);assert.deepEqual(flow.state.applicantProfile,profile);assert.deepEqual(flow.statements,[]);assert.deepEqual(flow.followUpQueue,[]);
 while(flow.question)flow=skipResidencyTopic(flow);assert(flow.state.complete);assert.throws(()=>skipResidencyTopic({...flow,module:'citizenship'}));
});
test('question skip stays within the active topic',()=>{
 const f=createDomainInterview({module:'residency',route:'MATRIMONIO'}),next=skipDomainQuestion(f);assert.equal(next.question.block,f.question.block);assert.notEqual(next.question.id,f.question.id);assert.deepEqual(next.statements,[]);
});
test('commands are exact; narrative is never treated as a topic skip',()=>{
 for(const text of ['Omitir este tema','Skip this topic','Please skip this block.'])assert(isTopicSkipCommand(text));
 for(const text of ['No aplica','No tengo hijos','Me dijeron omitir este tema','I want to explain why I skip this topic'])assert(!isTopicSkipCommand(text));
});
test('legacy ES/EN selections preserve the same stable topic order and skip without answers',()=>{
 for(const relationshipType of relationships){const es=selectQuestions({relationshipType,locale:'es',count:30}),en=selectQuestions({relationshipType,locale:'en',count:30});contiguous(es.map(q=>q.category));assert.deepEqual(es.map(q=>q.id.slice(0,-3)),en.map(q=>q.id.slice(0,-3)));
 const a=createLocalAdapter(),id=a.start({relationshipType,mode:'personal',count:30,consent:true}),category=a.question(id,'es').category;a.skipTopic(id,'en');assert.notEqual(a.question(id,'es').category,category);assert.equal(a.summary(id).answered,0);assert(a.read(id).responses.every(r=>r.skipped&&!r.text));}
});
test('contextual prompts do not presume discrepancies and are bilingual',()=>{
 for(const id of ['AOS-007','AOS-030','AOS-049','AOS-107','AOS-177','AOS-237'])for(const locale of ['es','en'])assert.match(aosQuestion({id},locale),locale==='es'?/¿Hay|Si hubo/:/Is there|Are there|If there/);
});

test('source notes never label authored wording as official and preserve verification limits',async()=>{
 const {residencyQuestionSource}=await import('../modules/residency/src/question-sources.mjs');
 for(const route of routes)for(const q of selectAosQuestions({route,count:100})){
  const s=residencyQuestionSource(q);assert(['adapted_practice','original_reflection'].includes(s.kind));if(s.url){assert.equal(s.currentEditionVerified,false);assert.equal(s.verification,'official_search_index');assert.match(s.url,/^https:\/\/www\.uscis\.gov\//);}else{assert.equal(s.verification,undefined);assert.equal(s.editionObserved,undefined);}
 }
 assert.equal(residencyQuestionSource({category:'routine'}).url,null);
 assert.match(residencyQuestionSource({category:'household'}).url,/i-130instr/);
});

test('derived bank connects each practice prompt to objective, source and verification limit',async()=>{
 const {default:bank}=await import('../modules/residency/data/derived-practice-bank.json',{with:{type:'json'}});
 assert.equal(bank.length,9);assert.equal(new Set(bank.map(q=>q.id)).size,9);
 for(const route of routes)assert.equal(bank.filter(q=>q.ruta===route).length,3);
 for(const q of bank){assert.equal(q.official,false);assert(q.learningObjective&&q.derivation&&q.answerPolicy);assert.equal(q.source.verification,'official_search_index');assert.equal(q.source.currentEditionVerified,false);assert(['1','6','7'].includes(q.source.pageObserved));assert(aosQuestion(q,'es'));assert(aosQuestion(q,'en'));}
});

test('short repeat sessions continue the route rather than repeatedly selecting the first block',()=>{
 let reviewed=[];const ids=[];
 for(let session=0;session<8;session++){
  let flow=createDomainInterview({module:'residency',route:'MATRIMONIO',locale:'es',practiceOptions:{count:12},reviewedQuestionIds:reviewed});
  while(flow.question){assert(!ids.includes(flow.question.id));ids.push(flow.question.id);flow=skipDomainQuestion(flow);}
  reviewed=[...ids];
 }
 assert(ids.length>80);contiguous(ids.map(id=>selectAosQuestions({route:'MATRIMONIO',count:200}).find(q=>q.id===id).bloque));
});
