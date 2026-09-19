import test from "node:test";
import assert from "node:assert/strict";

import { getCaseGuidance, daysSinceOfficialDate, formatOfficialDate } from "../src/caseTracker.js";
import { getPracticeSummary, recordPracticeEvent, getPracticeEvents, clearPracticeEvents } from "../src/progress.js";

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

  assert.equal(summary.readiness, 85);
  assert.equal(summary.recommended.key, "writing");
  assert.equal(summary.reading.attempts, 1);
});

test("progress calculates a rounded readiness average", () => {
  const summary = getPracticeSummary([
    { module: "reading", score: 80, outcome: "completed", at: Date.now() },
    { module: "writing", score: 60, outcome: "completed", at: Date.now() },
    { module: "interview", score: 91, outcome: "completed", at: Date.now() },
  ], [1, 2, 3]);

  assert.equal(summary.readiness, 77);
  assert.equal(summary.civics.attempts, 3);
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
