import {getCivicsQuestion} from '../modules/citizenship/src/civicsQuestionBank.js';

// The official English questions and answers always come from the versioned bank.
const items = [
  {id: 2, choices: [['La Declaración de Independencia', 'The Declaration of Independence'], ['La Constitución', null], ['La Carta de Derechos', 'The Bill of Rights']]},
  {id: 7, choices: [['10', '10'], ['50', '50'], ['27', null]]},
  {id: 21, choices: [['100', null], ['50', '50'], ['435', '435']]}
];

export function starterQuestions(language) {
  return items.map(({id, choices}) => {
    const question = getCivicsQuestion(id);
    return {
      id, prompt: language === 'es' ? question.questionSpanish : question.question,
      answer: question.acceptedAnswers[0],
      correct: choices.findIndex(([, english]) => english === null),
      choices: choices.map(([spanish, english]) => language === 'es' ? spanish : english ?? question.acceptedAnswers[0])
    };
  });
}

export const starterRoute = '/first-practice';
export function starterCallback(origin, language) {
  const url = new URL('/', origin);
  url.searchParams.set('practice', 'civics');
  url.searchParams.set('lang', language === 'en' ? 'en' : 'es');
  return url.href;
}

export function starterAuthReturn(location) {
  const params = new URLSearchParams(location.search);
  return params.get('practice') === 'civics' && !['checkout','billing','guest_checkout'].some(key => params.has(key));
}

export function readSavedStarter(user, storage) {
  if (!user) return null;
  try {
    const saved = JSON.parse(storage.getItem('immigra.civics.starter.v1:' + user));
    if (Number.isInteger(saved?.position) && saved.position >= 1 && saved.position <= items.length &&
        Array.isArray(saved.review) && saved.review.every(i => Number.isInteger(i) && i >= 0 && i < items.length)) return saved;
  } catch {}
  return null;
}

export function loadStarter(user, storage) {
  return readSavedStarter(user, storage) ?? {position: 1, review: [], completedDay: ''};
}

export const dailyCivicsPlan = '#/citizenship/practice';
export const starterReviewRoute = '#' + starterRoute + '/review';

export function starterNextStep(progress) {
  if (!progress) return 'module';
  if (progress.position < items.length) return 'resume';
  return progress.review.length ? 'review' : 'plan';
}

export function saveStarter(user, state, storage) {
  try { storage.setItem('immigra.civics.starter.v1:' + user, JSON.stringify(state)); } catch {}
}
