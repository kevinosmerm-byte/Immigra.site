import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { sanitizeBrainProfile, mergeBrainProfile, diffBrainProfile } from "../shared/brainProfile.js";
import { clearBrainProfile, readBrainProfile, saveBrainProfile, isBrainProfileSessionOnly } from "../src/brainProfileStorage.js";
import { decryptProfileDomain, encryptProfileDomain, getBrainProfile, setBrainProfile, deleteBrainProfile, getBrainProfileConfiguration } from "../server/brainProfileService.js";
import { createBrainProfileStore } from "../src/brainProfileStore.js";
import { getN400ApplicantProfile, confirmN400ProfileAnswer } from "../src/n400InterviewEngine.js";

const key = randomBytes(32).toString("base64");
const fixture = {
  userProfile: { firstName: "Ana", streetAddress: "123 Example St", zipCode: "60601", dateOfBirth: "1990-02-03", aNumber: "do-not-store" },
  immigrationProfile: { receiptNumber: "IOE1234567890", interviewDate: "2026-12-15", interviewTime: "08:30", greenCardSince: "2020-02-29" },
  n400Profile: { answers: { P_ADDRESS_CURRENT: "123 Example St", P_ANUMBER: "do-not-store", "P_ANUMBER:follow-up:0": "do-not-store", injected: "do-not-store" }, flags: { married: true, has_travel: false }, travelHistory: [{ country: "Mexico", departureDate: "2026-01-01", returnDate: "2026-01-10", passportNumber: "do-not-store" }] },
  caseProfile: { currentStage: "INTERVIEW_SCHEDULED", source: "USER_CONFIRMED", notices: [{ id: "confirmed", noticeType: "INTERVIEW", confirmedAt: "2026-10-05T10:00:00Z", appointmentDate: "2026-12-15", appointmentTime: "08:30", rawText: "do-not-store", receiptNumber: "do-not-store" }, { id: "unconfirmed", noticeType: "OATH", rawText: "do-not-store" }], events: [{ id: "event-1", eventType: "INTERVIEW_SCHEDULED", title: "Interview scheduled", eventDate: "2026-10-05", source: "USER_CONFIRMED", confidence: "USER_CONFIRMED" }], checklistCompletedIds: ["notice", "notice", "../../bad"] },
  preferences: { availableStudyMinutes: 12, language: "es" },
};

test("profile allowlist retains confirmed facts, rejects unnecessary identifiers and unconfirmed notice content", () => {
  const safe = sanitizeBrainProfile(fixture);
  assert.equal(safe.userProfile.firstName, "Ana");
  assert.equal(safe.immigrationProfile.receiptNumber, "IOE1234567890");
  assert.equal(safe.n400Profile.flags.has_travel, false);
  assert.equal(safe.n400Profile.answers.P_ADDRESS_CURRENT, "123 Example St");
  assert.equal(safe.caseProfile.notices.length, 1);
  assert.equal(safe.caseProfile.notices[0].confidence, "USER_CONFIRMED");
  assert.deepEqual(safe.caseProfile.checklistCompletedIds, ["notice"]);
  assert.doesNotMatch(JSON.stringify(safe), /do-not-store|rawText|unconfirmed/);
  assert.equal(sanitizeBrainProfile({ userProfile: { dateOfBirth: "2026-02-30" }, immigrationProfile: { interviewTime: "25:00" } }).userProfile.dateOfBirth, undefined);
  assert.deepEqual(sanitizeBrainProfile().n400Profile.flags, {});
});

test("domain patches preserve other confirmed fields, can clear unknown flags, and replace arrays", () => {
  const next = mergeBrainProfile(fixture, { userProfile: { firstName: "Anita", streetAddress: "" }, n400Profile: { flags: { married: null }, travelHistory: [] }, caseProfile: { checklistCompletedIds: [] } });
  assert.equal(next.userProfile.firstName, "Anita");
  assert.equal(next.userProfile.streetAddress, undefined);
  assert.equal(next.immigrationProfile.interviewDate, "2026-12-15");
  assert.equal(next.n400Profile.flags.married, undefined);
  assert.equal(next.n400Profile.flags.has_travel, false);
  assert.deepEqual(next.n400Profile.travelHistory, []);
  assert.deepEqual(next.caseProfile.checklistCompletedIds, []);
});

