import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createN400InterviewState,
  getContextualN400FollowUps,
  parseYesNo,
  recordN400Answer,
  selectNextN400Question,
} from "../src/n400InterviewEngine.js";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/App.css", import.meta.url), "utf8");
const companion = await readFile(new URL("../src/companion.js", import.meta.url), "utf8");
const n400Component = await readFile(new URL("../src/N400InterviewPractice.jsx", import.meta.url), "utf8");
const bank = JSON.parse(await readFile(new URL("../src/data/n400InterviewBank.json", import.meta.url), "utf8"));

test("grouped practice keeps N-400 accessible through the existing interview destination", () => {
  assert.match(app, /interview-n400/);
  assert.match(app, /N-400/);
  assert.match(app, /id\.startsWith\("interview-"\) \? startInterview\(id\.slice\(10\)\)/);
  assert.match(app, /<N400InterviewPractice/);
  assert.doesNotMatch(app, /n400InterviewQuestions/);
  assert.match(app, /brainContext=\{brainContext\}/);
  assert.doesNotMatch(n400Component, /onSaveN400Profile|confirmN400ProfileAnswer|rememberResponse/);
  assert.match(n400Component, /recordN400Review/);
  assert.match(n400Component, /getN400LearningProgress/);
});

test("N-400 practice uses the versioned bank and can restart in place", () => {
  assert.equal(bank.formEdition, "01/20/25");
  assert.equal(bank.questions.length, 90);
  assert.match(n400Component, /INTERACTIVE N-400 PRACTICE/);
  assert.match(n400Component, /PRACTICE N-400 AGAIN/);
  assert.match(app, /key=\{`n400-\$\{interviewRunId\}`\}/);
  assert.match(n400Component, /score: null/);
  assert.doesNotMatch(n400Component, /apiJson|evaluateCivicsAnswer|correctAnswer/);
});

test("interviews keep the companion neutral without redundant header controls", () => {
  assert.match(app, /mode === "full"\) emitCompanionState\("idle", \{ duration: 0, silent: true \}\)/);
  assert.match(n400Component, /getCompanionVisibility,\s*setCompanionSessionVisibility/);
  assert.match(n400Component, /setCompanionSessionVisibility\(getCompanionVisibility\(\)\)/);
  assert.doesNotMatch(app, /Companion:|Hide for this interview|interview-companion-controls/);
  assert.doesNotMatch(n400Component, /Companion:|Hide for this interview|interview-companion-controls/);
  assert.match(companion, /data-silent/);
  assert.doesNotMatch(styles, /\.interview-companion-controls/);
  assert.match(companion, /querySelector\("\.figure"\)\.addEventListener\("click"/);
});

test("N-400 selection preserves block order and never repeats a concept", () => {
  let state = createN400InterviewState(bank);
  const seen = new Set();
  let eligibilityStarted = false;

  for (let step = 0; step < 120; step += 1) {
    const selection = selectNextN400Question(bank, state);
    state = selection.state;
    if (!selection.question) break;
    const question = selection.question;
    assert.equal(seen.has(question.conceptId), false, `repeated ${question.conceptId}`);
    if (question.block === "ELIGIBILITY") eligibilityStarted = true;
    if (eligibilityStarted) assert.equal(question.block, "ELIGIBILITY");
    seen.add(question.conceptId);

    let answer = question.answerType === "yes_no" ? "No" : "Practice response";
    if (["P_CHILDREN_COUNT", "P_TRAVEL_ANY", "E_GROUP_WEAPON_USE", "E_ARREST_CITE_DETAIN", "E_SELECTIVE_MALE_18_25", "E_MIL_SERVED"].includes(question.id)) answer = "Yes";
    if (question.id === "P_MARITAL_STATUS") answer = "Married";
    if (question.id === "E_CRIME_DISPOSITION") answer = "I received probation";
    state = recordN400Answer(state, question, answer);
  }

  assert.equal(state.complete, true);
  assert.ok(seen.size > 80);
  assert.equal(seen.size, state.askedConceptIDs.length);
  assert.equal(state.currentBlock, "ELIGIBILITY");
});

test("conditional branches and neutral follow-ups depend on the applicant response", () => {
  assert.equal(parseYesNo("No, never."), false);
  assert.equal(parseYesNo("Yes, I have."), true);
  assert.equal(parseYesNo("I am not sure"), null);
  assert.equal(parseYesNo("Maybe"), null);

  const arrest = bank.questions.find((question) => question.id === "E_ARREST_CITE_DETAIN");
  assert.deepEqual(getContextualN400FollowUps(arrest, "No"), []);
  assert.ok(getContextualN400FollowUps(arrest, "Yes").length > 0);

  let state = createN400InterviewState(bank);
  while (!state.complete) {
    const selection = selectNextN400Question(bank, state);
    state = selection.state;
    if (!selection.question) break;
    const question = selection.question;
    const answer = question.id === "P_MARITAL_STATUS" ? "Married" : question.answerType === "yes_no" ? "No" : "Practice response";
    state = recordN400Answer(state, question, answer);
    if (question.id === "P_MARITAL_STATUS") {
      const next = selectNextN400Question(bank, state);
      assert.equal(next.question.id, "P_SPOUSE_NAME");
      break;
    }
  }
});
