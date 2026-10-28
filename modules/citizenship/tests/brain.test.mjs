import test from "node:test";
import assert from "node:assert/strict";
import { buildBrainContext, getDailyStudyPlan, getNextAction } from "../src/brain.js";
import { civicsQuestionBank } from "../src/civicsQuestionBank.js";
import { buildQuizQuestionModels, createQuizSession, recordQuizAttempt, summarizeQuizProgress } from "../src/quizLearning.js";
import { getContinueStudying, getModuleProgress, getN400LearningProgress, recordN400Review, saveModuleProgress } from "../src/progress.js";
import { createN400InterviewState, selectNextN400Question } from "../src/n400InterviewEngine.js";
import n400Bank from "../src/data/n400InterviewBank.json" with { type: "json" };

const NOW = "2026-10-05T12:00:00.000Z";
const context = input => buildBrainContext({ now: NOW, ...input });
const plan = brain => getDailyStudyPlan(brain, { now: NOW });
const questions = buildQuizQuestionModels(civicsQuestionBank);
function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
}

test("Brain reuses supplied profile facts and journey dates without mutating source stores", () => {
  const input = {
    userProfile: { firstName: "Ana" },
    civicProfile: { zipCode: "77001", state: { code: "TX" } },
    immigrationProfile: { interviewDate: "2026-10-17", interviewTime: "08:30" },
    n400Profile: { answers: { P_MARITAL_STATUS: "single" }, flags: {} },
    preferences: { availableStudyMinutes: 12, soundEnabled: false },
  };
  const before = structuredClone(input);
  const brain = context(input);
  assert.equal(brain.userProfile.zipCode, "77001");
  assert.equal(brain.userProfile.state, "TX");
  assert.equal(brain.caseProfile.interviewDate, "2026-10-17");
  assert.equal(brain.caseProfile.currentStage, "INTERVIEW_SCHEDULED");
  assert.equal(brain.n400Profile.answers.P_MARITAL_STATUS, "single");
  assert.equal(brain.n400Profile.flags.married, undefined);
  assert.deepEqual(input, before);
  assert.equal(plan(brain).interviewTime, "08:30");
});

test("viewed cards and self-marked learning never create independent question mastery or study dates", () => {
  const brain = context({ learningProfile: { civicsViewed: [0], civicsMastered: [0] } });
  assert.equal(brain.learningProfile.questionStates.length, 128);
  const state = brain.learningProfile.questionStates[0];
  assert.equal(state.viewed, true);
  assert.equal(state.markedLearned, true);
  assert.equal(state.status, "NEW");
  assert.equal(state.mastery, 0);
  assert.equal(state.lastReviewAt, null);
  assert.equal(state.nextReviewAt, null);
  assert.equal(brain.learningProfile.dueQuestionIds.length, 0);
});

test("daily questions prioritize actual due reviews and recent errors before new questions", () => {
  const brain = context({ learningProfile: { quizProgress: {
    2: { attempts: 5, correct: 5, mastery: 0.9, consecutiveIndependentCorrect: 4, nextReviewAt: "2026-10-04T12:00:00Z", lastCorrect: true },
    5: { attempts: 4, correct: 1, mastery: 0.2, recentErrors: 3, lastCorrect: false, nextReviewAt: "2026-10-06T12:00:00Z" },
  } } });
  const daily = plan(brain);
  assert.deepEqual(daily.items[0].questionIds.slice(0, 2), [5, 2]);
  assert.equal(daily.items[0].reason, "due");
  assert.deepEqual(brain.learningProfile.dueQuestionIds, [2]);
  assert.equal(brain.learningProfile.questionStates[4].status, "WEAK");
  assert.ok(brain.learningProfile.weakTopics.some(topic => topic.category === "principles"));
  assert.deepEqual(daily, plan(brain));
});

test("case stage and a confirmed interview date change preparation priorities", () => {
  const foundational = plan(context({ caseProfile: { currentStage: "N400_FILED" } }));
  const pending = plan(context({ caseProfile: { currentStage: "INTERVIEW_PENDING" } }));
  const scheduled = plan(context({ caseProfile: { currentStage: "INTERVIEW_SCHEDULED", interviewDate: "2026-10-17" } }));
  const oath = plan(context({ caseProfile: { currentStage: "OATH_SCHEDULED", oathDate: "2026-10-20" } }));
  assert.equal(foundational.items[0].module, "quiz");
  assert.equal(pending.items[0].mode, "n400");
  assert.equal(scheduled.items[0].mode, "n400");
  assert.equal(scheduled.daysUntilInterview, 12);
  assert.equal(oath.items[0].module, "uscisTracker");
  assert.equal(oath.focus, "oath_preparation");
  assert.ok(!oath.items.some(item => item.module === "quiz" || item.module === "interview"));
});

