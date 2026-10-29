import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { n400StudyTokens, nextStudyIndex, nextStudyPage } from '../src/n400StudyText.js';
import { readAppRoute, appRouteHash } from '../routes.mjs';

test('N400 study highlighting never rewrites source text or inserts EVER', () => {
  for (const text of ['Have you EVER claimed to be a U.S. citizen (in writing or any other way)?', 'Do you currently owe taxes?', 'If yes, are you ready?', 'Everyone everywhere.']) {
    assert.equal(n400StudyTokens(text).map(part => part.text).join(''), text);
  }
  assert.deepEqual(n400StudyTokens('Everyone everywhere.').map(part => part.kind), ['plain']);
  assert.equal(n400StudyTokens('Have you EVER?').filter(part => part.kind === 'ever').length, 1);
  assert.equal(n400StudyTokens('Do you currently owe taxes?').some(part => part.kind === 'ever'), false);
});
test('N400 study deck stops at both ends', () => {
  assert.equal(nextStudyIndex(0, -1, 62), 0);
  assert.equal(nextStudyIndex(61, 1, 62), 61);
  assert.equal(nextStudyIndex(0, 1, 62), 1);
});
test('N400 study has a stable citizenship route', () => {
  assert.equal(appRouteHash('n400Study'), '#/citizenship/n400Study');
  assert.equal(readAppRoute('#/citizenship/n400Study').screen, 'n400Study');
});
test('N400 reading UI never collects responses, scores, records or persists personal answers', () => {
  const source = fs.readFileSync(new URL('../src/N400StudyCards.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /localStorage|sessionStorage|recordPractice|saveModuleProgress|apiFetch|apiJson|fetch\(|getUserMedia|startAudioRecording|<input|<textarea|correctAnswer|scoreAnswer/);
  assert.match(source, /useState\(false\)/);
  assert.match(source, /requireLanguageVoice: true/);
  assert.match(source, /question\.formNotes/);
  assert.match(source, /unofficial/);
  assert.match(source, /\[index, language\]/);
});

test('version-pinned reading bank retains all 62 cards, source metadata and exact highlight text', () => {
  const bank = JSON.parse(fs.readFileSync(new URL('../src/data/n400StudyBank.json', import.meta.url)));
  assert.equal(bank.formEdition, '01/20/25');
  assert.equal(bank.studyMode, 'read_only');
  assert.equal(bank.acceptAnswers, false);
  assert.equal(bank.questions.length, 62);
  assert.equal(new Set(bank.questions.map(q => q.id)).size, 62);
  assert.equal(bank.questions.some(q => q.item === '22.c'), false);
  assert.equal(bank.sourceAudit.status, 'text-verified-with-fetch-limitation');
  for (const q of bank.questions) {
    assert.ok(q.en && q.es && q.officialItemEn && q.sourceUrl && q.wordingType);
    assert.equal(n400StudyTokens(q.en).map(token => token.text).join(''), q.en);
    assert.ok(q.page >= 6 && q.page <= 10);
    assert.equal(q.spanishWordingType, 'educational-translation-not-official');
    for (const note of q.formNotes || []) assert.ok(note.en && note.es);
  }
});


test('semantic blue and green phrases preserve exact source wording and qualifiers', () => {
 for (const [text, kind, phrase] of [
  ['Have you EVER claimed anything?', 'ever', 'Have you EVER'],
  ['HAVE YOU EVER been there?', 'ever', 'HAVE YOU EVER'],
  ['Do you support the Constitution?', 'support', 'Do you support'],
  ['DO YOU SUPPORT this?', 'support', 'DO YOU SUPPORT'],
 ]) {
  const tokens=n400StudyTokens(text);
  assert.equal(tokens.map(x=>x.text).join(''),text);
  assert.deepEqual(tokens.filter(x=>x.kind===kind).map(x=>x.text),[phrase]);
 }
 assert.equal(n400StudyTokens('Do you supportively answer?').some(x=>x.kind==='support'),false);
});
test('compact reading controls retain accessible actions and no automatic playback', () => {
 const source=fs.readFileSync(new URL('../src/N400StudyCards.jsx',import.meta.url),'utf8');
 assert.match(source,/aria-label=\{t\('Previous card'/);
 assert.match(source,/aria-label=\{t\('Next card'/);
 assert.match(source,/aria-pressed=\{audioEnabled\}/);
 assert.match(source,/onClick=\{speaking \? stop : play\}/);
 assert.match(source,/setAudioEnabled\(false\)/);
 assert.match(source,/<details className="n400-study-source"/);
 assert.doesNotMatch(source,/civics-deck-hero|n400-study-notice/);
});

test('page turns handle rapid alternating navigation and stop at boundaries without timers', () => {
 let page={index:0,direction:null};
 assert.equal(nextStudyPage(page,-1,62),page);
 for(let i=0;i<100;i++) page=nextStudyPage(page,1,62);
 assert.deepEqual(page,{index:61,direction:'next'});
 assert.equal(nextStudyPage(page,1,62),page);
 page=nextStudyPage(page,-1,62);
 assert.deepEqual(page,{index:60,direction:'previous'});
 for(let i=0;i<60;i++) { page=nextStudyPage(page,-1,62); page=nextStudyPage(page,1,62); }
 assert.deepEqual(page,{index:60,direction:'next'});
 const source=fs.readFileSync(new URL('../src/N400StudyCards.jsx',import.meta.url),'utf8');
 assert.match(source,/stop\(\);\s*setPage\(current => nextStudyPage/);
 assert.match(source,/key=\{index\} data-page-direction=\{page.direction\}/);
 assert.doesNotMatch(source,/setTimeout|setInterval|onAnimationEnd/);
});
