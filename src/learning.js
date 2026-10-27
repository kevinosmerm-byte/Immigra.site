const DAY = 86_400_000;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function attemptScore(attempt) {
  if (Number.isFinite(attempt.score)) return clamp(attempt.score / 100);
  return attempt.correct ? 1 : 0;
}

function readinessLevel(score) {
  if (score >= 90) return "ready_for_interview";
  if (score >= 70) return "prepared";
  if (score >= 35) return "in_progress";
  return "beginner";
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

/** Evidence-based readiness. Accuracy is deliberately only one input. */
export function calculateReadiness(attempts = [], expectedCategories = [], options = {}) {
  const valid = attempts.filter((attempt) => attempt && (typeof attempt.correct === "boolean" || Number.isFinite(attempt.score)));
  if (!valid.length) {
    return { accuracy: 0, coverage: 0, readiness: 0, confidence: "low", level: "beginner", metrics: {}, reasons: ["No practice recorded yet."] };
  }

  const accuracy = mean(valid.map(attemptScore));
  const volume = clamp(valid.length / 100);
  const categories = expectedCategories.length ? expectedCategories : [...new Set(valid.map((item) => item.category).filter(Boolean))];
  const categoryScores = categories.map((category) => mean(valid.filter((item) => item.category === category).map(attemptScore)));
  const attemptedCategoryScores = categoryScores.filter((_, index) => valid.some((item) => item.category === categories[index]));
  const coverage = categories.length ? attemptedCategoryScores.length / categories.length : 0;
  // Harmonic-style penalty: one weak preparation area cannot hide behind strong averages.
  const categoryMastery = attemptedCategoryScores.length
    ? attemptedCategoryScores.length / attemptedCategoryScores.reduce((sum, score) => sum + (1 / Math.max(0.2, score)), 0)
    : 0;
  const independent = valid.filter((item) => !item.helpUsed?.length);
  const independence = mean(independent.map(attemptScore)) * clamp(independent.length / 30);
  const dated = valid.filter((item) => Number.isFinite(Date.parse(item.answeredAt)));
  const studyDays = new Set(dated.map((item) => item.answeredAt.slice(0, 10))).size;
  const consistency = clamp(studyDays / 10);
  const timed = valid.filter((item) => Number.isFinite(item.responseMs) && item.responseMs > 0);
  const pace = timed.length ? mean(timed.map((item) => clamp(1 - Math.max(0, item.responseMs - 20_000) / 40_000))) : 0.35;
  const recent = [...dated].sort((a, b) => Date.parse(b.answeredAt) - Date.parse(a.answeredAt)).slice(0, 20);
  const recentAccuracy = recent.length ? mean(recent.map(attemptScore)) : accuracy;
  const recentErrors = 1 - recentAccuracy;
  const now = Number.isFinite(Date.parse(options.now)) ? Date.parse(options.now) : Date.now();
  const due = valid.filter((item) => item.nextReviewAt && Date.parse(item.nextReviewAt) <= now);
  const reviewedDue = due.filter((item) => item.reviewedOnSchedule !== false);
  const spacedRepetition = due.length ? reviewedDue.length / due.length : clamp(studyDays / 7) * 0.6;
  const mockInterviews = Number.isFinite(options.mockInterviews)
    ? options.mockInterviews
    : valid.filter((item) => item.category === "interview" || item.isMockInterview).length;

  let readiness = accuracy * 0.22 + volume * 0.16 + consistency * 0.12 + coverage * 0.11
    + categoryMastery * 0.13 + independence * 0.1 + pace * 0.05
    + (1 - recentErrors) * 0.06 + spacedRepetition * 0.05;
  const reasons = [];
  if (valid.length < 20) {
    readiness = Math.min(readiness, 0.45);
    reasons.push("More answered questions are required for a reliable estimate.");
  } else if (valid.length < 100) {
    readiness = Math.min(readiness, 0.75);
    reasons.push("Complete 100 measured answers to unlock high readiness.");
  }
  if (valid.length < 100 || mockInterviews < 2) {
    readiness = Math.min(readiness, 0.9);
    if (mockInterviews < 2) reasons.push("Complete two mock interviews before readiness can exceed 90%.");
  }
  if (coverage < 1) reasons.push("Not all preparation areas have been evaluated.");
  if (independent.length < 20) reasons.push("More answers without hints or choices are needed.");
  if (studyDays < 3) reasons.push("Recall still needs to be confirmed on different days.");

  const readinessPercent = Math.round(clamp(readiness) * 100);
  return {
    accuracy: Math.round(accuracy * 100), coverage: Math.round(coverage * 100), readiness: readinessPercent,
    confidence: valid.length >= 100 && studyDays >= 7 && mockInterviews >= 2 ? "high" : valid.length >= 30 ? "medium" : "low",
    level: readinessLevel(readinessPercent), reasons,
    metrics: { answered: valid.length, consistency: Math.round(consistency * 100), categoryMastery: Math.round(categoryMastery * 100), independent: independent.length, pace: Math.round(pace * 100), recentErrors: Math.round(recentErrors * 100), spacedRepetition: Math.round(spacedRepetition * 100), mockInterviews },
  };
}

export class LegacySpacedRepetitionEngine {
  schedule(previous, attempt) {
    const independent = !attempt.helpUsed?.length;
    const supportPenalty = Math.min(0.35, (attempt.helpUsed?.length || 0) * 0.08);
    const gain = attempt.correct ? Math.max(0.05, 0.2 - supportPenalty + (attempt.mode === "spoken" && independent ? 0.08 : 0)) : -0.22;
    const mastery = clamp((previous.mastery || 0) + gain);
    const streak = attempt.correct && independent ? (previous.consecutiveIndependentCorrect || 0) + 1 : 0;
    const lapses = attempt.correct ? (previous.lapses || 0) : (previous.lapses || 0) + 1;
    const intervalDays = mastery >= 0.9 && streak >= 4 ? 30 : mastery >= 0.75 && streak >= 3 ? 14 : mastery >= 0.6 && streak >= 2 ? 7 : streak ? 3 : attempt.correct ? 1 : 0.25;
    return { ...previous, mastery, consecutiveIndependentCorrect: streak, lapses, intervalDays, lastAttemptAt: attempt.answeredAt, nextReviewAt: new Date(Date.parse(attempt.answeredAt) + intervalDays * DAY).toISOString(), scheduler: "legacy" };
  }
}

// Stable boundary for TS-FSRS. The injected adapter is shadow-only in phase one.
export class SpacedRepetitionEngine {
  constructor({ fsrsAdapter = null, shadowMode = true, onShadowResult = () => {} } = {}) {
    this.legacy = new LegacySpacedRepetitionEngine();
    this.fsrsAdapter = fsrsAdapter;
    this.shadowMode = shadowMode;
    this.onShadowResult = onShadowResult;
  }
  schedule(previous, attempt) {
    const legacy = this.legacy.schedule(previous, attempt);
    if (!this.fsrsAdapter) return legacy;
    let fsrs;
    try {
      fsrs = this.fsrsAdapter.schedule(previous, attempt);
    } catch (error) {
      this.onShadowResult({ questionId: previous.questionId, legacy, fsrs: null, error: error instanceof Error ? error.message : String(error) });
      return legacy;
    }
    if (this.shadowMode) {
      this.onShadowResult({ questionId: previous.questionId, legacy, fsrs });
      return legacy;
    }
    return { ...fsrs, scheduler: "ts-fsrs" };
  }
}

export function updateQuestionState(previous, attempt, scheduler = new LegacySpacedRepetitionEngine()) {
  return scheduler.schedule(previous, attempt);
}

export function buildDailyPlan(states = [], nowIso, limit = 10) {
  const now = Date.parse(nowIso);
  const categoryAverage = new Map();
  for (const state of states) {
    const scores = categoryAverage.get(state.category) || [];
    scores.push(state.mastery || 0);
    categoryAverage.set(state.category, scores);
  }
  const weakness = (category) => 1 - mean(categoryAverage.get(category) || [0]);
  return [...states].sort((a, b) => {
    const aDue = Date.parse(a.nextReviewAt) <= now ? 1 : 0;
    const bDue = Date.parse(b.nextReviewAt) <= now ? 1 : 0;
    const aPriority = aDue * 4 + (a.lapses || 0) * 0.4 + weakness(a.category) * 2 + (1 - (a.mastery || 0));
    const bPriority = bDue * 4 + (b.lapses || 0) * 0.4 + weakness(b.category) * 2 + (1 - (b.mastery || 0));
    return bPriority - aPriority;
  }).slice(0, limit).map((state) => ({
    questionId: state.questionId, category: state.category,
    reason: Date.parse(state.nextReviewAt) <= now ? "due" : weakness(state.category) >= 0.4 ? "weak_category" : (state.lapses || 0) ? "recent_error" : "interview_rehearsal",
    support: (state.mastery || 0) >= 0.75 ? "none" : state.preferredSupport || "context",
  }));
}
