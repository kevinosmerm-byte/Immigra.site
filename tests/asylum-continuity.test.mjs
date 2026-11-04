import test from 'node:test';
import assert from 'node:assert/strict';
import {studyBank,asylumInterviewQuestions} from '../modules/asylum/reflection-bank.mjs';
import {baseImpactIds} from '../modules/asylum/base-impact.mjs';
import expansion from '../modules/asylum/card-expansion.json' with {type:'json'};
import {topicGroups} from '../modules/asylum/question-sequence.mjs';
import {newSession,restoreSession,STUDY_KEY} from '../modules/asylum/study-session.mjs';
import {createDomainInterview,skipDomainQuestion} from '../services/ai/interview-domain.mjs';

test('editorial groups cover all 249 cards exactly once, each topic contiguous',()=>{
 const ids=topicGroups.flatMap(g=>g.ids);
 assert.equal(ids.length,249);assert.equal(new Set(ids).size,249);
 assert.deepEqual(new Set(ids),new Set(studyBank.map(q=>q.id)));
 const topics=studyBank.map(q=>q.topic).filter((t,i,all)=>!i||t!==all[i-1]);
 assert.deepEqual(topics,topicGroups.map(g=>g.key));
});
test('study is stable across random seeds, country, reload and restart',()=>{
 for(const country of ['Venezuela','Cuba','Other']){
  const a=newSession(studyBank,country,()=>0),b=newSession(studyBank,country,()=>.99);
  assert.deepEqual(a,b);assert.equal(a.order.length,country==='Venezuela'?249:241);
  a.index=12;assert.deepEqual(restoreSession({getItem:()=>JSON.stringify(a)},studyBank,[country]),a);
 }
});
test('old random sessions are archived without pretending unseen cards were completed',()=>{
 const old={version:1,country:'Cuba',order:studyBank.filter(q=>!q.country).map(q=>q.id).reverse(),index:80};
 const restored=restoreSession({getItem:()=>JSON.stringify(old)},studyBank,['Cuba']);
 assert.equal(restored.index,0);assert.deepEqual(restored.previousBankSession,old);
 assert.equal(restored.migration.reordered,true);
 assert.deepEqual(restored.order,newSession(studyBank,'Cuba').order);
});
test('entire asylum interview follows study order in both languages and seeds; skip stays in sequence',()=>{
 for(const locale of ['es','en'])for(const country of ['Cuba','Venezuela'])for(const random of [()=>0,()=>.99]){
  // Voice excludes optional sensitive prompts, which keep their separate text consent flow.
  let f=createDomainInterview({module:'asylum',locale,country,transport:'voice'},{random});
  const expected=asylumInterviewQuestions(locale,country).filter(q=>!baseImpactIds.has(q.id));
  const seen=[];while(f.question){assert.ok(seen.length<expected.length);seen.push(f.question.id);f=skipDomainQuestion(f);}
  assert.deepEqual(seen,expected.map(q=>q.id));
 }
});
test('already reviewed concepts are skipped without rotating topics or repeats',()=>{
 const expected=asylumInterviewQuestions('es','Cuba');
 const reviewed=expected.slice(0,5).map(q=>q.id);
 const f=createDomainInterview({module:'asylum',locale:'es',country:'Cuba',reviewedQuestionIds:reviewed},{random:()=>0});
 assert.equal(f.question.id,expected[5].id);
});

test('rewritten contextual prompts have new IDs and no inherited review credit',()=>{
 const changed=studyBank.filter(q=>q.previous_id);
 assert.equal(changed.length,228);assert.ok(changed.every(q=>q.id!==q.previous_id&&!studyBank.some(other=>other.id===q.previous_id)));
 for(const q of changed){assert.ok(expansion[q.sequence_source_id].includes(q.id));}
 const f=createDomainInterview({module:'asylum',locale:'es',country:'Cuba',reviewedQuestionIds:changed.map(q=>q.previous_id)});
 assert.equal(f.state.askedConceptIDs.length,0);
});