test("on-device profiles stay account-scoped and clear without touching learning or another account", () => {
  const entries = new Map([["citizenshipai.quiz-progress.v1:alice", "study-progress"]]);
  const storage = { getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
  saveBrainProfile(fixture, "alice", storage);
  saveBrainProfile({ userProfile: { firstName: "Bob" } }, "bob", storage);
  assert.equal(readBrainProfile("alice", storage).userProfile.firstName, "Ana");
  assert.equal(readBrainProfile("bob", storage).userProfile.firstName, "Bob");
  assert.equal(readBrainProfile("guest", storage).userProfile.firstName, undefined);
  clearBrainProfile("alice", storage);
  assert.deepEqual(readBrainProfile("alice", storage).userProfile, {});
  assert.equal(readBrainProfile("bob", storage).userProfile.firstName, "Bob");
  assert.equal(entries.get("citizenshipai.quiz-progress.v1:alice"), "study-progress");
});

test("encrypted domains use fresh nonces and authenticate ciphertext, account and domain", () => {
  const safe = sanitizeBrainProfile(fixture);
  const envelope = encryptProfileDomain(safe.userProfile, "alice", "user", key);
  const another = encryptProfileDomain(safe.userProfile, "alice", "user", key);
  assert.notEqual(envelope.iv, another.iv);
  assert.doesNotMatch(JSON.stringify(envelope), /Ana|Example|60601/);
  assert.deepEqual(decryptProfileDomain(envelope, "alice", "user", key), safe.userProfile);
  assert.throws(() => decryptProfileDomain(envelope, "bob", "user", key), /could not be restored/);
  assert.throws(() => decryptProfileDomain(envelope, "alice", "n400", key), /could not be restored/);
  const damaged = { ...envelope, ciphertext: Buffer.from("modified").toString("base64") };
  assert.throws(() => decryptProfileDomain(damaged, "alice", "user", key), /could not be restored/);
  assert.throws(() => decryptProfileDomain(envelope, "alice", "user", randomBytes(32).toString("base64")), /could not be restored/);
});

test("missing or invalid encryption key blocks storage before any database call", async () => {
  const database = { rpc: () => assert.fail("No database call without encryption"), from: () => assert.fail("No database call without encryption") };
  assert.equal(getBrainProfileConfiguration("").available, false);
  assert.equal(getBrainProfileConfiguration("invalid").available, false);
  assert.equal(getBrainProfileConfiguration(key).available, true);
  await assert.rejects(setBrainProfile(database, "alice", fixture, ""), /unavailable/);
  await assert.rejects(getBrainProfile(database, "alice", ""), /unavailable/);
});

test("cloud save is one atomic encrypted-domain RPC and account-scoped reads decrypt all domains", async () => {
  const calls = [], rows = new Map();
  const updatedAt = "2026-10-05T10:00:00.000Z";
  const database = {
    rpc: async (name, parameters) => {
      calls.push([name, parameters]);
      if (name === "save_brain_profile") {
        for (const [domain, table] of Object.entries({ user: "user_profiles", immigration: "immigration_profiles", n400: "n400_profiles", case: "case_profiles" })) rows.set(table, { private_profile: parameters[`p_${domain}`], updated_at: updatedAt });
        return { data: updatedAt, error: null };
      }
      if (name === "delete_brain_profile") { rows.clear(); return { error: null }; }
      assert.fail("Unexpected RPC");
    },
    from: table => ({ select: () => ({ eq: (column, userId) => {
      assert.equal(column, "user_id"); assert.equal(userId, "alice");
      return { maybeSingle: async () => ({ data: rows.get(table) || null, error: null }) };
    } }) }),
  };
  const saved = await setBrainProfile(database, "alice", fixture, key);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "save_brain_profile");
  assert.equal(calls[0][1].p_user_id, "alice");
  assert.doesNotMatch(JSON.stringify(calls[0]), /Ana|Example|IOE123/);
  assert.deepEqual(await getBrainProfile(database, "alice", key), saved);
  assert.deepEqual(await deleteBrainProfile(database, "alice"), { deleted: true });
  assert.deepEqual(await getBrainProfile(database, "alice", key), { profile: null, updatedAt: null });
});

test("database failures return a content-free error instead of provider detail", async () => {
  const database = { rpc: async () => ({ error: { message: "private-address-failure" } }) };
  await assert.rejects(setBrainProfile(database, "alice", fixture, key), error => error.message === "Profile storage is temporarily unavailable." && !JSON.stringify(error).includes("private-address-failure"));
});

