import test from "node:test";
import assert from "node:assert/strict";

import { getCaseGuidance, daysSinceOfficialDate, formatOfficialDate } from "../src/caseTracker.js";
import { getPracticeSummary, recordPracticeEvent, getPracticeEvents, clearPracticeEvents } from "../src/progress.js";
import { buildDailyPlan, calculateReadiness, updateQuestionState } from "../src/learning.js";

function createLocalStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}

globalThis.localStorage = createLocalStorage();

test("practice events are stored locally and scores are clamped", () => {
  clearPracticeEvents();
  recordPracticeEvent({ module: "reading", score: 125, outcome: "completed" });
  recordPracticeEvent({ module: "writing", score: -20, outcome: "needs practice" });
  const events = getPracticeEvents();

  assert.equal(events.length, 2);
  assert.equal(events[0].score, 100);
  assert.equal(events[1].score, 0);
  assert.equal(events[0].module, "reading");
});

test("progress recommends an unmeasured module before repeating completed work", () => {
  const summary = getPracticeSummary([
    { module: "reading", score: 85, outcome: "completed", at: Date.now() },
  ], []);

  assert.ok(summary.readiness <= 49);
  assert.equal(summary.accuracy, 85);
  assert.equal(summary.confidence, "low");
  assert.equal(summary.recommended.key, "writing");
  assert.equal(summary.reading.attempts, 1);
});

test("progress separates accuracy from evidence-based readiness", () => {
  const summary = getPracticeSummary([
    { module: "reading", score: 80, outcome: "completed", at: Date.now() },
    { module: "writing", score: 60, outcome: "completed", at: Date.now() },
    { module: "interview", score: 91, outcome: "completed", at: Date.now() },
  ], [1, 2, 3]);

  assert.equal(summary.accuracy, 77);
  assert.ok(summary.readiness <= 49);
  assert.equal(summary.coverage, 75);
  assert.equal(summary.civics.attempts, 3);
});

test("a few correct answers cannot produce inflated readiness", () => {
  const attempts = [1, 2].map((index) => ({
    questionId: `q-${index}`,
    category: "government",
    correct: true,
    answeredAt: "2026-09-22T12:00:00.000Z",
    responseMs: 2000,
    helpUsed: [],
    mode: "spoken",
  }));
  const result = calculateReadiness(attempts, ["government", "history", "rights"]);

  assert.equal(result.accuracy, 100);
  assert.ok(result.readiness <= 49);
  assert.equal(result.confidence, "low");
});

test("question mastery grows with independent recall and due items come first", () => {
  const previous = {
    questionId: "q-1",
    category: "government",
    mastery: 0.4,
    consecutiveIndependentCorrect: 0,
    lapses: 0,
    nextReviewAt: "2026-09-22T10:00:00.000Z",
  };
  const attempt = {
    questionId: "q-1",
    category: "government",
    correct: true,
    answeredAt: "2026-09-22T12:00:00.000Z",
    responseMs: 2500,
    helpUsed: [],
    mode: "spoken",
  };
  const next = updateQuestionState(previous, attempt);
  const plan = buildDailyPlan([previous], "2026-09-22T12:00:00.000Z");

  assert.ok(next.mastery > previous.mastery);
  assert.equal(next.consecutiveIndependentCorrect, 1);
  assert.equal(plan[0].reason, "due");
});

test("case guidance never turns an official status into a legal prediction", () => {
  const rfe = getCaseGuidance("Request for Evidence Was Sent", "en");
  const denial = getCaseGuidance("Case Was Denied", "es");

  assert.match(rfe.next, /actual USCIS notice/i);
  assert.match(denial.next, /aviso oficial de USCIS/i);
  assert.doesNotMatch(rfe.explanation, /will be approved/i);
});

test("official dates handle invalid and future values safely", () => {
  assert.equal(daysSinceOfficialDate("not-a-date"), null);
  assert.equal(daysSinceOfficialDate("2999-01-01"), null);
  assert.equal(formatOfficialDate("not-a-date"), "");
  assert.match(formatOfficialDate("2026-09-19", "en"), /2026/);
});
