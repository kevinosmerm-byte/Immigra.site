import { n400CardVocabulary } from './n400StudyVocabulary.js';

// Color is a reading aid, never an answer or correctness signal.
// Keep exact characters for rendering; speech continues to use the untouched bank.
const legacyVocabulary = {
  en: ['communism', 'communist', 'communists', 'weapon', 'weapons', 'arms', 'vote', 'votes', 'voted', 'voting', 'tax', 'taxes'],
  es: ['comunismo', 'comunista', 'comunistas', 'arma', 'armas', 'votar', 'votado', 'votando', 'voto', 'votos', 'impuesto', 'impuestos'],
};
const scope = {
  en: ['unable to consent', 'could not agree', 'unable to take', 'United States', 'U.S.', 'foreign country', 'currently', 'now', 'since', 'anywhere in the world', 'any other way', 'any reason', 'elsewhere', 'any', 'not', 'never', 'even if', 'unless', 'knowingly', 'intentionally', 'knew or believed', 'at the same time', 'under 15 years of age', 'between your 18th and 26th birthdays', 'within the next 3 months', 'at any time', 'if the law requires it', 'failed to', 'if you answered', 'if you received'],
  es: ['Estados Unidos', 'país extranjero', 'actualmente', 'ahora', 'desde que', 'en cualquier parte del mundo', 'de cualquier otra forma', 'por cualquier motivo', 'en otro lugar', 'no', 'nunca', 'incluso si', 'a menos que', 'a sabiendas', 'intencionalmente', 'sabiendo o creyendo', 'al mismo tiempo', 'menor de 15 años', 'entre su cumpleaños número 18 y su cumpleaños número 26', 'dentro de los próximos 3 meses', 'en algún momento', 'si la ley lo exige', 'dejado de', 'si respondió', 'si recibió'],
};
const phrasePattern = phrase => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
const normalize = value => value.toLocaleLowerCase().replace(/\s+/g, ' ');
const catalogs = new Map();
function catalog(lang, item) {
  const key = `${lang}:${item ?? ''}`;
  if (catalogs.has(key)) return catalogs.get(key);
  const entries = new Map();
  const add = (phrases, kind) => phrases.forEach(text => entries.set(normalize(text), { text, kind }));
  add(item == null ? legacyVocabulary[lang] : (n400CardVocabulary[item]?.[lang] || []), 'vocabulary');
  add(scope[lang], 'scope');
  if (lang === 'en') {
    add(['do you', 'have you', 'are you', 'did you', 'were you', 'will you'], 'stem');
    add(['do you support'], 'support');
    add(['have you ever', 'ever'], 'ever');
  } else {
    add(['alguna vez'], 'ever');
    add(['apoya'], 'support');
  }
  // A single left-to-right scan prefers the longest phrase at the same position.
  // No repeated replacements, nested markup or dynamic HTML are involved.
  const ordered = [...entries.values()].sort((a, b) => b.text.length - a.text.length || a.text.localeCompare(b.text));
  const result = { entries, regex: new RegExp('(?<![\\p{L}\\p{M}\\p{N}_])(?:' + ordered.map(e => phrasePattern(e.text)).join('|') + ')(?![\\p{L}\\p{M}\\p{N}_])', 'giu') };
  catalogs.set(key, result);
  return result;
}
export function n400StudyTokens(text, language = 'en', item) {
  const source = String(text);
  const { entries, regex } = catalog(language === 'es' ? 'es' : 'en', item);
  const seen = new Set();
  let highlightedWords = 0;
  const tokens = [];
  let end = 0;
  // matchAll clones the regex: callers never share a mutable lastIndex cursor.
  for (const match of source.matchAll(regex)) {
    const start = match.index;
    const next = start + match[0].length;
    if (start > end) tokens.push({ text: source.slice(end, start), kind: 'plain' });
    let kind = entries.get(normalize(match[0])).kind;
    if (kind === 'vocabulary') {
      const cue = normalize(match[0]);
      const words = cue.trim().split(/\s+/).length;
      if (seen.has(cue) || highlightedWords + words > 3) kind = 'plain';
      else {
        seen.add(cue);
        highlightedWords += words;
      }
    }
    tokens.push({ text: match[0], kind });
    end = next;
  }
  if (end < source.length) tokens.push({ text: source.slice(end), kind: 'plain' });
  return tokens;
}
export function nextStudyIndex(index, direction, count) {
  return Math.max(0, Math.min(Math.max(0, count - 1), index + direction));
}

// Atomic, timer-free transitions keep rapid navigation and boundaries deterministic.
export function nextStudyPage(page, direction, count) {
  const index = nextStudyIndex(page.index, direction, count);
  return index === page.index ? page : { index, direction: index > page.index ? 'next' : 'previous' };
}
