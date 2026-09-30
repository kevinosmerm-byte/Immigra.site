import { calculateReadiness } from "./learning.js";
import { DEFAULT_TEST_VERSION } from "./civicsVersions.js";

export function progressMetrics(completed, total) {
  const count = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const done = Number.isFinite(completed) ? Math.max(0, Math.min(count, Math.floor(completed))) : 0;
  return { completed: done, total: count, progressPercentage: count ? done / count * 100 : 0, isComplete: count > 0 && done === count };
}

const RESUME_MODULES = new Set(["civics", "quiz", "vocabulary", "choose", "connect", "reading", "writing", "interview", "coach"]);
function resumeKey(userKey) { return `citizenshipai.resume.v1:${userKey || "guest"}:${DEFAULT_TEST_VERSION}`; }
function resumeStorage(storage) { try { return storage || globalThis.localStorage; } catch { return null; } }

export function getModuleProgress(userKey = "guest", storage) {
  try {
    const records = JSON.parse(resumeStorage(storage)?.getItem(resumeKey(userKey)) || "{}");
    return Object.fromEntries(Object.entries(records || {}).filter(([module, record]) => RESUME_MODULES.has(module) && record?.testVersion === DEFAULT_TEST_VERSION && Number.isFinite(record.lastAccess)));
  } catch { return {}; }
}

/** Store learning checkpoints, never voice transcripts or personal interview answers. */
export function saveModuleProgress(module, value, userKey = "guest", storage) {
  if (!RESUME_MODULES.has(module)) return null;
  const record = {
    module, testVersion: DEFAULT_TEST_VERSION,
    ...progressMetrics(value.completed, value.total),
    questionIndex: Math.max(0, Math.min(Math.max(0, (value.total || 1) - 1), Math.floor(value.questionIndex) || 0)),
    questionIds: Array.isArray(value.questionIds) ? value.questionIds.filter(Number.isInteger).slice(0, 200) : [],
    mode: ["vocabulary", "choose", "connect", "recall", "challenge"].includes(value.mode) ? value.mode : null,
    score: Number.isFinite(value.score) ? Math.max(0, value.score) : 0,
    resultStatus: ["correct", "incorrect", "incomplete", "review"].includes(value.resultStatus) ? value.resultStatus : null,
    incorrect: Number.isFinite(value.incorrect) ? Math.max(0, value.incorrect) : 0,
    missedIds: Array.isArray(value.missedIds) ? value.missedIds.filter(Number.isInteger).slice(0, 200) : [],
    lastAccess: Date.now(),
  };
  try { resumeStorage(storage)?.setItem(resumeKey(userKey), JSON.stringify({ ...getModuleProgress(userKey, storage), [module]: record })); } catch { /* Practice works without storage. */ }
  return record;
}

export function getContinueStudying(userKey = "guest", storage) {
  return Object.values(getModuleProgress(userKey, storage)).filter(record => !record.isComplete && record.total > 0).sort((a, b) => b.lastAccess - a.lastAccess)[0] || null;
}

export function migrateLegacyCivicsProgress(total, userKey = "guest", storage) {
  const existing = getModuleProgress(userKey, storage).civics;
  if (existing || userKey !== "guest") return existing || null;
  try {
    const parsed = JSON.parse(resumeStorage(storage)?.getItem("civicsViewed") || "[]");
    const viewed = Array.isArray(parsed) ? [...new Set(parsed.filter(index => Number.isInteger(index) && index >= 0 && index < total))] : [];
    if (!viewed.length) return null;
    return saveModuleProgress("civics", { completed: viewed.length, total, questionIndex: viewed.at(-1) }, userKey, storage);
  } catch { return null; }
}

export function recordCivicsMistake(questionIndex, correct, userKey = "guest", storage) {
  if (!Number.isInteger(questionIndex) || questionIndex < 0) return [];
  const key = `citizenshipai.civics.needsPractice.v1${userKey === "guest" ? "" : `:${userKey}`}`;
  let current = [];
  try { const parsed = JSON.parse(resumeStorage(storage)?.getItem(key) || "[]"); if (Array.isArray(parsed)) current = parsed.filter(Number.isInteger); } catch { /* Empty fallback. */ }
  const next = correct ? current.filter(index => index !== questionIndex) : [...new Set([...current, questionIndex])];
  try { resumeStorage(storage)?.setItem(key, JSON.stringify(next)); } catch { /* Keep current session usable. */ }
  return next;
}

const STORAGE_KEY = "citizenshipai.practice-events.v1";
const MAX_EVENTS = 250;

function practiceKey(userKey) { return userKey && userKey !== "guest" ? `${STORAGE_KEY}:${userKey}` : STORAGE_KEY; }
function safeRead(userKey) {
  try {
    const value = JSON.parse(localStorage.getItem(practiceKey(userKey)) || "[]");
    return Array.isArray(value) ? value.filter(isValidEvent).slice(-MAX_EVENTS) : [];
  } catch {
    return [];
  }
}

