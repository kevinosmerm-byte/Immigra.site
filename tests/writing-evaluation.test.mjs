import test from "node:test";
import assert from "node:assert/strict";
import { writingSentences } from "../src/writingSentences.js";
import { evaluateWritingSentence, normalizeWritingText } from "../src/writingEvaluator.js";

const capital = writingSentences.find((item) => item.english === "Washington is the capital.");

test("writing sentences provide one canonical source with essential words", () => {
  assert.ok(writingSentences.length > 40);
  assert.deepEqual(capital.essentialWords, ["washington", "capital"]);
});

test("different capitalization is correct with an educational observation", () => {
  const result = evaluateWritingSentence(capital, "washington is the capital.");
  assert.equal(result.status, "correct_with_observations");
  assert.equal(result.accuracy, "Good");
  assert.match(result.feedback, /mayúscula/i);
});

test("a missing period is accepted with an observation", () => {
  const result = evaluateWritingSentence(capital, "Washington is the capital");
  assert.equal(result.status, "correct_with_observations");
  assert.match(result.feedback, /punto final/i);
});

test("repeated spaces and Unicode punctuation normalize safely", () => {
  assert.equal(normalizeWritingText("  Washington  is the capital… "), "washington is the capital");
  assert.notEqual(evaluateWritingSentence(capital, "Washington  is the capital.").status, "needs_practice");
});

test("a small spelling error remains passing and identifies the expected word", () => {
  const result = evaluateWritingSentence(capital, "Washinton is the capital.");
  assert.equal(result.status, "correct_with_observations");
  assert.match(result.feedback, /Washington/);
});

test("missing essential words needs practice", () => {
  assert.equal(evaluateWritingSentence(capital, "Washington is the").status, "needs_practice");
});

test("negations are critical and change the result", () => {
  const result = evaluateWritingSentence(capital, "Washington is not the capital.");
  assert.equal(result.status, "needs_practice");
  assert.match(result.feedback, /negación/i);
});

test("meaning changes and entirely different responses are rejected", () => {
  assert.equal(evaluateWritingSentence(capital, "Washington was the president.").status, "needs_practice");
  assert.equal(evaluateWritingSentence(capital, "Citizens can vote.").status, "needs_practice");
});

test("proper names cannot be replaced with another name", () => {
  assert.equal(evaluateWritingSentence(capital, "Lincoln is the capital.").status, "needs_practice");
});

test("the exact canonical sentence is fully correct", () => {
  const result = evaluateWritingSentence(capital, capital.english);
  assert.equal(result.status, "correct");
  assert.equal(result.accuracy, "Excellent");
  assert.equal(result.score, 100);
});
