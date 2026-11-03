import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { n400StudyTokens } from '../src/n400StudyText.js';
import { n400CardVocabulary } from '../src/n400StudyVocabulary.js';
const bank = JSON.parse(fs.readFileSync(new URL('../src/data/n400StudyBank.json', import.meta.url)));

// Every reviewed concept on every existing card must actually be emphasized,
// including overlapping subphrases inside a longer phrase, not merely one hit/card.
for (const q of bank.questions) for (const language of ['en', 'es']) {
  test(`all reviewed concepts are highlighted: ${q.item} ${language}`, () => {
    const text = q[language];
    const tokens = n400StudyTokens(text, language);
    assert.equal(tokens.map(t => t.text).join(''), text);
    assert.ok(n400CardVocabulary[q.item][language].length);
    let cursor = 0;
    const ranges = tokens.map(t => { const range = { start: cursor, end: cursor + t.text.length, kind: t.kind }; cursor = range.end; return range; });
    for (const phrase of n400CardVocabulary[q.item][language]) {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const occurrences = [...text.matchAll(new RegExp('(?<![\\p{L}\\p{M}\\p{N}_])' + escaped + '(?![\\p{L}\\p{M}\\p{N}_])', 'giu'))];
      assert.ok(occurrences.length, `${q.item}: missing source phrase ${phrase}`);
      for (const occurrence of occurrences) for (let i = occurrence.index; i < occurrence.index + occurrence[0].length; i++) {
        assert.ok(ranges.some(r => r.kind !== 'plain' && r.start <= i && i < r.end), `${q.item} ${language}: unhighlighted ${phrase} at ${i}`);
      }
    }
  });
}
test('whole Unicode words, no substring matches and no shared regex cursor', () => {
  for (const s of ['unregisteredness', 'reclaimedness', 'misleadingly', 'xarrested', 'arrested123', 'arrestedé', 'éarrested', '_arrested', '税arrested', '𝒂tax', 'tax\u0301']) {
    assert.deepEqual(n400StudyTokens(s), [{text:s, kind:'plain'}], s);
  }
  const text = 'Have\tyou\nEVER registered to vote, or been CHARGED WITH an offense?';
  const a = n400StudyTokens(text);
  assert.equal(a.map(t=>t.text).join(''),text);
  assert.deepEqual(n400StudyTokens(text),a);
  assert.ok(a.some(t=>t.text==='registered to vote'&&t.kind==='vocabulary'));
  assert.ok(a.some(t=>t.text==='CHARGED WITH'&&t.kind==='vocabulary'));
});
test('negation and temporal conditions are emphasized without answer guidance', () => {
  for (const [text,language,expected] of [
    ['Have you EVER committed a crime for which you were NOT arrested?', 'en',['NOT']],
    ['Do you currently owe taxes?', 'en',['currently']],
    ['If the law requires it, are you willing to bear arms?', 'en',['If the law requires it']],
    ['¿Alguna vez ha cometido un delito por el que NO fue arrestado?', 'es',['NO']],
  ]) {
    assert.deepEqual(n400StudyTokens(text,language).filter(t=>t.kind==='scope').map(t=>t.text),expected);
  }
});
test('untrusted markup stays text; tokens never return HTML', () => {
  const text='<img src=x onerror=alert(1)> Have you EVER been arrested?';
  assert.equal(n400StudyTokens(text).map(t=>t.text).join(''),text);
  for(const t of n400StudyTokens(text)) assert.deepEqual(Object.keys(t),['text','kind']);
  const component=fs.readFileSync(new URL('../src/N400StudyCards.jsx',import.meta.url),'utf8');
  assert.doesNotMatch(component,/dangerouslySetInnerHTML/);
  assert.match(component,/speakAppText\(\[question.en, \.\.\.\(question.formNotes \|\| \[\]\)\.map\(note => note.en\)\]\.join\(' '\)/);
});

test('valid short terms survive an invalid longer candidate', () => {
 assert.ok(n400StudyTokens('tax returns').some(t=>t.text==='tax'&&t.kind==='vocabulary'));
 assert.ok(n400StudyTokens('military services').some(t=>t.text==='military'&&t.kind==='vocabulary'));
 for(const phrase of ['unable to consent','could not agree','unable to take']) assert.deepEqual(n400StudyTokens(phrase),[{text:phrase,kind:'scope'}]);
});
