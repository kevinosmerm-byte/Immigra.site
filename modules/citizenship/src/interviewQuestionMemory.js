import { CONVERSATION_TOPICS } from "./conversationFlow.js";
import { civicsQuestionBank } from "./civicsQuestionBank.js";

const allowed = { civics: new Set(civicsQuestionBank.map(question => question.questionId)), ...Object.fromEntries(Object.entries(CONVERSATION_TOPICS).map(([topic, config]) => [topic, new Set(config.prompts.map((_, index) => index))])) };
const sessionMemory = new Map();
const failedWrites = new Set();
globalThis.addEventListener?.("citizenshipai:local-data-cleared", () => { sessionMemory.clear(); failedWrites.clear(); });
const keyFor = (kind, userKey) => `citizenshipai.interview-questions.v1:${userKey || "guest"}:${kind}`;
const browserStorage = supplied => { if (supplied) return supplied; try { return globalThis.localStorage; } catch { return null; } };
const safeIds = (kind, value) => Array.isArray(value) ? [...new Set(value.filter(id => allowed[kind]?.has(id)))] : [];

export function getReviewedInterviewQuestions(kind, userKey = "guest", storage) {
  const key = keyFor(kind, userKey);
  try {
    const target = browserStorage(storage);
    const value = target?.getItem(key);
    if (target && !failedWrites.has(key)) return safeIds(kind, JSON.parse(value || "{}")?.seen);
  } catch { /* Use session-only memory if storage is unavailable. */ }
  return safeIds(kind, sessionMemory.get(key));
}

function saveIds(kind, ids, userKey, storage) {
  const key = keyFor(kind, userKey);
  const seen = safeIds(kind, ids);
  sessionMemory.set(key, seen);
  try {
    const target = browserStorage(storage);
    if (target) { target.setItem(key, JSON.stringify({ seen })); failedWrites.delete(key); }
    else failedWrites.add(key);
  } catch { failedWrites.add(key); }
}

export function markInterviewQuestionReviewed(kind, id, userKey = "guest", storage) {
  if (!allowed[kind]?.has(id)) return;
  saveIds(kind, [...getReviewedInterviewQuestions(kind, userKey, storage), id], userKey, storage);
}

export function shuffleInterviewQuestions(items, random = Math.random) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.max(0, Math.min(0.999999, Number(random()) || 0)) * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

export function chooseInterviewQuestions(kind, items, idFor, userKey = "guest", storage, random = Math.random) {
  const seen = new Set(getReviewedInterviewQuestions(kind, userKey, storage));
  const unseen = items.filter(item => !seen.has(idFor(item)));
  // Once the finite bank is exhausted, begin another randomized review cycle.
  // Never fill an unfinished cycle with already-reviewed prompts.
  if (!unseen.length && items.length) saveIds(kind, [], userKey, storage);
  return shuffleInterviewQuestions(unseen.length ? unseen : items, random);
}
