export const COMPANION_EVENT = "citizenshipai:learning";
export const COMPANION_VISIBILITY_KEY = "citizenshipai-companion-visible-v1";
const STREAK_KEY = "citizenshipai-companion-streak-v1";
const VALID_STATES = new Set([
  "idle", "thinking", "correct", "incorrect", "streak", "reading", "coach",
  "celebration", "welcome", "explain", "curious", "surprised", "determined",
  "support", "progress", "sleepy", "approved", "denied", "studying", "love", "goal",
]);

function safeLocalStorage() {
  try { return window.localStorage; } catch { return null; }
}

export function emitCompanionState(state, { message, duration, silent = false } = {}) {
  if (typeof window === "undefined" || !VALID_STATES.has(state)) return false;
  const detail = { state };
  if (typeof message === "string" && message.trim()) detail.message = message.trim().slice(0, 180);
  if (Number.isFinite(duration)) detail.duration = Math.max(0, Math.min(duration, 12000));
  if (silent) detail.silent = true;
  window.dispatchEvent(new CustomEvent(COMPANION_EVENT, { detail }));
  return true;
}

export function getCompanionVisibility() {
  return safeLocalStorage()?.getItem(COMPANION_VISIBILITY_KEY) !== "false";
}

export function setCompanionVisibility(visible) {
  const next = Boolean(visible);
  const companion = typeof document === "undefined" ? null : document.querySelector("citizenship-companion");
  if (companion?.setVisible) companion.setVisible(next);
  else safeLocalStorage()?.setItem(COMPANION_VISIBILITY_KEY, String(next));
  return next;
}

export function setCompanionSessionVisibility(visible) {
  const next = Boolean(visible);
  const companion = typeof document === "undefined" ? null : document.querySelector("citizenship-companion");
  companion?.setSessionVisible?.(next);
  return next;
}

export function emitCompanionResult(correct, options = {}) {
  const storage = safeLocalStorage();
  const previous = Number.parseInt(storage?.getItem(STREAK_KEY) || "0", 10) || 0;
  const streak = correct ? previous + 1 : 0;
  storage?.setItem(STREAK_KEY, String(streak));
  emitCompanionState(correct ? "correct" : "incorrect", options);
  if (correct && (streak === 3 || streak === 5 || (streak > 5 && streak % 5 === 0))) {
    window.setTimeout(() => emitCompanionState("streak"), 1500);
  }
  return streak;
}

/** Derive gentle reactions from shared context; messages never contain private facts. */
export function emitCompanionContext(context = {}, previous = null) {
  const es = context.language === "es";
  const learning = context.learningProfile || {};
  const oldLearning = previous?.learningProfile || {};
  const completed = profile => (profile.practiceEvents || []).filter(event => event?.outcome === "completed").length;
  if (previous && completed(learning) > completed(oldLearning)) {
    return emitCompanionState("celebration", { message: es ? "Completaste tu práctica. ¡Buen trabajo!" : "You completed your practice. Well done!", duration: 3500 });
  }
  const masteryCount = profile => (profile.questionStates || []).filter(state => state?.status === "MASTERED").length;
  if (previous && masteryCount(learning) > masteryCount(oldLearning)) {
    return emitCompanionState("progress", { message: es ? "Dominas más preguntas. Sigue así." : "You've mastered more questions. Keep going.", duration: 3500 });
  }
  const stage = context.caseProfile?.currentStage;
  const interviewDate = context.caseProfile?.interviewDate || context.immigrationProfile?.interviewDate;
  const oldDate = previous?.caseProfile?.interviewDate || previous?.immigrationProfile?.interviewDate;
  if (stage === "INTERVIEW_SCHEDULED" && interviewDate && (!previous || stage !== previous.caseProfile?.currentStage || interviewDate !== oldDate)) {
    return emitCompanionState("coach", { message: es ? "Tu entrevista está programada. Preparémonos paso a paso." : "Your interview is scheduled. Let's prepare one step at a time.", duration: 4000 });
  }
  return false;
}
