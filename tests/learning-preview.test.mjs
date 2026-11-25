import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {learningPreview} from '../src/learning-preview.mjs';
import {getCivicsQuestion} from '../modules/citizenship/src/civicsQuestionBank.js';
import {resolveCivicsQuestion} from '../modules/citizenship/src/dynamicCivicsData.js';
const civics=JSON.parse(readFileSync(new URL('../modules/citizenship/src/data/uscis2025Civics.json',import.meta.url),'utf8'));

test('home civics contains all 128 cards in source order with the existing official answers',()=>{
 const cards=learningPreview('citizenship',civics);
 assert.equal(cards.length,128);
 assert.deepEqual(cards.map(card=>card.id),civics.questions.map(question=>`civics-${question.id}`));
 for(const lesson of cards){
  const official=civics.questions.find(question=>`civics-${question.id}`===lesson.id);
  assert.ok(official);
  assert.equal(lesson.en,official.question);
  assert.equal(lesson.es,official.spanish);
  const resolved=resolveCivicsQuestion(getCivicsQuestion(official.id));
  assert.equal(lesson.answerEn,(resolved.acceptedAnswers.length?resolved.acceptedAnswers:official.answers).join(' · '));
  assert.equal(lesson.answerEs,lesson.answerEn,'official answers stay in English in both interfaces');
  assert.equal(lesson.answerLanguage,'en');
  assert.ok(existsSync(new URL('../public'+lesson.source,import.meta.url)));
 }
});

test('introductions contain distinct bilingual study questions without collecting identity',()=>{
 const ids=new Set();
 for(const category of ['citizenship','asylum','residency']){
  const lessons=learningPreview(category,civics);
  assert.equal(lessons.length,category==='citizenship'?128:3);
  for(const lesson of lessons){
   assert.ok(!ids.has(lesson.id));ids.add(lesson.id);
   for(const key of ['es','en','answerEs','answerEn'])assert.ok(lesson[key]?.trim());
   assert.doesNotMatch(lesson.es+lesson.en,/su nombre|tu nombre|your (?:full |legal )?name|su fecha de nacimiento|your date of birth|dónde vive|where do you live/i);
  }
 }
 assert.deepEqual(learningPreview('unknown',civics),[]);
});

test('communication exercises remain explicitly distinct from official civics and sourced glossary',()=>{
 assert.ok(learningPreview('asylum',civics).every(lesson=>lesson.kind==='communication'&&!lesson.source));
 const terms=learningPreview('residency',civics).filter(lesson=>lesson.kind==='glossary');
 assert.ok(terms.every(lesson=>new URL(lesson.source).hostname==='travel.state.gov'));
 const first=learningPreview('asylum',civics);first[0].es='changed';
 assert.notEqual(learningPreview('asylum',civics)[0].es,'changed');
});