test("legacy journey appointments and immigration-only dates appear consistently without inventing a stage", () => {
  const legacy = sanitizeBrainProfile({ caseProfile: { currentStage: "INTERVIEW_SCHEDULED", interviewDate: "2026-12-15", interviewTime: "08:30", filingDate: "2026-01-01", fieldOffice: "Houston", receiptNumber: "IOE1234567890" } });
  assert.equal(legacy.immigrationProfile.interviewDate, "2026-12-15");
  assert.equal(legacy.immigrationProfile.interviewTime, "08:30");
  assert.equal(legacy.immigrationProfile.n400FilingDate, "2026-01-01");
  assert.equal(legacy.immigrationProfile.fieldOffice, "Houston");
  assert.equal(legacy.immigrationProfile.receiptNumber, "IOE1234567890");
  const immigrationOnly = sanitizeBrainProfile({ immigrationProfile: { oathDate: "2026-12-20", n400FilingDate: "2026-02-01" } });
  assert.equal(immigrationOnly.caseProfile.oathDate, "2026-12-20");
  assert.equal(immigrationOnly.caseProfile.filingDate, "2026-02-01");
  assert.equal(immigrationOnly.caseProfile.currentStage, undefined);
  const entries = new Map([["citizenshipai.brain-profile.v1:alice", JSON.stringify({ caseProfile: legacy.caseProfile })]]);
  assert.equal(readBrainProfile("alice", { getItem: key => entries.get(key) }).immigrationProfile.interviewDate, "2026-12-15");
});

test("explicit appointment edits and clears synchronize both directions while absent fields and stage remain unchanged", () => {
  let profile = sanitizeBrainProfile({ caseProfile: { currentStage: "OATH_SCHEDULED", interviewDate: "2026-11-01", interviewTime: "08:30", oathDate: "2026-12-01", filingDate: "2026-01-01", fieldOffice: "Houston", receiptNumber: "IOE1234567890" } });
  profile = mergeBrainProfile(profile, { immigrationProfile: { interviewDate: "2026-11-15", fieldOffice: "Austin", n400FilingDate: "2026-02-01" } });
  assert.equal(profile.caseProfile.interviewDate, "2026-11-15");
  assert.equal(profile.caseProfile.fieldOffice, "Austin");
  assert.equal(profile.caseProfile.filingDate, "2026-02-01");
  assert.equal(profile.immigrationProfile.filingDate, "2026-02-01");
  assert.equal(profile.caseProfile.interviewTime, "08:30");
  profile = mergeBrainProfile(profile, { caseProfile: { interviewTime: "09:15", oathDate: "2026-12-20" } });
  assert.equal(profile.immigrationProfile.interviewTime, "09:15");
  assert.equal(profile.immigrationProfile.oathDate, "2026-12-20");
  profile = mergeBrainProfile(profile, { immigrationProfile: { interviewDate: "", receiptNumber: null, filingDate: "" }, caseProfile: { oathDate: "" } });
  for (const key of ["interviewDate", "receiptNumber", "filingDate", "oathDate"]) { assert.equal(profile.immigrationProfile[key], undefined); assert.equal(profile.caseProfile[key], undefined); }
  assert.equal(profile.immigrationProfile.n400FilingDate, undefined);
  assert.equal(profile.caseProfile.currentStage, "OATH_SCHEDULED");
  assert.equal(profile.caseProfile.fieldOffice, "Austin");
});

test("profile form sends changed fields so its unchanged case copy does not revert an immigration edit", () => {
  const source = sanitizeBrainProfile({ caseProfile: { currentStage: "INTERVIEW_SCHEDULED", interviewDate: "2026-11-01" } });
  const draft = structuredClone(source);
  draft.immigrationProfile.interviewDate = "2026-11-15";
  const patch = diffBrainProfile(source, draft);
  assert.deepEqual(patch, { immigrationProfile: { interviewDate: "2026-11-15" } });
  const next = mergeBrainProfile(source, patch);
  assert.equal(next.caseProfile.interviewDate, "2026-11-15");
  assert.equal(next.immigrationProfile.interviewDate, "2026-11-15");
});

