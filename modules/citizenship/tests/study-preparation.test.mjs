import test from "node:test";
import assert from "node:assert/strict";
import { buildBrainContext, getDailyStudyPlan } from "../src/brain.js";
import { sanitizeBrainProfile, mergeBrainProfile } from "../shared/brainProfile.js";
import { safePreparationChecklists, studyGoal } from "../shared/studyPreparation.js";
import { readBrainProfile, saveBrainProfile } from "../src/brainProfileStorage.js";
import { EDUCATION_NOTICE, AUTHORIZED_HELP_URL } from "../src/educationNotice.js";
import { readAppRoute, appRouteHash } from "../src/appRoutes.js";
import { asksForLegalDecision } from "../shared/educationalScope.js";

test("asylum and adjustment plans do not prescribe N-400, civics or an English-only activity", () => {
  for (const goal of ["asylum", "adjustment"]) {
    for (const currentStage of ["PREPARING_N400", "APPROVED", "ADDITIONAL_EVIDENCE", "INTERVIEW_SCHEDULED"]) {
      const context = buildBrainContext({ preferences: { studyGoal: goal, availableStudyMinutes: 10 }, language: "es", caseProfile: { currentStage, interviewDate: "2026-10-15" } });
      const before = structuredClone(context);
      const plan = getDailyStudyPlan(context, { now: "2026-10-12T12:00:00Z" });
      assert.deepEqual(plan.items.map(item => item.module), ["coach", "immigrationHelp"]);
      assert.equal(plan.totalMinutes, 10);
      assert.equal(plan.items.reduce((sum, item) => sum + item.minutes, 0), 10);
      assert.equal(plan.daysUntilInterview, null);
      assert.equal(plan.caseStage, currentStage);
      assert.deepEqual(context, before);
      assert.doesNotMatch(plan.items.map(item => item.label).join(" "), /N-400|ciudadano|juramento/);
    }
  }
});

test("educational plans keep positive tasks within small and large study budgets", () => {
  for (const goal of ["citizenship", "asylum", "adjustment"]) {
    for (const minutes of [1, 2, 5, 8, 30, 120]) {
      const plan = getDailyStudyPlan(buildBrainContext({ preferences: { studyGoal: goal, availableStudyMinutes: minutes } }));
      assert.ok(plan.items.every(item => item.minutes > 0));
      assert.equal(plan.items.reduce((sum, item) => sum + item.minutes, 0), minutes);
    }
  }
});

test("citizenship retains the existing official-bank study plan", () => {
  const original = getDailyStudyPlan(buildBrainContext({}), { now: "2026-10-12T12:00:00Z" });
  const explicit = getDailyStudyPlan(buildBrainContext({ preferences: { studyGoal: "citizenship" } }), { now: "2026-10-12T12:00:00Z" });
  assert.deepEqual(explicit, original);
  assert.ok(original.items.some(item => item.module === "quiz"));
});

test("goal and fixed checklists survive profile updates without allowing case narratives", () => {
  const profile = sanitizeBrainProfile({
    preferences: {
      studyGoal: "asylum", availableStudyMinutes: 15,
      preparationChecklists: { asylum: ["official-source", "official-source", "private account number", "professional-questions"], adjustment: ["review-learning"], citizenship: [] },
      caseNarrative: "must never be stored",
    },
  });
  assert.equal(profile.preferences.studyGoal, "asylum");
  assert.deepEqual(profile.preferences.preparationChecklists.asylum, ["official-source", "professional-questions"]);
  assert.equal(profile.preferences.caseNarrative, undefined);
  const merged = mergeBrainProfile(profile, { preferences: { availableStudyMinutes: 5 } });
  assert.equal(merged.preferences.studyGoal, "asylum");
  assert.deepEqual(merged.preferences.preparationChecklists, profile.preferences.preparationChecklists);
});

test("goals are explicit choices and malformed values do not become case facts", () => {
  for (const value of [null, {}, [], "unknown", "__proto__", "constructor"]) assert.equal(studyGoal(value), "citizenship");
  assert.equal(sanitizeBrainProfile({ preferences: { studyGoal: "unknown" } }).preferences.studyGoal, undefined);
  assert.deepEqual(safePreparationChecklists({ asylum: "a private narrative", citizenship: [null, {}], other: ["official-source"] }), { citizenship: [], asylum: [], adjustment: [] });
});

test("checklists stay isolated by study goal and account; clearing does not invent progress", () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  saveBrainProfile({ preferences: { studyGoal: "asylum", preparationChecklists: { asylum: ["own-information"] } } }, "account-a", storage);
  assert.deepEqual(readBrainProfile("account-a", storage).preferences.preparationChecklists.asylum, ["own-information"]);
  assert.deepEqual(readBrainProfile("account-a", storage).preferences.preparationChecklists.adjustment, []);
  assert.equal(readBrainProfile("account-b", storage).preferences.preparationChecklists, undefined);
  assert.equal(readBrainProfile("guest", storage).preferences.studyGoal, undefined);
});

test("educational notices in both languages explicitly recommend professional help and deny legal representation", () => {
  assert.match(EDUCATION_NOTICE.en.short, /We are not lawyers/);
  assert.match(EDUCATION_NOTICE.en.full, /do not provide legal advice/);
  assert.match(EDUCATION_NOTICE.en.full, /always recommend/);
  assert.match(EDUCATION_NOTICE.en.full, /attorney-client/);
  assert.match(EDUCATION_NOTICE.es.short, /No somos abogados/);
  assert.match(EDUCATION_NOTICE.es.full, /No brindamos asesoría legal/);
  assert.match(EDUCATION_NOTICE.es.full, /Siempre recomendamos/);
  assert.match(EDUCATION_NOTICE.es.full, /abogado-cliente/);
  assert.equal(new URL(AUTHORIZED_HELP_URL).hostname, "www.uscis.gov");
});

test("the preparation guide is reachable through the existing route system", () => {
  assert.equal(readAppRoute("#preparation").screen, "preparation");
  assert.equal(appRouteHash("preparation"), "#preparation");
  assert.equal(readAppRoute("#privacy").screen, "settings");
});

test("clear requests for legal case decisions are referred, while study and vocabulary remain available", () => {
  for (const text of ["Am I eligible for asylum?", "Do I qualify for citizenship?", "What evidence should I submit?", "Should I appeal?", "¿Soy elegible para asilo?", "¿Qué formulario debo presentar?", "¿Cuál es mi fecha límite?", "¿Debo firmar esto?"]) assert.equal(asksForLegalDecision(text), true, text);
  for (const text of ["What does eligibility mean in English?", "Quiero practicar mis preguntas para un abogado.", "I live in Austin.", "Explain how to ask for a break."]) assert.equal(asksForLegalDecision(text), false, text);
});
