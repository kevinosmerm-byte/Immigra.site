import { calculateReadiness } from "./learning.js";

const STORAGE_KEY = "citizenshipai.practice-events.v1";
const MAX_EVENTS = 250;

function safeRead() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter(isValidEvent).slice(-MAX_EVENTS) : [];
  } catch {
    return [];
  }
}

function isValidEvent(event) {
  return event && ["reading", "writing", "interview", "coach", "quiz"].includes(event.module)
    && typeof event.at === "number";
}

function safeWrite(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    // Practice remains available if browser storage is unavailable.
  }
}

export function getPracticeEvents() {
  return safeRead();
}

export function recordPracticeEvent({ module, score, outcome, responseMs = 0, helpUsed = [], category = module }) {
  const event = {
    module,
    score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null,
    outcome: typeof outcome === "string" ? outcome.slice(0, 40) : "completed",
    category,
    responseMs: Number.isFinite(responseMs) ? Math.max(0, responseMs) : 0,
    helpUsed: Array.isArray(helpUsed) ? helpUsed.slice(0, 5) : [],
    at: Date.now(),
  };
  const events = [...safeRead(), event].slice(-MAX_EVENTS);
  safeWrite(events);
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
