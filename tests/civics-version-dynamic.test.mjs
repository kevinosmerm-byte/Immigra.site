import test from "node:test";
import assert from "node:assert/strict";
import { civicsQuestionBank, getCivicsQuestion } from "../src/civicsQuestionBank.js";
import { resolveCivicsQuestion, currentDynamicAnswers } from "../src/dynamicCivicsData.js";
import { evaluateCivicsAnswer } from "../src/civicsAnswerEvaluator.js";
import { createCivicProfile } from "../src/civicProfile.js";

const now = Date.parse("2026-09-30T12:00:00Z");
test("unknown exam versions cannot silently use another bank", () => {
  assert.equal(getCivicsQuestion(1, "unknown"), null);
  assert.equal(new Set(civicsQuestionBank.map(q => q.questionId)).size, civicsQuestionBank.length);
});
test("one official update changes display and grading without stale aliases", () => {
  const question = getCivicsQuestion(38);
  const resolved = resolveCivicsQuestion(question, { now, officials: { president: { answers: ["Sample Successor"], verifiedAt: "2026-09-30" } } });
  assert.deepEqual(resolved.acceptedAnswers, ["Sample Successor"]);
  assert.equal(evaluateCivicsAnswer(resolved, "Sample Successor").status, "correct");
  assert.notEqual(evaluateCivicsAnswer(resolved, "Donald Trump").status, "correct");
  assert.deepEqual(question.acceptedAnswers, []);
});
test("ISO verification dates work and expired data fails closed", () => {
  assert.deepEqual(currentDynamicAnswers({ answers: ["Example"], verifiedAt: "2026-09-30T10:00:00Z" }, now), ["Example"]);
  assert.deepEqual(currentDynamicAnswers({ answers: ["Example"], verifiedAt: "2025-01-01" }, now), []);
});
test("changing civic location changes answers and ambiguous districts never resolve", () => {
  const profile = createCivicProfile({ zipCode: "12345", districts: ["1"], state: { capital: "Sample Capital" }, officials: { representative: "Sample Member", verifiedAt: "2026-09-30" } });
  assert.deepEqual(resolveCivicsQuestion(getCivicsQuestion(29), { profile, now }).acceptedAnswers, ["Sample Member"]);
  profile.districtStatus = "ambiguous";
  assert.deepEqual(resolveCivicsQuestion(getCivicsQuestion(29), { profile, now }).acceptedAnswers, []);
  profile.state.capital = "Other Capital";
  assert.deepEqual(resolveCivicsQuestion(getCivicsQuestion(62), { profile, now }).acceptedAnswers, ["Other Capital"]);
});
test("governors resolve from one dated roster and expire independently of location", () => {
  const profile = { state: { code: "NJ" }, governor: "Old officeholder", verifiedAt: "2026-09-30" };
  const question = resolveCivicsQuestion(getCivicsQuestion(61), { profile, now });
  assert.equal(question.acceptedAnswers[0], "Mikie Sherrill");
  assert.equal(question.officialSource, "https://www.nga.org/governors/");
  assert.deepEqual(resolveCivicsQuestion(getCivicsQuestion(61), { profile, now: now + 32 * 86400000 }).acceptedAnswers, []);
});