test("blocked device writes retain the session profile with truthful persistence status", () => {
  const blocked = { setItem: () => { throw new Error("Storage blocked"); } };
  const next = saveBrainProfile(fixture, "alice", blocked);
  assert.equal(next.userProfile.firstName, "Ana");
  assert.equal(isBrainProfileSessionOnly(next), true);
  const saved = saveBrainProfile(fixture, "alice", { setItem: () => {} });
  assert.equal(isBrainProfileSessionOnly(saved), false);
  assert.equal(Object.keys(next).includes("storageStatus"), false);
});

test("changed structured facts invalidate only corresponding old N-400 answers after a full snapshot merge", () => {
  const current = sanitizeBrainProfile({ userProfile: { firstName: "Ana", lastName: "Example", streetAddress: "Old address", city: "Houston", state: "TX", dateOfBirth: "1990-02-03" }, immigrationProfile: { greenCardSince: "2020-02-29" }, n400Profile: { answers: { P_ID_FULL_NAME: "Ana Example", P_ADDRESS_CURRENT: "Old address, Houston, TX", "P_ADDRESS_CURRENT:follow-up:0": "Old follow-up", P_ADDRESS_CITY_STATE: "Houston, TX", P_BIRTH_DATE: "February 3, 1990", P_LPR_DATE: "February 29, 2020", P_TRAVEL_ANY: "No", E_TAX_OVERDUE: "No" } } });
  const changed = mergeBrainProfile(current, { userProfile: { streetAddress: "New address", city: "Austin" }, n400Profile: structuredClone(current.n400Profile) });
  assert.equal(changed.n400Profile.answers.P_ADDRESS_CURRENT, undefined);
  assert.equal(changed.n400Profile.answers["P_ADDRESS_CURRENT:follow-up:0"], undefined);
  assert.equal(changed.n400Profile.answers.P_ADDRESS_CITY_STATE, undefined);
  assert.equal(changed.n400Profile.answers.P_ID_FULL_NAME, "Ana Example");
  assert.equal(changed.n400Profile.answers.P_BIRTH_DATE, "February 3, 1990");
  assert.equal(changed.n400Profile.answers.P_TRAVEL_ANY, "No");
  assert.equal(changed.n400Profile.answers.E_TAX_OVERDUE, "No");
  const unchanged = mergeBrainProfile(current, { userProfile: { ...current.userProfile, streetAddress: " Old address " }, immigrationProfile: { ...current.immigrationProfile } });
  assert.deepEqual(unchanged.n400Profile.answers, current.n400Profile.answers);
  const identityEdit = mergeBrainProfile(current, { userProfile: { lastName: "Newname", dateOfBirth: "" }, immigrationProfile: { greenCardSince: "2020-03-01" } });
  assert.equal(identityEdit.n400Profile.answers.P_ID_FULL_NAME, undefined);
  assert.equal(identityEdit.n400Profile.answers.P_BIRTH_DATE, undefined);
  assert.equal(identityEdit.n400Profile.answers.P_LPR_DATE, undefined);
  assert.equal(identityEdit.n400Profile.answers.P_ADDRESS_CURRENT, "Old address, Houston, TX");
});

test("clearing device data wipes inactive account snapshots and invalidates pending restore requests", () => {
  const cache = createBrainProfileStore(user => sanitizeBrainProfile({ userProfile: { firstName: user }, immigrationProfile: { receiptNumber: "IOE1234567890" } }));
  const alice = cache.get("alice"), bob = cache.get("bob");
  cache.publish(alice, { profile: saveBrainProfile({ userProfile: { firstName: "Alice session-only" } }, "alice", { setItem: () => { throw new Error("blocked"); } }) });
  assert.equal(cache.get("alice").snapshot.profile.userProfile.firstName, "Alice session-only");
  let activeNotifications = 0;
  bob.listeners.add(() => { activeNotifications += 1; });
  const pendingRestore = alice.requestId;
  const oldRevision = bob.revision;
  cache.clearAll();
  assert.equal(activeNotifications, 1);
  assert.deepEqual(cache.get("alice").snapshot.profile.userProfile, {});
  assert.deepEqual(cache.get("alice").snapshot.profile.immigrationProfile, {});
  assert.deepEqual(cache.get("bob").snapshot.profile.userProfile, {});
  assert.ok(alice.requestId > pendingRestore);
  assert.ok(bob.revision > oldRevision);
  assert.doesNotMatch(JSON.stringify([alice.snapshot, bob.snapshot]), /Alice|alice|bob|IOE123/);
});

