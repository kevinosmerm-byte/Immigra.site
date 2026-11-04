import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { civicsCardSource, n400CardSource, CIVICS_OFFICIAL_PDF } from '../src/studyCardSources.js';
const official = JSON.parse(fs.readFileSync(new URL('../src/data/uscis2025Civics.json', import.meta.url)));
const n400 = JSON.parse(fs.readFileSync(new URL('../src/data/n400StudyBank.json', import.meta.url)));
test('all 128 civics cards cite their stable official ID and PDF page in both languages', () => {
  assert.equal(official.questions.length, 128);
  for (const item of official.questions) for (const language of ['en', 'es']) {
    const source = civicsCardSource(item.id, language);
    assert.equal(source.url, `${CIVICS_OFFICIAL_PDF}#page=${item.page}`);
    assert.ok(source.label.includes(String(item.id)));
    assert.match(source.note, /unofficial|no oficial/);
  }
  assert.match(civicsCardSource(128, 'en').label, /question 128/);
  assert.equal(civicsCardSource(999), null);
});
test('all 62 N400 cards distinguish original and combined wording and disclose verification limits', () => {
  assert.equal(n400.questions.length, 62);
  for (const question of n400.questions) for (const language of ['en', 'es']) {
    const source = n400CardSource(question, n400, language);
    assert.equal(source.url, `${question.sourceUrl}#page=${question.page}`);
    assert.ok(source.label.includes(question.item));
    assert.ok(source.label.includes(n400.formEdition));
    assert.match(source.note, /unofficial|no oficial/);
    assert.match(source.note, /pending|pendiente/);
    if (question.isAdaptedForCard) assert.match(source.note, /adaptation|Adaptación/);
    else assert.doesNotMatch(source.note, /adaptation|Adaptación/);
  }
  assert.equal(n400CardSource({}, n400), null);
});
test('source notes remain outside the interactive cards and are not hidden in details', () => {
  for (const file of ['CivicsStudyCard.jsx', 'N400StudyCards.jsx']) {
    const source = fs.readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
    assert.match(source, /<\/GlassStudyCard>\s*<StudyCardSource/);
  }
  const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(app, /<CivicsStudyCard\s+language=\{language\}/);
  assert.match(app, /questionNumber=\{civicsIndex \+ 1\}/);
});

test('six derived practice follow-ups are usable in both languages and carry procedural provenance', async () => {
  const bank = JSON.parse(fs.readFileSync(new URL('../src/data/n400InterviewBank.json', import.meta.url)));
  const { n400PracticeBank } = await import('../../../shared/interview-ui/n400-language.mjs');
  const { createN400FollowUpPrompt, getContextualN400FollowUps } = await import('../src/n400InterviewEngine.js');
  const { n400InterviewSource } = await import('../src/studyCardSources.js');
  assert.equal(bank.questions.length, 90);
  assert.equal(bank.questions.filter(q => q.derivedFollowUp).length, 6);
  for (const language of ['en', 'es']) for (const question of n400PracticeBank(bank, language).questions.filter(q => q.derivedFollowUp)) {
    const followUps = getContextualN400FollowUps(question, question.answerType === 'yes_no' ? 'Yes' : 'Example');
    assert.equal(followUps[0], question.derivedFollowUp[language]);
    const prompt = createN400FollowUpPrompt(question, followUps[0], 1);
    assert.equal(prompt.derivedSource.sourceRef, 'USCIS_SCORING_ENGLISH');
    const source = n400InterviewSource(prompt, bank, language);
    assert.match(source.url, /Test_Scoring_Guidelines.pdf#page=1$/);
    assert.match(source.note, /Not a verbatim|No es una pregunta textual/);
    assert.equal(createN400FollowUpPrompt(question, question.followUps[1], 2).derivedSource, null);
  }
});
