import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewQuestions,reviewGroups,referenceStatus,renderReviewNotice,venezuelaReference} from '../modules/asylum/country-review.mjs';

test('review bank has bilingual, uniquely identified questions in all four groups',()=>{
  assert.equal(reviewQuestions.length,16);
  assert.equal(new Set(reviewQuestions.map(q=>q.id)).size,16);
  for(const category of Object.keys(reviewGroups)){
    assert.equal(reviewQuestions.filter(q=>q.category===category).length,4);
  }
  for(const q of reviewQuestions){
    assert.ok(q.question_es&&q.question_en);
    assert.equal(q.country==='Venezuela',q.category==='REVIEW_VENEZUELA');
    assert.equal(q.answer,undefined);
  }
});
test('reference expires at the UTC boundary and fails closed for invalid or future dates',()=>{
  assert.equal(referenceStatus(venezuelaReference,new Date('2026-11-18T23:59:59Z')),'reviewed');
  for(const date of ['2026-11-19T00:00:00Z','2026-10-19T23:59:59Z','invalid']){
    assert.equal(referenceStatus(venezuelaReference,new Date(date)),'needs_review');
  }
  assert.equal(referenceStatus({...venezuelaReference,expiresAt:'invalid'}),'needs_review');
});
test('expired references are marked in both languages without hiding timeless questions',()=>{
  const now=new Date('2026-11-20T00:00:00Z');
  assert.match(renderReviewNotice('es',String,now),/pendiente de nueva revisión/);
  assert.match(renderReviewNotice('en',String,now),/needs a new review/);
  assert.match(renderReviewNotice('es',String,now),/no se afirma una conclusión/);
  assert.equal(reviewQuestions.length,16);
});
test('existing asylum bank imports the review content and renders guidance; no new route',()=>{
  const runtime=readFileSync(new URL('../modules/asylum/runtime.generated.js',import.meta.url),'utf8');
  assert.match(runtime,/\.\.\.supplemental\.asylum,\.\.\.reviewQuestions/);
  assert.match(runtime,/renderReviewNotice\(bankLanguage,esc\)/);
  assert.match(runtime,/value="\$\{esc\(t\)\}"/);
});
