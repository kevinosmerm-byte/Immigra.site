import test from "node:test";
import assert from "node:assert/strict";
import { civicsQuestionBank, getCivicsQuestion } from "../src/civicsQuestionBank.js";
import { evaluateCivicsAnswer, normalizeCivicsAnswer } from "../src/civicsAnswerEvaluator.js";
import { currentDynamicAnswers, getDynamicCivicsAnswers, getNationalDynamicAnswers, getStateCivicsRecord, stateCivicsTable } from "../src/dynamicCivicsData.js";
import { locationResolutionForZip } from "../server/civicLocationService.js";

test("all 128 questions expose the shared evaluation schema", () => {
  assert.equal(civicsQuestionBank.length, 128);
  for (const question of civicsQuestionBank) {
    assert.deepEqual(Object.keys(question), ["questionId", "question", "questionSpanish", "acceptedAnswers", "aliases", "minimumAnswersRequired", "answerType", "isDynamic", "dynamicAnswerKey"]);
    assert.ok(Array.isArray(question.acceptedAnswers));
    assert.ok(Array.isArray(question.aliases));
  }
});

test("different official answers and a short correct answer are accepted locally", () => {
  const government = getCivicsQuestion(1);
  assert.equal(evaluateCivicsAnswer(government, "A republic").status, "correct");
  assert.equal(evaluateCivicsAnswer(government, "representative democracy").status, "correct");
  assert.equal(evaluateCivicsAnswer(getCivicsQuestion(2), "Constitution").status, "correct");
});

test("capitalization and punctuation do not affect evaluation", () => {
  assert.equal(normalizeCivicsAnswer("  THE Constitution!!! "), "the constitution");
  assert.equal(evaluateCivicsAnswer(getCivicsQuestion(2), "THE CONSTITUTION!").status, "correct");
});

test("minor speech transcription mistakes are tolerated", () => {
  assert.equal(evaluateCivicsAnswer(getCivicsQuestion(2), "the constatution").status, "correct");
  assert.equal(evaluateCivicsAnswer(getCivicsQuestion(108), "the U S S R").status, "correct");
});

test("multi-answer questions require distinct official answers", () => {
  const question = getCivicsQuestion(10);
  assert.equal(question.minimumAnswersRequired, 2);
  assert.equal(evaluateCivicsAnswer(question, "liberty").status, "incomplete");
  assert.equal(evaluateCivicsAnswer(question, "liberty and equality").status, "correct");
});

test("similar but conceptually incorrect answers are rejected", () => {
  assert.equal(evaluateCivicsAnswer(getCivicsQuestion(2), "the Articles of the Constitution").status, "incorrect");
  assert.equal(evaluateCivicsAnswer(getCivicsQuestion(9), "the Declaration of War").status, "incorrect");
});

test("stale dynamic answers are never presented as current", () => {
  const old = { answers: ["Former officeholder"], verifiedAt: "2025-01-01" };
  assert.deepEqual(currentDynamicAnswers(old, Date.parse("2026-09-23T00:00:00Z")), []);
  assert.equal(evaluateCivicsAnswer(getCivicsQuestion(38), "Former officeholder", []).status, "review");
});

test("recent USCIS national answers are available with accepted aliases", () => {
  assert.deepEqual(getNationalDynamicAnswers("president", Date.parse("2026-10-20T00:00:00Z")), ["Donald J. Trump", "Donald Trump", "Trump"]);
  assert.deepEqual(getNationalDynamicAnswers("speakerOfTheHouse", Date.parse("2026-10-20T00:00:00Z")), ["Mike Johnson", "Johnson", "James Michael Johnson"]);
});

test("confirmed civic profile supplies local answers without guessing", () => {
  const profile = { state: { capital: "Richmond" }, senators: ["Senator One", "Senator Two"], representative: "Representative Seven" };
  assert.deepEqual(getDynamicCivicsAnswers("stateCapital", profile), ["Richmond"]);
  assert.deepEqual(getDynamicCivicsAnswers("stateSenators", profile), ["Senator One", "Senator Two"]);
  assert.deepEqual(getDynamicCivicsAnswers("representative", profile), ["Representative Seven"]);
  assert.deepEqual(getDynamicCivicsAnswers("stateGovernor", profile), []);
});

test("all states have dated governor records from the maintained roster", () => {
  assert.equal(stateCivicsTable.length, 50);
  for (const record of stateCivicsTable) {
    assert.ok(record.governor);
    assert.equal(record.governorVerifiedAt, "2026-10-20");
    assert.equal(record.governorSourceUrl, "https://www.nga.org/governors/");
  }
  assert.equal(getStateCivicsRecord("va").governor, "Abigail Spanberger");
  assert.equal(getStateCivicsRecord("nj").governor, "Mikie Sherrill");
});

test("stale or undated governor data is never presented as current", () => {
  const now = Date.parse("2026-10-20T12:00:00Z");
  assert.deepEqual(getDynamicCivicsAnswers("stateGovernor", { governor: "Current Name", governorVerifiedAt: "2026-10-20" }, now), ["Current Name"]);
  assert.deepEqual(getDynamicCivicsAnswers("stateGovernor", { governor: "Old Name", governorVerifiedAt: "2026-01-01" }, now), []);
  assert.deepEqual(getDynamicCivicsAnswers("stateGovernor", { governor: "Unknown Date" }, now), []);
});

test("ambiguous ZIPs require an address or manual confirmation and never guess", () => {
  const result = locationResolutionForZip({ zipCode: "12345", districts: ["20", "21", "20"] });
  assert.equal(result.status, "ambiguous");
  assert.equal(result.district, null);
  assert.equal(result.requiresAddress, true);
  assert.equal(result.allowsManualConfirmation, true);
});
