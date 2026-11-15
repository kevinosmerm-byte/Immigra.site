import test from 'node:test';
import assert from 'node:assert/strict';
import {starterQuestions,loadStarter,saveStarter,starterCallback,starterAuthReturn} from '../shared/civics-starter.mjs';
import {starterCard} from '../scripts/civics-starter-card.mjs';
import {getCivicsQuestion} from '../modules/citizenship/src/civicsQuestionBank.js';

test('each language offers the same three official questions, with the English answer available', () => {
  for(const lang of ['en','es']){
    const questions=starterQuestions(lang);
    assert.deepEqual(questions.map(q=>q.id),[2,7,21]);
    for(const q of questions){
      const bank=getCivicsQuestion(q.id);
      assert.equal(q.prompt,lang==='es'?bank.questionSpanish:bank.question);
      assert.equal(q.answer,bank.acceptedAnswers[0]);
      assert.equal(new Set(q.choices).size,3);
      if(lang==='en')assert.equal(q.choices[q.correct],q.answer);
    }
    assert.ok(starterCard(lang).includes('/?lang='+lang+'#/first-practice'));
  }
});
test('the email link carries only the language and a fixed practice destination, independent of device', () => {
  const link=new URL(starterCallback('https://immigra.site','en'));
  assert.equal(link.href,'https://immigra.site/?practice=civics&lang=en');
  assert.equal(starterAuthReturn(link),true);
  for(const key of ['checkout','billing','guest_checkout']){
    link.searchParams.set(key,'return'); assert.equal(starterAuthReturn(link),false);link.searchParams.delete(key);
  }
  assert.equal(starterAuthReturn(new URL('https://immigra.site/')),false);
});
test('practice resumes per account and ignores damaged or inaccessible records', () => {
  const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  assert.equal(loadStarter('a',storage).position,1);
  const saved={position:3,review:[2],completedDay:'2026-11-15'};
  saveStarter('a',saved,storage);assert.deepEqual(loadStarter('a',storage),saved);
  assert.equal(loadStarter('b',storage).position,1);
  saveStarter('a',{position:9,review:[]},storage);assert.equal(loadStarter('a',storage).position,1);
  assert.equal(loadStarter('a',null).position,1);
});
