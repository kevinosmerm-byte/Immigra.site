import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildBrainContext, getDailyStudyPlan, getNextAction } from "../src/brain.js";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const home = await readFile(new URL("../PlatformHome.jsx", import.meta.url), "utf8");

test("platform home preserves study destinations and daily plan without removed disclosures", () => {
  assert.doesNotMatch(home, /citizen-introduction|citizen-account-links/);
  assert.match(home, /citizen-activity-grid/);
  assert.match(home, /onClick=\{onContinue\}/);
  assert.match(home, /<details>/);
  assert.doesNotMatch(app, /import "\.\/ModernDesign\.css"/);
});

test("journey remains implemented after removing its home shortcut", () => {
  assert.doesNotMatch(home, /onNavigate\('uscisTracker'\)/);
  assert.match(app, /<CaseJourney/);
  assert.doesNotMatch(home, /home-uscis-disabled-button/);
});

test("daily action changes when confirmed journey reaches the oath", () => {
  const before = buildBrainContext({ language: "en", caseProfile: {currentStage: "N400_FILED"} });
  const after = buildBrainContext({ language: "en", caseProfile: {currentStage: "OATH_SCHEDULED"} });
  assert.equal(getNextAction(before, getDailyStudyPlan(before)).module, "quiz");
  assert.equal(getNextAction(after, getDailyStudyPlan(after)).module, "uscisTracker");
  assert.match(home, /nextAction\.label/);
});

test("profile and journey implementations and measured progress are preserved", () => {
  assert.match(home, /practiceSummary\?\.civics\?\.viewed/);
  assert.doesNotMatch(home, /onNavigate\('profile'\)/);
  assert.doesNotMatch(home, /onNavigate\('uscisTracker'\)/);
  assert.match(app, /<Profile/);
  assert.match(app, /useBrainProfile/);
});

test("both languages offer the same primary action and supporting destinations", () => {
  assert.match(home, /Continuar/);
  assert.match(home, /Continue/);
  for (const text of ["Mi progreso", "Tu plan de hoy", "Your plan today"]) assert.ok(home.includes(text));
  const es = buildBrainContext({language: "es"});
  const en = buildBrainContext({language: "en"});
  assert.equal(getNextAction(es).module, getNextAction(en).module);
  assert.notEqual(getNextAction(es).label, getNextAction(en).label);
});

test("all interview and English tools remain accessible under Practice", () => {
  for (const id of ["interview-n400", "interview-civics", "reading", "writing", "podcasts"]) assert.ok(app.includes('id:"' + id + '"'));
  assert.match(app, /startInterview\("full"\)/);
  assert.doesNotMatch(home, /onOpenFeature\('coach'\)/);
});
