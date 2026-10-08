import test from "node:test";
import assert from "node:assert/strict";
import { civicsQuestionBank, getCivicsQuestion } from "../src/civicsQuestionBank.js";
import { evaluateCivicsAnswer, normalizeCivicsAnswer } from "../src/civicsAnswerEvaluator.js";
import { currentDynamicAnswers } from "../src/dynamicCivicsData.js";
import { locationResolutionForZip } from "../server/civicLocationService.js";

test("all 128 questions expose the shared evaluation schema", () => {
  assert.equal(civicsQuestionBank.length, 128);
  for (const question of civicsQuestionBank) {
    assert.deepEqual(Object.keys(question), ["questionId", "question", "questionSpanish", "acceptedAnswers", "aliases", "minimumAnswersRequired", "answerType", "isDynamic", "dynamicAnswerKey", "testVersion", "category", "officialSource", "lastVerified"]);
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

test("available dynamic records remain usable and missing records require review", () => {
  const old = { answers: ["Former officeholder"], verifiedAt: "2025-01-01" };
  assert.deepEqual(currentDynamicAnswers(old, Date.parse("2026-09-23T00:00:00Z")), ["Former officeholder"]);
  assert.equal(evaluateCivicsAnswer(getCivicsQuestion(38), "Former officeholder", []).status, "review");
});

test("ambiguous ZIPs require an address or manual confirmation and never guess", () => {
  const result = locationResolutionForZip({ zipCode: "12345", districts: ["20", "21", "20"] });
  assert.equal(result.status, "ambiguous");
  assert.equal(result.district, null);
  assert.equal(result.requiresAddress, true);
  assert.equal(result.allowsManualConfirmation, true);
});
