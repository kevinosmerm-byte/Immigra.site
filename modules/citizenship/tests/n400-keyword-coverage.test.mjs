import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { n400StudyTokens } from '../src/n400StudyText.js';
import { n400CardVocabulary } from '../src/n400StudyVocabulary.js';
const bank = JSON.parse(fs.readFileSync(new URL('../src/data/n400StudyBank.json', import.meta.url)));

// All 62 bilingual cards retain their source, with a small, card-specific cue budget.
for (const q of bank.questions) for (const language of ['en', 'es']) {
  test(`sparse recall cues: ${q.item} ${language}`, () => {
    const text = q[language];
    const tokens = n400StudyTokens(text, language, q.item);
    assert.equal(tokens.map(t => t.text).join(''), text);
    const red = tokens.filter(t => t.kind === 'vocabulary');
    assert.ok(red.length >= 1 && red.length <= 3);
    assert.equal(new Set(red.map(t => t.text.toLowerCase())).size, red.length);
    assert.ok(red.reduce((sum,t)=>sum+t.text.trim().split(/\s+/).length,0)<=3, 'three actual words, not three phrases');
    assert.deepEqual(red.map(t=>t.text.toLowerCase()).sort(), n400CardVocabulary[q.item][language].map(cue=>cue.toLowerCase()).sort(), 'every curated concept must survive matching and the budget');
    for (const token of red) {
      assert.ok(n400CardVocabulary[q.item][language].some(cue => cue.toLowerCase() === token.text.toLowerCase()));
    }
    for (const note of q.formNotes || []) assert.equal(n400StudyTokens(note[language], language, q.item).map(t=>t.text).join(''), note[language]);
  });
}
test('specific concepts survive long shared introductions and repeated occurrences', () => {
  for (const [item,expected] of [['7.a',['Torture']],['7.b',['Genocide']],['6.a',['weapon','explosive','harm']],['17.a',['prostitution']]]) {
    const q=bank.questions.find(q=>q.item===item);
    assert.deepEqual(n400StudyTokens(q.en,'en',item).filter(t=>t.kind==='vocabulary').map(t=>t.text),expected);
  }
  assert.equal(n400StudyTokens('Torture taxes voted','en','7.a').filter(t=>t.kind==='vocabulary').length,1);
  assert.equal(n400StudyTokens('Torture','en','unknown').filter(t=>t.kind==='vocabulary').length,0);
});
test('whole Unicode words, no substring matches and no shared regex cursor', () => {
  for (const s of ['unregisteredness', 'reclaimedness', 'misleadingly', 'xarrested', 'arrested123', 'arrestedé', 'éarrested', '_arrested', '税arrested', '𝒂tax', 'tax\u0301']) {
    assert.deepEqual(n400StudyTokens(s), [{text:s, kind:'plain'}], s);
  }
  const text = 'Have\tyou\nEVER registered to vote, or been CHARGED WITH an offense?';
  const a = n400StudyTokens(text, 'en', '2');
  assert.equal(a.map(t=>t.text).join(''),text);
  assert.deepEqual(n400StudyTokens(text, 'en', '2'),a);
  assert.ok(a.some(t=>t.text==='vote'&&t.kind==='vocabulary'));
  assert.ok(!a.some(t=>t.text==='CHARGED WITH'&&t.kind==='vocabulary'));
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
 assert.ok(n400StudyTokens('military services','en','8.a').some(t=>t.text==='military'&&t.kind==='vocabulary'));
 for(const phrase of ['unable to consent','could not agree','unable to take']) assert.deepEqual(n400StudyTokens(phrase),[{text:phrase,kind:'scope'}]);
});

test('three-word budget counts words within phrases and never repeats a cue', () => {
  assert.deepEqual(n400StudyTokens('misrepresentation public benefit MISREPRESENTATION public benefit', 'en', '17.h').filter(t=>t.kind==='vocabulary').map(t=>t.text), ['misrepresentation','public benefit']);
  assert.deepEqual(n400StudyTokens('servicios no combatientes; SERVICIOS NO COMBATIENTES', 'es', '36').filter(t=>t.kind==='vocabulary').map(t=>t.text), ['servicios no combatientes']);
  assert.equal(n400StudyTokens('tax vote arms weapons').filter(t=>t.kind==='vocabulary').length,3);
});
test('curated cues exclude isolated negations and generic helper verbs', () => {
  const excluded=/^(?:no|not|never|nunca|have|has|had|been|be|do|did|are|were|helped|ayudado|completed|completado|understand|comprende|residing|vive|served|servido)$/i;
  for(const q of bank.questions) for(const lang of ['en','es']) for(const cue of n400CardVocabulary[q.item][lang]) assert.doesNotMatch(cue,excluded,`${q.item} ${lang}`);
  for(const [item,en,es] of [['4','nonresident','no residente'],['7.e','did not consent','no consintió'],['15.a','NOT arrested','NO fue arrestado'],['36','noncombatant services','servicios no combatientes']]) {
    const q=bank.questions.find(q=>q.item===item);
    for(const [lang,phrase] of [['en',en],['es',es]]) assert.ok(n400StudyTokens(q[lang],lang,item).some(t=>t.kind==='vocabulary'&&t.text===phrase));
  }
});
test('green support and blue EVER retain complete bilingual phrases on real cards', () => {
  const support=bank.questions.find(q=>q.item==='31');
  for(const [lang,phrase] of [['en','Do you support'],['es','Apoya']]) {
    const tokens=n400StudyTokens(support[lang],lang,support.item);
    assert.deepEqual(tokens.filter(t=>t.kind==='support').map(t=>t.text),[phrase]);
    assert.equal(tokens.map(t=>t.text).join(''),support[lang]);
  }
  const first=bank.questions.find(q=>q.item==='1');
  assert.deepEqual(n400StudyTokens(first.en,'en','1').filter(t=>t.kind==='ever').map(t=>t.text),['Have you EVER']);
  assert.deepEqual(n400StudyTokens(first.es,'es','1').filter(t=>t.kind==='ever').map(t=>t.text),['Alguna vez']);
});
test('age, temporal and conditional blue cues survive the per-card budget', () => {
  for(const [item,lang,expected] of [
    ['13','en','under 15 years of age'],['13','es','menor de 15 años'],
    ['22.a','en','between your 18th and 26th birthdays'],['22.a','es','entre su cumpleaños número 18 y su cumpleaños número 26'],
    ['26.b','en','within the next 3 months'],['26.b','es','dentro de los próximos 3 meses'],
    ['35','en','If the law requires it'],['35','es','Si la ley lo exige'],
  ]) {
    const q=bank.questions.find(q=>q.item===item);
    assert.ok(n400StudyTokens(q[lang],lang,item).some(t=>t.kind==='scope'&&t.text===expected));
  }
});
