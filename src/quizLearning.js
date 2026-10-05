import { getCivicsCategory } from "./civicsVersions.js";
import { evaluateCivicsAnswer, normalizeCivicsAnswer } from "./civicsAnswerEvaluator.js";
import { buildDailyPlan, updateQuestionState } from "./learning.js";

export const QUIZ_LEVELS = Object.freeze([
  { id: "vocabulary", skill: "vocabulary", icon: "Aa", level: 1 },
  { id: "choose", skill: "recognition", icon: "✓", level: 2 },
  { id: "connect", skill: "matching", icon: "↔", level: 3 },
  { id: "recall", skill: "recall", icon: "✎", level: 4 },
  { id: "challenge", skill: "challenge", icon: "★", level: 5 },
]);

const STORAGE_PREFIX = "citizenshipai.quiz-progress.v1";
const MAX_SESSION_QUESTIONS = 10;
const WORD_TRANSLATIONS = Object.freeze({
  amendment: "enmienda", amendments: "enmiendas", answer: "respuesta", branch: "rama",
  capital: "capital", citizen: "ciudadano", citizens: "ciudadanos", colonies: "colonias",
  congress: "Congreso", constitution: "Constitución", court: "tribunal", democracy: "democracia",
  election: "elección", federal: "federal", flag: "bandera", freedom: "libertad",
  government: "gobierno", governor: "gobernador", independence: "independencia",
  judge: "juez", judges: "jueces", justice: "justicia", law: "ley", laws: "leyes",
  liberty: "libertad", military: "fuerzas armadas", president: "presidente",
  representative: "representante", representatives: "representantes", republic: "república",
  rights: "derechos", senator: "senador", senators: "senadores", state: "estado",
  states: "estados", supreme: "suprema", taxes: "impuestos", vote: "votar", war: "guerra",
});
const VOCABULARY_STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "because", "do", "does", "for", "from",
  "have", "how", "in", "is", "it", "many", "name", "of", "one", "the", "there", "to",
  "two", "united", "us", "was", "what", "when", "which", "who", "why", "with", "your",
]);

export { getCivicsCategory } from "./civicsVersions.js";

