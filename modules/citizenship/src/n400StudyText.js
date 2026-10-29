// Color is a reading aid, never an answer or correctness signal.
// Curated vocabulary only; Unicode word boundaries avoid substring collisions.
const vocabulary = {
  en: /^(?:(?:communism|communists?)|weapons?|arms|vote[ds]?|voting|tax(?:es)?)$/iu,
  es: /^(?:comunismo|comunistas?|armas?|votar|votado|votando|votos?|impuestos?)$/iu,
};
const vocabularySplit = {
  en: /(?<![\p{L}\p{N}_])((?:communism|communists?)|weapons?|arms|vote[ds]?|voting|tax(?:es)?)(?![\p{L}\p{N}_])/giu,
  es: /(?<![\p{L}\p{N}_])(comunismo|comunistas?|armas?|votar|votado|votando|votos?|impuestos?)(?![\p{L}\p{N}_])/giu,
};
// Semantic phrases are tokenized first; vocabulary can only split plain text.
// Every source character, case, space and punctuation is preserved.
export function n400StudyTokens(text, language = 'en') {
  const lang = language === 'es' ? 'es' : 'en';
  const phrases = lang === 'en' ? String(text).split(/(\bHAVE\s+YOU\s+EVER\b|\bDO\s+YOU\s+SUPPORT\b|\bEVER\b|\b(?:DO YOU|HAVE YOU|ARE YOU|DID YOU|WERE YOU|WILL YOU)\b)/gi) : [String(text)];
  return phrases.filter(Boolean).flatMap(text => {
    const kind = lang === 'en' && /^(?:have\s+you\s+)?ever$/i.test(text) ? 'ever' : lang === 'en' && /^do\s+you\s+support$/i.test(text) ? 'support' : lang === 'en' && /^(?:do you|have you|are you|did you|were you|will you)$/i.test(text) ? 'stem' : 'plain';
    if (kind !== 'plain') return [{text, kind}];
    return text.split(vocabularySplit[lang]).filter(Boolean).map(text => ({text, kind:vocabulary[lang].test(text) ? 'vocabulary' : 'plain'}));
  });
}
export function nextStudyIndex(index, direction, count) {
  return Math.max(0, Math.min(Math.max(0, count - 1), index + direction));
}

// Atomic, timer-free transitions keep rapid navigation and boundaries deterministic.
export function nextStudyPage(page, direction, count) {
  const index = nextStudyIndex(page.index, direction, count);
  return index === page.index ? page : { index, direction: index > page.index ? 'next' : 'previous' };
}
