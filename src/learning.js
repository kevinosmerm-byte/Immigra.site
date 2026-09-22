const DAY = 86_400_000;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function levelFor(score) {
  if (score >= 0.9) return "interview";
  if (score >= 0.75) return "master";
  if (score >= 0.6) return "recall";
  if (score >= 0.4) return "recognize";
  return "learn";
}

function attemptScore(attempt) {
  if (Number.isFinite(attempt.score)) return clamp(attempt.score / 100);
  return attempt.correct ? 1 : 0;
}

export function calculateReadiness(attempts, expectedCategories) {
  if (!attempts.length) {
    return {
      accuracy: 0,
      coverage: 0,
      readiness: 0,
      confidence: "low",
      level: "learn",
      reasons: ["No practice recorded yet."],
    };
  }

  const accuracy = attempts.reduce((total, attempt) => total + attemptScore(attempt), 0) / attempts.length;
  const volume = clamp(attempts.length / 100);
  const categories = new Set(attempts.map((attempt) => attempt.category));
  const coverage = expectedCategories.length ? clamp(categories.size / expectedCategories.length) : 0;
  const independent = attempts.filter((attempt) =>
    attempt.helpUsed.length === 0 && ["spoken", "text"].includes(attempt.mode)
  );
  const independentCorrect = independent.reduce((total, attempt) => total + attemptScore(attempt), 0);
  const independence = clamp(independentCorrect / Math.max(20, independent.length));
  const studyDays = new Set(
    attempts
      .map((attempt) => attempt.answeredAt?.slice(0, 10))
      .filter(Boolean)
  ).size;
  const consistency = clamp(studyDays / 7);

  const raw = accuracy * 0.4
    + volume * 0.2
    + consistency * 0.15
    + coverage * 0.15
    + independence * 0.1;
  let readiness = raw;
  const reasons = [];

  if (attempts.length < 20) {
    readiness = Math.min(readiness, 0.49);
    reasons.push("More practice is required for a reliable readiness estimate.");
  } else if (attempts.length < 100) {
    readiness = Math.min(readiness, 0.89);
    reasons.push("Complete at least 100 attempts before reaching 90% readiness.");
  }
  if (coverage < 1) reasons.push("Not all preparation areas have been evaluated.");
  if (independence < 0.6) reasons.push("More answers without hints or choices are needed.");
  if (studyDays < 3) reasons.push("Recall still needs to be confirmed on different days.");

  readiness = clamp(readiness);
  return {
    accuracy: Math.round(accuracy * 100),
    coverage: Math.round(coverage * 100),
    readiness: Math.round(readiness * 100),
    confidence: attempts.length >= 100 && studyDays >= 7 ? "high" : attempts.length >= 30 ? "medium" : "low",
    level: levelFor(readiness),
    reasons,
  };
}

export function updateQuestionState(previous, attempt) {
  const independent = attempt.helpUsed.length === 0;
  const supportPenalty = Math.min(0.35, attempt.helpUsed.length * 0.08);
  const spokenBonus = attempt.mode === "spoken" && independent ? 0.08 : 0;
  const gain = attempt.correct ? Math.max(0.05, 0.2 - supportPenalty + spokenBonus) : -0.22;
  const mastery = clamp(previous.mastery + gain);
  const streak = attempt.correct && independent ? previous.consecutiveIndependentCorrect + 1 : 0;
  const lapses = attempt.correct ? previous.lapses : previous.lapses + 1;
  const interval = mastery >= 0.9 && streak >= 4 ? 30
    : mastery >= 0.75 && streak >= 3 ? 14
      : mastery >= 0.6 && streak >= 2 ? 7
        : streak >= 1 ? 3 : attempt.correct ? 1 : 0.25;

  return {
    ...previous,
    mastery,
    consecutiveIndependentCorrect: streak,
    lapses,
    lastAttemptAt: attempt.answeredAt,
    nextReviewAt: new Date(new Date(attempt.answeredAt).getTime() + interval * DAY).toISOString(),
  };
}

export function buildDailyPlan(states, nowIso, limit = 10) {
  const now = new Date(nowIso).getTime();
  return [...states]
    .sort((a, b) => {
      const aDue = new Date(a.nextReviewAt).getTime() <= now ? 0 : 1;
      const bDue = new Date(b.nextReviewAt).getTime() <= now ? 0 : 1;
      return aDue - bDue || a.mastery - b.mastery || b.lapses - a.lapses;
    })
    .slice(0, limit)
    .map((state) => ({
      questionId: state.questionId,
      reason: new Date(state.nextReviewAt).getTime() <= now
        ? "due"
        : state.mastery < 0.6 ? "weak_category" : "interview_rehearsal",
      support: state.mastery >= 0.75 ? "none" : state.preferredSupport || "context",
    }));
}