function titleCase(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function vocabularyFor(question) {
  const preferred = question.acceptedAnswers[0] || "Official answer update";
  const words = `${question.question} ${preferred}`.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().match(/[a-z]+/g) || [];
  const unique = [...new Set(words.filter((word) => word.length >= 4 && !VOCABULARY_STOP_WORDS.has(word)))];
  const prioritized = [
    ...unique.filter((word) => WORD_TRANSLATIONS[word]),
    ...unique.filter((word) => !WORD_TRANSLATIONS[word]),
  ].slice(0, 3);
  return prioritized.map((word) => ({
    word: titleCase(word),
    translation: WORD_TRANSLATIONS[word] || "",
  }));
}

export function buildQuizQuestionModels(questionBank) {
  return questionBank.map((question) => ({
    ...question,
    category: getCivicsCategory(question.questionId),
    preferredAnswer: question.acceptedAnswers.slice(0, question.minimumAnswersRequired || 1).join("; "),
    vocabulary: vocabularyFor(question),
  }));
}

export function buildAnswerChoices(question, questions, count = 4) {
  if (!question?.preferredAnswer) return [];
  const official = new Set([...question.acceptedAnswers, ...(question.aliases || [])].map(normalizeCivicsAnswer));
  const distractors = questions
    .filter((item) => item.questionId !== question.questionId && item.preferredAnswer)
    .sort((left, right) => {
      const leftCategory = left.category === question.category ? 0 : 1;
      const rightCategory = right.category === question.category ? 0 : 1;
      return leftCategory - rightCategory || Math.abs(left.questionId - question.questionId) - Math.abs(right.questionId - question.questionId);
    })
    .map((item) => item.preferredAnswer)
    .filter((answer, index, items) => !official.has(normalizeCivicsAnswer(answer)) && items.indexOf(answer) === index)
    .slice(0, Math.max(0, count - 1));
  const choices = [question.preferredAnswer, ...distractors];
  return choices.sort((left, right) => {
    const seedLeft = [...left].reduce((sum, character) => sum + character.charCodeAt(0), question.questionId);
    const seedRight = [...right].reduce((sum, character) => sum + character.charCodeAt(0), question.questionId);
    return (seedLeft % 17) - (seedRight % 17) || left.localeCompare(right);
  });
}

function storageKey(userKey) {
  return `${STORAGE_PREFIX}:${String(userKey || "guest")}`;
}

function getStorage(storage) {
  if (storage) return storage;
  try { return window.localStorage; } catch { return null; }
}

export function getQuizProgress(userKey = "guest", storage) {
  try {
    const parsed = JSON.parse(getStorage(storage)?.getItem(storageKey(userKey)) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function calculateModeMastery(progress) {
  return Math.round(
    (progress.vocabulary || 0) * 0.1
    + (progress.recognition || 0) * 0.2
    + (progress.matching || 0) * 0.2
    + (progress.recall || 0) * 0.3
    + (progress.challenge || 0) * 0.2
  );
}

export function recordQuizAttempt({ userKey = "guest", question, mode, correct, score = correct ? 100 : 0, helpUsed = [], answeredAt = new Date().toISOString(), storage }) {
  const current = getQuizProgress(userKey, storage);
  const previous = current[question.questionId] || {
    questionId: question.questionId, category: question.category, attempts: 0, correct: 0,
    vocabulary: 0, recognition: 0, matching: 0, recall: 0, challenge: 0,
    mastery: 0, consecutiveIndependentCorrect: 0, lapses: 0,
  };
  const skill = QUIZ_LEVELS.find((level) => level.id === mode)?.skill || mode;
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const updated = {
    ...previous,
    attempts: previous.attempts + 1,
    correct: previous.correct + (correct ? 1 : 0),
    [skill]: Math.max(previous[skill] || 0, normalizedScore),
  };
  updated.modeMastery = calculateModeMastery(updated) / 100;
  const scheduled = updateQuestionState(updated, {
    correct, score: normalizedScore, answeredAt, helpUsed,
    mode: mode === "challenge" || mode === "recall" ? "text" : "choice",
  });
  // Memory follows actual attempts, rather than the best score ever seen in a mode.
  const recentResults = [...(Array.isArray(previous.recentResults) ? previous.recentResults : []), Boolean(correct)].slice(-5);
  scheduled.lastCorrect = Boolean(correct);
  scheduled.recentResults = recentResults;
  scheduled.recentErrors = recentResults.filter(value => !value).length;
  scheduled.incorrect = (previous.incorrect ?? Math.max(0, previous.attempts - previous.correct)) + (correct ? 0 : 1);
  const next = { ...current, [question.questionId]: scheduled };
  try { getStorage(storage)?.setItem(storageKey(userKey), JSON.stringify(next)); } catch { /* Quiz remains usable without storage. */ }
  return next;
}

export function getAdaptiveQuestionOrder(questions, progress = {}, now = Date.now()) {
  const states = questions.map(question => ({ ...progress[question.questionId], questionId: question.questionId, category: question.category || getCivicsCategory(question.questionId) }));
  const ranked = buildDailyPlan(states, new Date(now).toISOString(), questions.length);
  const byId = new Map(questions.map(question => [question.questionId, question]));
  return ranked.map(item => byId.get(item.questionId));
}

export function createQuizSession(questions, progress, mode, limit = MAX_SESSION_QUESTIONS, now = Date.now(), preferredQuestionIds = []) {
  const candidates = mode === "vocabulary" ? questions : questions.filter((question) => question.acceptedAnswers.length);
  const adaptive = getAdaptiveQuestionOrder(candidates, progress, now);
  const byId = new Map(candidates.map(question => [question.questionId, question]));
  const preferred = [...new Set(Array.isArray(preferredQuestionIds) ? preferredQuestionIds : [])].map(id => byId.get(id)).filter(Boolean);
  const selected = new Set(preferred.map(question => question.questionId));
  return [...preferred, ...adaptive.filter(question => !selected.has(question.questionId))].slice(0, Math.max(0, limit));
}

export function evaluateQuizResponse(question, answer) {
  return evaluateCivicsAnswer(question, answer);
}

export function summarizeQuizProgress(progress = {}, totalQuestions = 128) {
  const states = Object.values(progress);
  const averages = Object.fromEntries(QUIZ_LEVELS.map(({ id, skill }) => [id,
    states.length ? Math.round(states.reduce((sum, item) => sum + (item[skill] || 0), 0) / totalQuestions) : 0,
  ]));
  const attempted = states.filter((item) => item.attempts > 0).length;
  const mastered = states.filter((item) => (item.mastery || 0) >= 0.9 && (item.consecutiveIndependentCorrect || 0) >= 4).length;
  const recommended = QUIZ_LEVELS.find(({ id }) => averages[id] < 70)?.id || "challenge";
  return {
    attempted,
    attemptedPercent: Math.round((attempted / totalQuestions) * 100),
    mastered,
    percent: Math.round((mastered / totalQuestions) * 100),
    averages,
    recommended,
  };
}