test("an explicit changed N-400 flag removes the corresponding old answer instead of allowing it to override the flag", () => {
  const current = sanitizeBrainProfile({ n400Profile: { flags: { has_travel: true, married: true }, answers: { P_TRAVEL_ANY: "Yes", "P_TRAVEL_ANY:follow-up:0": "A previous trip", P_MARITAL_STATUS: "Married", P_EMPLOYMENT_CURRENT: "Example employer" } } });
  const unchanged = mergeBrainProfile(current, { n400Profile: { flags: { ...current.n400Profile.flags } } });
  assert.deepEqual(unchanged.n400Profile.answers, current.n400Profile.answers);
  const changed = mergeBrainProfile(current, { n400Profile: { flags: { has_travel: false }, answers: { ...current.n400Profile.answers } } });
  assert.equal(changed.n400Profile.answers.P_TRAVEL_ANY, undefined);
  assert.equal(changed.n400Profile.answers["P_TRAVEL_ANY:follow-up:0"], undefined);
  assert.equal(changed.n400Profile.answers.P_MARITAL_STATUS, "Married");
  assert.equal(changed.n400Profile.answers.P_EMPLOYMENT_CURRENT, "Example employer");
  assert.equal(getN400ApplicantProfile(changed).has_travel, false);
  const cleared = mergeBrainProfile(current, { n400Profile: { flags: { has_travel: null } } });
  assert.equal(cleared.n400Profile.flags.has_travel, undefined);
  assert.equal(cleared.n400Profile.answers.P_TRAVEL_ANY, undefined);
});

test("updated histories replace only corresponding old saved answers and reuse the new structured context", () => {
  const current = sanitizeBrainProfile({ n400Profile: {
    travelHistory: [{ country: "Canada", departureDate: "2025-01-01", returnDate: "2025-01-10" }],
    residenceHistory: [{ address: "Old residence", city: "Houston", state: "TX", fromDate: "2020-01-01", toDate: "2023-01-01" }],
    employmentHistory: [{ employer: "Old employer", occupation: "Old occupation", fromDate: "2020-01-01" }],
    answers: { P_TRAVEL_LAST: "2025-01-01", P_TRAVEL_DEST: "Canada", P_TRAVEL_LENGTH: "Nine days", P_TRAVEL_MORE: "Old trips", P_ADDRESS_PREVIOUS: "Old residence", P_ADDRESS_HISTORY_MORE: "Old history", P_EMPLOYMENT_CURRENT: "Old employer", P_EMPLOYMENT_OCCUPATION: "Old occupation", P_EMPLOYMENT_PREVIOUS: "Older employer", P_BIRTH_DATE: "January 1, 1990", E_TAX_OVERDUE: "No" },
  } });
  const same = mergeBrainProfile(current, { n400Profile: { travelHistory: structuredClone(current.n400Profile.travelHistory), residenceHistory: structuredClone(current.n400Profile.residenceHistory), employmentHistory: structuredClone(current.n400Profile.employmentHistory) } });
  assert.deepEqual(same.n400Profile.answers, current.n400Profile.answers);
  const travelEdited = mergeBrainProfile(current, { n400Profile: { travelHistory: [{ country: "Mexico", departureDate: "2026-02-01", returnDate: "2026-02-08" }] } });
  assert.equal(travelEdited.n400Profile.answers.P_TRAVEL_LAST, undefined);
  assert.equal(travelEdited.n400Profile.answers.P_TRAVEL_LENGTH, undefined);
  assert.equal(travelEdited.n400Profile.answers.P_ADDRESS_PREVIOUS, "Old residence");
  assert.equal(getN400ApplicantProfile(travelEdited).answers.P_TRAVEL_LAST, "2026-02-01");
  assert.equal(getN400ApplicantProfile(travelEdited).answers.P_TRAVEL_DEST, "Mexico");
  const edited = mergeBrainProfile(travelEdited, { n400Profile: {
    residenceHistory: [{ address: "New previous residence", city: "Austin", state: "TX", fromDate: "2023-01-01", toDate: "2025-01-01" }],
    employmentHistory: [{ employer: "New employer", occupation: "Teacher", fromDate: "2025-01-01" }],
  } });
  assert.equal(edited.n400Profile.answers.P_ADDRESS_PREVIOUS, undefined);
  assert.equal(edited.n400Profile.answers.P_EMPLOYMENT_CURRENT, undefined);
  assert.equal(edited.n400Profile.answers.P_EMPLOYMENT_PREVIOUS, undefined);
  assert.equal(edited.n400Profile.answers.P_BIRTH_DATE, "January 1, 1990");
  assert.equal(edited.n400Profile.answers.E_TAX_OVERDUE, "No");
  const applicant = getN400ApplicantProfile(edited);
  assert.equal(applicant.answers.P_ADDRESS_PREVIOUS, "New previous residence, Austin, TX");
  assert.equal(applicant.answers.P_EMPLOYMENT_CURRENT, "New employer");
  assert.equal(applicant.answers.P_EMPLOYMENT_OCCUPATION, "Teacher");
});

