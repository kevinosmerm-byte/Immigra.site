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
  const view = await readFile(new URL("../src/WritingPractice.jsx", import.meta.url), "utf8");
  assert.match(view, /evaluation.resultLabel/);
  assert.match(view, /Your answer/);
  assert.match(view, /Correct sentence/);
  assert.match(view, /onClick=\{onNext\}/);
  assert.match(app, /onNext=\{nextWritingSentence\}/);
  assert.match(app, /Semantic writing review unavailable; using deterministic review/);
  assert.doesNotMatch(app, /setTimeout\(\(\) => \{\s*nextWritingSentence\(\)/);
});

test("writing practice uses one unified compact panel without changing its actions", async () => {
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const view = await readFile(new URL("../src/WritingPractice.jsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../../../shared/design-system/writing-compact.css", import.meta.url), "utf8");
  assert.match(view, /className="writing-practice-panel"/);
  assert.match(view, /<progress value=\{index\+1\} max=\{total\}/);
  assert.match(app, /onCheck=\{checkWriting\}/);
  assert.match(app, /onNext=\{nextWritingSentence\}/);
  assert.doesNotMatch(app, /onClick=\{openCoachFrom\}/);
  assert.match(css, /@media\(max-width:767px\)/);
  assert.match(view, /readOnly=\{busy\}/);
  assert.match(app, /if \(writingCheckPending.current \|\| isAIThinking \|\| writingEvaluation\) return/);
  assert.equal((view.match(/onClick=\{onNext\}/g)||[]).length,1);
  assert.match(view, /evaluation.score==null\?'—':`\$\{evaluation.score\}%`/);
});

test('English writing feedback preserves scores and translates corrections',async()=>{
 const {localizeWritingResult}=await import('../src/writingEvaluator.js');
 const exact=evaluateWritingSentence({english:'Adams was President.'},'Adams was President.');
 const en=localizeWritingResult(exact,'en');assert.equal(en.feedback,'Correct!');assert.equal(en.score,100);assert.equal(en.resultLabel,'Correct');
 assert.deepEqual(localizeWritingResult(exact,'es'),exact);
});

test('dictation does not accept reversed words or removed negation',()=>{
 const reversed=evaluateWritingSentence({english:'Adams was President.'},'President was Adams.');
 assert.equal(reversed.accuracy,'Needs Practice');assert.match(reversed.feedback,/orden/);
 const negative=evaluateWritingSentence({english:'Citizens cannot vote here.'},'Citizens vote here.');
 assert.equal(negative.accuracy,'Needs Practice');assert.match(negative.feedback,/negación/);
});
