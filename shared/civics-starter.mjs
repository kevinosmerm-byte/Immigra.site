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

const guestKey = 'immigra.civics.starter.guest.v1';
function readProgress(key, storage) {
  try {
    const saved = JSON.parse(storage.getItem(key));
    if (Number.isInteger(saved?.position) && saved.position >= 0 && saved.position <= items.length &&
        Array.isArray(saved.review) && saved.review.every(i => Number.isInteger(i) && i >= 0 && i < saved.position)) {
      return {position: saved.position, review: [...new Set(saved.review)], completedDay: saved.position === items.length && /^\d{4}-\d{2}-\d{2}$/.test(saved.completedDay) ? saved.completedDay : ''};
    }
  } catch {}
  return null;
}

export function readSavedStarter(user, storage) {
  return user ? readProgress('immigra.civics.starter.v1:' + user, storage) : null;
}

export function readGuestStarter(storage) { return readProgress(guestKey, storage); }

export function loadStarter(user, storage, now = Date.now()) {
  const saved = user ? readSavedStarter(user, storage) : readGuestStarter(storage);
  if (saved) return saved;
  // A completed public sample is question one, not a new registration requirement.
  try {
    const sample = JSON.parse(storage.getItem('immigra.civics.sample.v1'));
    if (typeof sample?.review === 'boolean' && Number.isFinite(sample.time) && now >= sample.time && now - sample.time < 3600000) {
      return {position: 1, review: sample.review ? [0] : [], completedDay: ''};
    }
  } catch {}
  return {position: 0, review: [], completedDay: ''};
}

export function allowStarterTransfer(storage, now = Date.now()) {
  try { storage.setItem(guestKey + ':transfer', String(now)); } catch {}
}

export function claimStarter(user, storage, now = Date.now()) {
  if (!user) return null;
  const existing = readSavedStarter(user, storage);
  try {
    const requestedAt = Number(storage.getItem(guestKey + ':transfer'));
    const guest = readGuestStarter(storage);
    if (requestedAt > 0 && now >= requestedAt && now - requestedAt < 3600000) {
      storage.removeItem(guestKey + ':transfer');
      if (!existing && guest) {
        saveStarter(user, guest, storage);
        storage.removeItem(guestKey);
        return guest;
      }
    }
  } catch {}
  return existing;
}

export const dailyCivicsPlan = '#/citizenship/practice';
export const starterReviewRoute = '#' + starterRoute + '/review';

export function starterNextStep(progress) {
  if (!progress) return 'module';
  if (progress.position < items.length) return 'resume';
  return progress.review.length ? 'review' : 'plan';
}

export function saveStarter(user, state, storage) {
  try { storage.setItem(user ? 'immigra.civics.starter.v1:' + user : guestKey, JSON.stringify(state)); } catch {}
}