test("historical name-change flag invalidates other-name history but preserves a separate future name-change request", () => {
  const current = sanitizeBrainProfile({ n400Profile: { flags: { name_changed: false }, answers: { P_ID_OTHER_NAMES: "No", P_ID_NAME_CHANGE: "Yes", P_BIRTH_DATE: "January 1, 1990" } } });
  const changed = mergeBrainProfile(current, { n400Profile: { flags: { name_changed: true } } });
  assert.equal(changed.n400Profile.answers.P_ID_OTHER_NAMES, undefined);
  assert.equal(changed.n400Profile.answers.P_ID_NAME_CHANGE, "Yes");
  assert.equal(changed.n400Profile.answers.P_BIRTH_DATE, "January 1, 1990");
});

test("Remember answer integrates confirmation, derived flags, merge and device persistence without dropping the newly confirmed answer", () => {
  const question = { id: "P_TRAVEL_ANY", answerType: "yes_no" };
  const empty = sanitizeBrainProfile();
  const confirmedYes = confirmN400ProfileAnswer(empty.n400Profile, question, "Yes");
  const first = mergeBrainProfile(empty, { n400Profile: confirmedYes });
  assert.equal(first.n400Profile.answers.P_TRAVEL_ANY, "Yes");
  assert.equal(first.n400Profile.flags.has_travel, true);
  const entries = new Map();
  const storage = { getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value) };
  saveBrainProfile(first, "alice", storage);
  const restored = readBrainProfile("alice", storage);
  assert.equal(getN400ApplicantProfile(restored).answers.P_TRAVEL_ANY, "Yes");
  const confirmedNo = confirmN400ProfileAnswer(restored.n400Profile, question, "No");
  const changed = mergeBrainProfile(restored, { n400Profile: confirmedNo });
  assert.equal(changed.n400Profile.answers.P_TRAVEL_ANY, "No");
  assert.equal(changed.n400Profile.flags.has_travel, false);
  assert.equal(getN400ApplicantProfile(changed).has_travel, false);
  const unchangedConfirmation = mergeBrainProfile(changed, { n400Profile: confirmN400ProfileAnswer(changed.n400Profile, question, "No") });
  assert.equal(unchangedConfirmation.n400Profile.answers.P_TRAVEL_ANY, "No");
  assert.equal(unchangedConfirmation.n400Profile.flags.has_travel, false);
});

test("remembered identity and military answers survive their own derived flag transitions while old copies still expire", () => {
  let current = sanitizeBrainProfile({ n400Profile: { answers: { E_TAX_OVERDUE: "No" } } });
  for (const [id, answerType, answer, flag, value] of [
    ["P_MARITAL_STATUS", "text", "Married", "married", true],
    ["P_CHILDREN_COUNT", "yes_no", "No", "has_children", false],
    ["E_MIL_SERVED", "yes_no", "Yes", "served_us_military", true],
  ]) {
    const confirmed = confirmN400ProfileAnswer(current.n400Profile, { id, answerType }, answer);
    current = mergeBrainProfile(current, { n400Profile: confirmed });
    assert.equal(current.n400Profile.answers[id], answer);
    assert.equal(current.n400Profile.flags[flag], value);
    assert.equal(current.n400Profile.answers.E_TAX_OVERDUE, "No");
  }
  const stale = mergeBrainProfile(current, { n400Profile: { answers: { ...current.n400Profile.answers }, flags: { served_us_military: false } } });
  assert.equal(stale.n400Profile.answers.E_MIL_SERVED, undefined);
  assert.equal(stale.n400Profile.flags.served_us_military, false);
  assert.equal(stale.n400Profile.answers.P_MARITAL_STATUS, "Married");
});
