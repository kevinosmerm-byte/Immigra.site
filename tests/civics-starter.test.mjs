import test from 'node:test';
import assert from 'node:assert/strict';
import {starterQuestions,loadStarter,readSavedStarter,saveStarter,starterCallback,starterAuthReturn,starterNextStep,readGuestStarter,allowStarterTransfer,claimStarter} from '../shared/civics-starter.mjs';
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
  assert.equal(loadStarter('a',storage).position,0);
  const saved={position:3,review:[2],completedDay:'2026-11-15'};
  saveStarter('a',saved,storage);assert.deepEqual(loadStarter('a',storage),saved);
  assert.equal(loadStarter('b',storage).position,0);
  saveStarter('a',{position:9,review:[]},storage);assert.equal(loadStarter('a',storage).position,0);
  assert.equal(loadStarter('a',null).position,0);
});

test('a returning learner gets one next step based on actual progress', () => {
  assert.equal(starterNextStep(readSavedStarter('user', null)), 'module');
  assert.equal(starterNextStep({position: 2, review: [0]}), 'resume');
  assert.equal(starterNextStep({position: 3, review: [1]}), 'review');
  assert.equal(starterNextStep({position: 3, review: []}), 'plan');
});

const memory = () => {
  const values = new Map();
  return {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key), values};
};
test('a new visitor starts at question one; only a recent answered sample skips it', () => {
  const storage = memory(), now = 10000000;
  assert.equal(loadStarter(null, storage, now).position, 0);
  for (const review of [true, false]) {
    storage.setItem('immigra.civics.sample.v1', JSON.stringify({time: now - 10, review}));
    assert.deepEqual(loadStarter(null, storage, now), {position: 1, review: review ? [0] : [], completedDay: ''});
  }
  for (const time of [now + 1, now - 3600000, 'yesterday']) {
    storage.setItem('immigra.civics.sample.v1', JSON.stringify({time, review: true}));
    assert.equal(loadStarter(null, storage, now).position, 0);
  }
});
test('guests can complete and resume all questions without an account or overwriting account progress', () => {
  const storage = memory(), saved = {position: 3, review: [0, 2], completedDay: '2026-11-22'};
  saveStarter('member', {position: 2, review: [], completedDay: ''}, storage);
  saveStarter(null, saved, storage);
  assert.deepEqual(readGuestStarter(storage), saved);
  assert.equal(readSavedStarter(null, storage), null);
  assert.equal(readSavedStarter('member', storage).position, 2);
  assert.equal(storage.values.has('immigra.civics.starter.v1:null'), false);
  assert.deepEqual(claimStarter('new-member', storage), null, 'no implicit transfer on sign-in');
  allowStarterTransfer(storage, 10000000);
  assert.deepEqual(claimStarter('new-member', storage, 10000001), saved);
  assert.deepEqual(readSavedStarter('new-member', storage), saved);
  assert.equal(readGuestStarter(storage), null);
});
test('an explicit transfer preserves an existing member and expires after one hour', () => {
  const storage = memory();
  saveStarter('member', {position: 1, review: [0], completedDay: ''}, storage);
  saveStarter(null, {position: 3, review: [], completedDay: '2026-11-22'}, storage);
  allowStarterTransfer(storage, 10000000);
  assert.equal(claimStarter('member', storage, 10000001).position, 1);
  assert.equal(claimStarter('other', storage, 10000002), null, 'transfer is consumed even if existing progress wins');
  allowStarterTransfer(storage, 10000000);
  assert.equal(claimStarter('other', storage, 13600000), null);
  assert.equal(loadStarter(null, null).position, 0);
  assert.doesNotThrow(() => saveStarter(null, {position: 1}, null));
});
test('malformed progress cannot skip questions or inject unfinished review indices', () => {
  const storage = memory();
  for (const bad of [{position: -1, review: []}, {position: 1, review: [2]}, {position: 3, review: ['0']}]) {
    saveStarter(null, bad, storage);
    assert.equal(readGuestStarter(storage), null);
  }
});