test("a confirmed upcoming Profile date guides interview preparation while preserving earlier case stages", () => {
  for (const stage of ["PREPARING_N400", "N400_FILED", "RECEIPT_RECEIVED", "BIOMETRICS_PENDING", "BIOMETRICS_COMPLETED", "INTERVIEW_PENDING"]) {
    for (const language of ["en", "es"]) {
      const brain = context({ language, caseProfile: { currentStage: stage }, immigrationProfile: { interviewDate: "2026-10-17", interviewTime: "08:30" } });
      const daily = plan(brain);
      assert.equal(brain.caseProfile.currentStage, stage);
      assert.equal(daily.caseStage, stage);
      assert.equal(daily.preparationStage, "INTERVIEW_SCHEDULED");
      assert.equal(daily.preparationConfidence, "ESTIMATED");
      assert.equal(daily.preparationSource, "CONFIRMED_INTERVIEW_DATE");
      assert.equal(daily.focus, "upcoming_interview");
      assert.equal(daily.daysUntilInterview, 12);
      assert.equal(daily.interviewTime, "08:30");
      assert.equal(daily.items[0].mode, "n400");
      assert.equal(brain.caseProfile.events, undefined);
    }
  }
});

test("a distant upcoming interview changes foundational preparation without implying imminent urgency", () => {
  const brain = context({ caseProfile: { currentStage: "N400_FILED" }, immigrationProfile: { interviewDate: "2026-11-17" } });
  const daily = plan(brain);
  assert.equal(brain.caseProfile.currentStage, "N400_FILED");
  assert.equal(daily.focus, "interview_preparation");
  assert.equal(daily.daysUntilInterview, 43);
  assert.equal(daily.items[0].mode, "n400");
});

test("upcoming interviews prioritize local weak practice and only recommend live mode when available", () => {
  const caseProfile = { currentStage: "INTERVIEW_SCHEDULED", interviewDate: "2026-10-17" };
  const weak = context({ caseProfile, learningProfile: { quizProgress: { 5: { attempts: 2, mastery: 0.1, lastCorrect: false } } } });
  const live = context({ caseProfile, preferences: { liveInterviewAvailable: true } });
  assert.equal(plan(weak).items[0].module, "quiz");
  assert.equal(plan(live).items[0].mode, "full");
});

test("interview countdown uses the user's calendar day near midnight in the United States", () => {
  const brain = context({ caseProfile: { currentStage: "N400_FILED", interviewDate: "2026-10-05" }, preferences: { timeZone: "America/Chicago" } });
  const evening = getDailyStudyPlan(brain, { now: "2026-10-06T02:00:00Z" });
  assert.equal(evening.daysUntilInterview, 0);
  assert.equal(evening.focus, "upcoming_interview");
  assert.equal(brain.caseProfile.currentStage, "N400_FILED");
});

test("a preserved interview date does not create interview urgency after the case stage changes", () => {
  for (const stage of ["INTERVIEW_COMPLETED", "OATH_SCHEDULED", "OATH_COMPLETED", "APPROVED", "ADDITIONAL_EVIDENCE", "CITIZEN"]) {
    const daily = plan(context({ caseProfile: { currentStage: stage, interviewDate: "2026-10-17" } }));
    assert.equal(daily.daysUntilInterview, null);
    assert.notEqual(daily.focus, "upcoming_interview");
    assert.equal(daily.preparationStage, stage);
  }
});

test("a past Profile interview date cannot promote an earlier case stage to an upcoming interview", () => {
  const brain = context({ caseProfile: { currentStage: "PREPARING_N400" }, immigrationProfile: { interviewDate: "2026-09-17" } });
  const daily = plan(brain);
  assert.equal(daily.daysUntilInterview, null);
  assert.equal(daily.focus, "foundation");
  assert.equal(daily.preparationStage, "PREPARING_N400");
});

test("evidence and completed-oath journeys recommend their own next action", () => {
  const evidence = context({ language: "es", caseProfile: { currentStage: "ADDITIONAL_EVIDENCE" } });
  const citizen = context({ caseProfile: { currentStage: "CITIZEN" } });
  assert.equal(getNextAction(evidence, plan(evidence)).reason, "evidence_requested");
  assert.match(getNextAction(evidence, plan(evidence)).label, /evidencia/);
  assert.equal(getNextAction(citizen, plan(citizen)).module, "immigrationHelp");
});

test("the available study time is a real budget, including one-minute sessions", () => {
  for (const minutes of [1, 2, 3, 8, 30, 120]) {
    const daily = plan(context({ preferences: { availableStudyMinutes: minutes } }));
    assert.equal(daily.totalMinutes, minutes);
    assert.equal(daily.items.reduce((sum, item) => sum + item.minutes, 0), minutes);
    assert.ok(daily.items.every(item => Number.isInteger(item.minutes) && item.minutes > 0));
  }
  const today = plan(context({ caseProfile: { currentStage: "INTERVIEW_SCHEDULED", interviewDate: "2026-10-05", interviewTime: "15:00" } }));
  assert.equal(today.daysUntilInterview, 0);
  assert.equal(today.focus, "upcoming_interview");
});