function isValidEvent(event) {
  return event && ["reading", "writing", "interview", "coach", "quiz"].includes(event.module)
    && typeof event.at === "number";
}

function safeWrite(events, userKey) {
  try {
    localStorage.setItem(practiceKey(userKey), JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    // Practice remains available if browser storage is unavailable.
  }
}

export function getPracticeEvents(userKey) {
  return safeRead(userKey);
}

export function recordPracticeEvent({ module, score, outcome, responseMs = 0, helpUsed = [], category = module }, userKey) {
  const event = {
    module,
    score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null,
    outcome: typeof outcome === "string" ? outcome.slice(0, 40) : "completed",
    category,
    responseMs: Number.isFinite(responseMs) ? Math.max(0, responseMs) : 0,
    helpUsed: Array.isArray(helpUsed) ? helpUsed.slice(0, 5) : [],
    at: Date.now(),
  };
  const events = [...safeRead(userKey), event].slice(-MAX_EVENTS);
  safeWrite(events, userKey);
  return events;
}

export function clearPracticeEvents() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}

function moduleSummary(events, module) {
  const matching = events.filter((event) => event.module === module);
  const scored = matching.filter((event) => Number.isFinite(event.score));
  const average = scored.length
    ? Math.round(scored.reduce((total, event) => total + event.score, 0) / scored.length)
    : null;
  return { attempts: matching.length, score: average };
}

export function getPracticeSummary(events = getPracticeEvents(), civicsViewed = [], civicsMastered = []) {
  const reading = moduleSummary(events, "reading");
  const writing = moduleSummary(events, "writing");
  const interview = moduleSummary(events, "interview");
  const coach = moduleSummary(events, "coach");
  const quiz = moduleSummary(events, "quiz");
  const civics = {
    attempts: (Array.isArray(civicsViewed) ? civicsViewed.length : 0) + quiz.attempts,
    score: quiz.score,
  };
  const measuredAttempts = events
    .filter((event) => Number.isFinite(event.score))
    .map((event) => ({
      questionId: `${event.module}-${event.at}`,
      category: event.module === "quiz" ? "civics" : (event.category || event.module),
      correct: event.score >= 70,
      score: event.score,
      answeredAt: new Date(event.at).toISOString(),
      responseMs: event.responseMs || 0,
      helpUsed: event.helpUsed || [],
      mode: event.module === "interview" ? "spoken" : "text",
    }));
  const mastered = new Set(Array.isArray(civicsMastered) ? civicsMastered : []);
  const civicsAttempts = (Array.isArray(civicsViewed) ? civicsViewed : [])
    .filter((questionId) => mastered.has(questionId))
    .map((questionId) => ({
      questionId: `civics-${questionId}`,
      category: "civics",
      correct: true,
      score: 100,
      // Legacy civics mastery did not store dates. Keep the signal without
      // inventing a study day; future per-question attempts will be dated.
      answeredAt: "",
      responseMs: 0,
      helpUsed: ["choices"],
      mode: "text",
    }));
  const evaluation = calculateReadiness(
    [...measuredAttempts, ...civicsAttempts],
    ["civics", "reading", "writing", "interview"],
    { mockInterviews: interview.attempts }
  );
  const readiness = measuredAttempts.length || civicsAttempts.length ? evaluation.readiness : null;

  const candidates = [
    { key: "reading", label: "Read one sentence aloud", detail: "Build your speaking and reading baseline.", data: reading },
    { key: "writing", label: "Complete one writing dictation", detail: "Let AI identify an English writing pattern.", data: writing },
    { key: "interview", label: "Try a Sarah practice interview", detail: "Practice answering questions under interview-style pacing.", data: interview },
    { key: "civics", label: "Review five civics questions", detail: "Strengthen your civics foundation.", data: civics },
  ];
  const recommended = candidates.find((item) => item.data.attempts === 0)
    || candidates.filter((item) => item.data.score !== null).sort((a, b) => a.data.score - b.data.score)[0]
    || candidates[3];
  const plan = [...candidates]
    .sort((a, b) => {
      const aUnmeasured = a.data.attempts === 0 ? 0 : 1;
      const bUnmeasured = b.data.attempts === 0 ? 0 : 1;
      if (aUnmeasured !== bUnmeasured) return aUnmeasured - bUnmeasured;
      if (a.data.score === null && b.data.score !== null) return -1;
      if (a.data.score !== null && b.data.score === null) return 1;
      return (a.data.score ?? 0) - (b.data.score ?? 0);
    })
    .slice(0, 3);

  return {
    readiness,
    accuracy: measuredAttempts.length || civicsAttempts.length ? evaluation.accuracy : null,
    coverage: evaluation.coverage,
    confidence: evaluation.confidence,
    level: evaluation.level,
    metrics: evaluation.metrics,
    readinessReasons: evaluation.reasons,
    civics,
    reading,
    writing,
    interview,
    coach,
    quiz,
    recommended,
    plan,
  };
}
