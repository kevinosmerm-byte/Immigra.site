import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { confirmN400ProfileAnswer, createN400InterviewState, getN400ApplicantProfile, parseYesNo, recordN400Answer, selectNextN400Question } from "../src/n400InterviewEngine.js";
const bank = JSON.parse(await readFile(new URL("../src/data/n400InterviewBank.json", import.meta.url), "utf8"));
const find = id => bank.questions.find(question => question.id === id);

test("N-400 reuses supplied identity/address/history without inventing unknown branches", () => {
  const context = { userProfile: { firstName: "Ana", lastName: "Rivera", city: "Austin", state: "TX", streetAddress: "123 Example St", zipCode: "78701", dateOfBirth: "1990-01-20" }, immigrationProfile: { greenCardSince: "2020-01-01" }, n400Profile: { answers: { P_ID_FULL_NAME: "Ana R. Rivera", P_ANUMBER: "never persist" }, travelHistory: [{ country: "Mexico", departureDate: "2024-03-01", returnDate: "2024-03-10" }] } };
  const profile = getN400ApplicantProfile(context);
  assert.equal(profile.answers.P_ID_FULL_NAME, "Ana R. Rivera");
  assert.equal(profile.answers.P_ADDRESS_CURRENT, "123 Example St, Austin, TX, 78701");
  assert.equal(profile.answers.P_LPR_DATE, "2020-01-01");
  assert.equal(profile.answers.P_TRAVEL_DEST, "Mexico");
  assert.equal(profile.has_travel, true);
  assert.equal(profile.married, undefined);
  assert.equal(profile.answers.P_ANUMBER, undefined);
  assert.deepEqual(getN400ApplicantProfile({}), { answers: {} });
  assert.equal(getN400ApplicantProfile({ userProfile: { firstName: "Ana" } }).answers.P_ID_FULL_NAME, undefined);
  const selection = selectNextN400Question(bank, createN400InterviewState(bank, {}, context));
  assert.equal(selection.question.intent, "LEGAL_NAME");
  assert.equal(selection.question.knownAnswer, "Ana R. Rivera");
});

test("uncertainty in either language stays unknown and skips preserve existing answers", () => {
  for (const answer of ["I am not sure", "I don't know", "No sé", "No estoy segura", "Maybe", "Quizás sí", "No recuerdo", "I am thinking", "Yes, but no"]) assert.equal(parseYesNo(answer), null);
  assert.equal(parseYesNo("Sí"), true);
  assert.equal(parseYesNo("Jamás"), false);
  let state = createN400InterviewState(bank, {}, { n400Profile: { answers: { P_ADDRESS_CURRENT: "Existing supplied address" } } });
  state = recordN400Answer(state, find("P_ADDRESS_CURRENT"), "");
  assert.equal(state.applicantProfile.answers.P_ADDRESS_CURRENT, "Existing supplied address");
  state = recordN400Answer(state, find("P_MARITAL_STATUS"), "I am unsure");
  assert.equal(state.applicantProfile.married, undefined);
});

test("explicit travel status is preserved alongside supplied historical trips", () => {
  const profile = getN400ApplicantProfile({ n400Profile: { flags: { has_travel: false }, travelHistory: [{ country: "Mexico", departureDate: "2010-03-01", returnDate: "2010-03-10" }] } });
  assert.equal(profile.has_travel, false);
  assert.equal(profile.answers.P_TRAVEL_ANY, "No");
  assert.equal(profile.answers.P_TRAVEL_DEST, "Mexico");
});

test("confirmed saving is scoped to one answer and excludes private identifiers", () => {
  const original = { answers: { P_ID_FULL_NAME: "Ana Rivera" }, flags: { name_changed: true }, travelHistory: [{ country: "Mexico" }] };
  const confirmed = confirmN400ProfileAnswer(original, find("P_CHILDREN_COUNT"), "No");
  assert.equal(confirmed.flags.has_children, false);
  assert.equal(confirmed.flags.married, undefined);
  assert.equal(confirmed.flags.name_changed, true);
  assert.deepEqual(confirmed.travelHistory, original.travelHistory);
  assert.equal(original.answers.P_CHILDREN_COUNT, undefined);
  assert.equal(confirmN400ProfileAnswer(original, find("P_ANUMBER"), "123456789"), null);
  assert.equal(confirmN400ProfileAnswer(original, find("P_CHILDREN_COUNT"), "I don't know"), null);
});

test("weak-concept priority does not break N-400 block order", () => {
  const context = { caseProfile: { currentStage: "INTERVIEW_SCHEDULED" }, learningProfile: { weakN400ConceptIds: ["P_ID_OTHER_NAMES", "E_USC_CLAIM"] } };
  const selection = selectNextN400Question(bank, createN400InterviewState(bank, {}, context));
  assert.equal(selection.question.id, "P_ID_OTHER_NAMES");
  assert.equal(selection.state.currentBlock, "PERSONAL");
  assert.equal(selection.state.caseStage, "INTERVIEW_SCHEDULED");
});