test("the plan uses English performance and both interface languages", () => {
  const learningProfile = { practiceEvents: [
    { module: "reading", score: 95, at: Date.parse(NOW) },
    { module: "writing", score: 30, at: Date.parse(NOW) },
  ] };
  const english = plan(context({ learningProfile }));
  const spanish = plan(context({ language: "es", learningProfile }));
  assert.equal(english.items[2].module, "writing");
  assert.equal(spanish.items[2].module, "writing");
  assert.match(english.items[2].label, /English/);
  assert.match(spanish.items[2].label, /inglés/);
});

test("quiz sessions honor planned stable IDs, omit invalid answers, and fill adaptively", () => {
  const unavailable = questions.find(question => !question.acceptedAnswers.length);
  const session = createQuizSession(questions, {}, "choose", 4, Date.parse(NOW), [5, 2, 5, 999, unavailable.questionId]);
  assert.deepEqual(session.slice(0, 2).map(question => question.questionId), [5, 2]);
  assert.equal(new Set(session.map(question => question.questionId)).size, 4);
  assert.ok(session.every(question => question.acceptedAnswers.length));
});

test("a new error lowers memory even after perfect historical scores in a mode", () => {
  const storage = memoryStorage();
  const question = questions[0];
  let progress;
  for (let index = 0; index < 5; index += 1) progress = recordQuizAttempt({ question, mode: "recall", correct: true, answeredAt: NOW, storage });
  const before = progress[question.questionId].mastery;
  progress = recordQuizAttempt({ question, mode: "recall", correct: false, answeredAt: NOW, storage });
  const state = progress[question.questionId];
  assert.ok(state.mastery < before);
  assert.equal(state.recall, 100);
  assert.equal(state.lastCorrect, false);
  assert.equal(state.incorrect, 1);
  assert.equal(state.recentErrors, 1);
  assert.equal(state.consecutiveIndependentCorrect, 0);
  assert.ok(Date.parse(state.nextReviewAt) - Date.parse(NOW) < 86_400_000);
});

test("repeated assisted vocabulary practice cannot establish independent mastery", () => {
  const storage = memoryStorage();
  const question = questions[0];
  let progress;
  for (let index = 0; index < 20; index += 1) progress = recordQuizAttempt({ question, mode: "vocabulary", correct: true, helpUsed: ["vocabulary"], answeredAt: NOW, storage });
  assert.ok(progress[question.questionId].mastery <= 0.7);
  assert.equal(progress[question.questionId].consecutiveIndependentCorrect, 0);
  assert.equal(summarizeQuizProgress(progress).mastered, 0);
  assert.notEqual(context({ learningProfile: { quizProgress: progress } }).learningProfile.questionStates[0].status, "MASTERED");
});

test("N-400 skipped concepts guide review without storing answers or inventing truth scores", () => {
  const storage = memoryStorage();
  const skipped = n400Bank.questions[1].concept;
  const progress = recordN400Review({ skippedConceptIds: [skipped, "private answer text"], answer: "private answer text" }, "ana", storage);
  assert.deepEqual(progress.weakN400ConceptIds, [skipped]);
  assert.equal(JSON.stringify(getModuleProgress("ana", storage)).includes("private answer text"), false);
  assert.equal(getContinueStudying("ana", storage), null);
  assert.deepEqual(getN400LearningProgress("other", storage).weakN400ConceptIds, []);
  const brain = context({ caseProfile: { currentStage: "INTERVIEW_PENDING" }, learningProfile: { n400Progress: getN400LearningProgress("ana", storage) } });
  assert.equal(plan(brain).items[0].reason, "n400_review");
  const next = selectNextN400Question(n400Bank, createN400InterviewState(n400Bank, {}, brain));
  assert.equal(next.question.conceptId, skipped);
  assert.equal(brain.learningProfile.summary.interview.attempts, 0);
});

test("N-400 review metadata survives classic interview checkpoints and reviewed concepts leave the weak list", () => {
  const storage = memoryStorage();
  const conceptId = n400Bank.questions[0].concept;
  saveModuleProgress("interview", { completed: 2, total: 10, questionIndex: 2, questionIds: [1, 2, 3] }, "ana", storage);
  recordN400Review({ skippedConceptIds: [conceptId] }, "ana", storage);
  assert.equal(getModuleProgress("ana", storage).interview.questionIndex, 2);
  saveModuleProgress("interview", { completed: 3, total: 10, questionIndex: 3, questionIds: [1, 2, 3] }, "ana", storage);
  assert.deepEqual(getN400LearningProgress("ana", storage).skippedConceptIds, [conceptId]);
  const reviewed = recordN400Review({ reviewedConceptIds: [conceptId] }, "ana", storage);
  assert.deepEqual(reviewed.weakN400ConceptIds, []);
  assert.equal(reviewed.concepts[conceptId].reviews, 1);
  assert.equal(reviewed.concepts[conceptId].skips, 1);
  assert.equal(reviewed.concepts[conceptId].correct, undefined);
});
