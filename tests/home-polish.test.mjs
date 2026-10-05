import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildBrainContext, getDailyStudyPlan, getNextAction } from "../src/brain.js";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const home = app.slice(app.indexOf("function Home("), app.indexOf("function RealInterview("));

test("Home offers one dominant daily action and discloses the plan progressively", () => {
  assert.equal((home.match(/className="button-primary"/g) || []).length, 1);
  assert.match(home, /onClick=\{onContinue\}/);
  assert.match(home, /<details className="brain-plan-details"/);
  assert.doesNotMatch(home, /home-hero-video|ai-orb|home-practice-list/);
});

test("Home keeps the journey available without requiring USCIS credentials", () => {
  assert.match(home, /onNavigate\("uscisTracker"\)/);
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

test("Home progress and documents use recorded evidence", () => {
  assert.match(home, /practiceSummary\.civics\.viewed/);
  assert.match(home, /getJourneyChecklistProgress\(context\.caseProfile, context\.n400Profile, language\)/);
  assert.match(home, /documents\.completed/);
});

test("both languages offer the same primary action and supporting destinations", () => {
  assert.match(home, /Continuar/);
  assert.match(home, /Continue/);
  for (const text of ["Tu progreso", "Ver el plan de hoy", "Mi proceso", "What matters now"]) assert.ok(home.includes(text));
  const es = buildBrainContext({language: "es"});
  const en = buildBrainContext({language: "en"});
  assert.equal(getNextAction(es).module, getNextAction(en).module);
  assert.notEqual(getNextAction(es).label, getNextAction(en).label);
});

test("all interview and English tools remain accessible under Practice", () => {
  for (const id of ["interview-n400", "interview-civics", "reading", "writing", "podcasts"]) assert.ok(app.includes('id:"' + id + '"'));
  assert.match(app, /startInterview\("full"\)/);
  assert.match(app, /navigateTo\("coach"\)/);
});
