import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  assert.deepEqual(result.details.corrections, [{ written: "washinton", expected: "washington" }]);
});

test("missing essential words needs practice", () => {
  const result = evaluateWritingSentence(capital, "Washington is the");
  assert.equal(result.status, "needs_practice");
  assert.deepEqual(result.details.missingWords, ["capital"]);
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

test("writing review stays visible until the learner chooses the next action", async () => {
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(app, /REVIEW YOUR ANSWER · REVISA TU RESPUESTA/);
  assert.match(app, /YOUR ANSWER · TU RESPUESTA/);
  assert.match(app, /CORRECT SENTENCE · ORACIÓN CORRECTA/);
  assert.match(app, /onClick=\{nextWritingSentence\}>\{t\("Next sentence/);
  assert.match(app, /Semantic writing review unavailable; using deterministic review/);
  assert.doesNotMatch(app, /setTimeout\(\(\) => \{\s*nextWritingSentence\(\)/);
});

test("writing practice uses one unified compact panel without changing its actions", async () => {
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/App.css", import.meta.url), "utf8");
  assert.match(app, /className="writing-practice-panel liquid-glass"/);
  assert.match(app, /className="writing-progress-strip"/);
  assert.match(app, /onClick=\{checkWriting\}/);
  assert.match(app, /onClick=\{nextWritingSentence\}/);
  assert.doesNotMatch(app, /onClick=\{openCoachFrom\}/);
  assert.match(css, /Writing Practice — unified, compact visual composition/);
  assert.match(css, /@media \(max-width: 700px\)/);
});
