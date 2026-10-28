import test from "node:test";
import assert from "node:assert/strict";
import { CASE_STAGES as SHARED_STAGES, sanitizeBrainProfile } from "../shared/brainProfile.js";
import {
  CASE_STAGES, formatJourneyDate, getJourneyChecklist, getJourneyChecklistProgress,
  getJourneyNextStep, getJourneySourceLabel, getJourneyStageLabel,
} from "../src/caseTracker.js";
import {
  confirmNoticeDraft, extractNoticeDraft, normalizeNoticeDate, normalizeNoticeTime,
  validateNoticeDraft,
} from "../src/noticeParser.js";
import {
  IMMIGRATION_RESOURCES, JOURNEY_HELP_CATEGORIES, getContextualHelpResources, getJourneyHelpCategory,
} from "../src/immigrationResources.js";

const text = `N-400 NATURALIZATION INTERVIEW APPOINTMENT NOTICE
Receipt Number: IOE1234567890
Notice Date: October 4, 2026
Appointment Date: Tuesday, December 15, 2026
Appointment Time: 8:30 AM
Field Office: Houston Field Office
Appointment Location: USCIS Houston office`;

test("selectable notice text produces an editable structured draft without storing sensitive raw content", () => {
  const draft = extractNoticeDraft(`${text}\nA-Number: A123456789\nPrivate text that must never persist`);
  assert.equal(draft.noticeType, "INTERVIEW");
  assert.equal(draft.noticeDate, "2026-10-04");
  assert.equal(draft.appointmentDate, "2026-12-15");
  assert.equal(draft.appointmentTime, "08:30");
  assert.equal(draft.receiptNumber, "IOE1234567890");
  assert.equal(draft.fieldOffice, "Houston Field Office");
  assert.equal(draft.location, "USCIS Houston office");
  assert.equal(draft.warning, "");
  assert.deepEqual(validateNoticeDraft(draft), {});
  assert.equal(JSON.stringify(draft).includes("A123456789"), false);
});

test("dates need a real calendar date and a year; times preserve noon and midnight", () => {
  assert.equal(normalizeNoticeDate("December 15"), "");
  assert.equal(normalizeNoticeDate("02/29/2025"), "");
  assert.equal(normalizeNoticeDate("02/29/2024"), "2024-02-29");
  assert.equal(normalizeNoticeDate("15 de diciembre de 2026"), "2026-12-15");
  assert.equal(normalizeNoticeDate("2026-13-12"), "");
  assert.equal(normalizeNoticeTime("12:05 AM"), "00:05");
  assert.equal(normalizeNoticeTime("12:05 PM"), "12:05");
  assert.equal(normalizeNoticeTime("8:30 p.m."), "20:30");
  assert.equal(normalizeNoticeTime("25:00"), "");
  assert.equal(formatJourneyDate("2026-02-30"), "");
  assert.match(formatJourneyDate("2026-12-15", "en"), /December 15, 2026/);
  assert.match(formatJourneyDate("2026-12-15", "es"), /15/);
});

test("notice confirmation is mandatory and only confirmed fields reach the existing Brain profile", () => {
  const draft = { ...extractNoticeDraft(text), rawText: "private body", aNumber: "A123456789", uploadedFile: "bytes" };
  const existing = { currentStage: "INTERVIEW_PENDING", events: [{ id: "old", eventType: "N400_FILED", eventDate: "2026-04-01" }], notices: [] };
  const snapshot = JSON.stringify(existing);
  assert.throws(() => confirmNoticeDraft(draft, existing), /confirmation is required/);
  assert.throws(() => confirmNoticeDraft(draft, existing, { confirmed: "yes" }), /confirmation is required/);
  const patch = confirmNoticeDraft(draft, existing, { confirmed: true, now: "2026-10-05T12:00:00.000Z" });
  assert.equal(JSON.stringify(existing), snapshot);
  assert.equal(patch.currentStage, "INTERVIEW_SCHEDULED");
  assert.equal(patch.interviewDate, "2026-12-15");
  assert.equal(patch.interviewTime, "08:30");
  assert.equal(patch.source, "USCIS_NOTICE");
  assert.equal(patch.confidence, "USER_CONFIRMED");
  assert.equal(patch.events.length, 2);
  assert.equal(patch.events[1].eventDate, "2026-10-04");
  assert.equal(patch.notices[0].confirmedAt, "2026-10-05T12:00:00.000Z");
  assert.equal(patch.notices[0].receiptNumber, undefined);
  const persisted = sanitizeBrainProfile({ caseProfile: patch }).caseProfile;
  assert.equal(persisted.receiptNumber, "IOE1234567890");
  assert.equal(persisted.notices[0].appointmentTime, "08:30");
  for (const privateText of ["private body", "A123456789", "bytes"]) assert.equal(JSON.stringify(persisted).includes(privateText), false);
});

test("a future appointment is not recorded as an already occurred event when notice date is absent", () => {
  const patch = confirmNoticeDraft({ noticeType: "INTERVIEW", appointmentDate: "2026-12-15" }, {}, { confirmed: true, now: "2026-10-05T12:00:00.000Z" });
  assert.equal(patch.interviewDate, "2026-12-15");
  assert.equal(patch.events[0].eventDate, "2026-10-05");
  assert.equal(patch.lastConfirmedStatusDate, "2026-10-05");
});

test("RFE and oath notices support branches and reject another form or invalid edited facts", () => {
  const draft = extractNoticeDraft("N-400 Request for Additional Evidence\nNotice Date: 10/02/2026\nResponse Due Date: 11/15/2026");
  assert.equal(draft.noticeType, "ADDITIONAL_EVIDENCE");
  assert.equal(draft.deadline, "2026-11-15");
  const patch = confirmNoticeDraft(draft, { currentStage: "INTERVIEW_COMPLETED" }, { confirmed: true });
  assert.equal(patch.currentStage, "ADDITIONAL_EVIDENCE");
  assert.equal(patch.evidenceDeadline, "2026-11-15");
  assert.equal(getJourneyNextStep(patch).nextLikelyStage, null);
  assert.equal(extractNoticeDraft("N-445 Notice of Naturalization Oath Ceremony\nCeremony Date: 12/15/2026").noticeType, "OATH");
  const other = extractNoticeDraft("I-485 Interview Appointment Notice\nAppointment Date: 12/15/2026");
  assert.equal(other.warning, "OTHER_FORM");
  assert.throws(() => confirmNoticeDraft(other, {}, { confirmed: true }), /Review/);
  assert.deepEqual(validateNoticeDraft({ noticeType: "INTERVIEW", appointmentDate: "2026-02-30", appointmentTime: "28:00", receiptNumber: "invalid" }), { appointmentDate: "DATE", appointmentTime: "TIME", receiptNumber: "RECEIPT" });
  assert.equal(extractNoticeDraft("Plain document. December 15, 2026. 8:30 AM.").appointmentDate, "");
});

test("journey stage definitions are shared and next steps explicitly remain estimated", () => {
  assert.equal(CASE_STAGES, SHARED_STAGES);
  for (const stage of CASE_STAGES) {
    assert.ok(getJourneyStageLabel(stage, "en"));
    assert.ok(getJourneyStageLabel(stage, "es"));
    assert.equal(getJourneyNextStep({ currentStage: stage }).confidence, "ESTIMATED");
  }
  assert.equal(getJourneyNextStep({ currentStage: "INTERVIEW_SCHEDULED" }).studyFocus, "focused_interview");
  assert.equal(getJourneyNextStep({ currentStage: "OATH_SCHEDULED" }).studyFocus, "oath");
  assert.equal(getJourneyNextStep({ currentStage: "CITIZEN" }).nextLikelyStage, null);
  assert.equal(getJourneySourceLabel("USCIS_NOTICE", "USER_CONFIRMED"), "USCIS notice · confirmed by you");
  assert.equal(getJourneySourceLabel("USCIS_NOTICE", "UNVERIFIED"), "Unverified");
  assert.equal(getJourneySourceLabel("OFFICIAL_USCIS", "UNVERIFIED"), "Unverified");
});

test("checklists include only preparation suggestions and explicit personal circumstances", () => {
  const caseProfile = { currentStage: "INTERVIEW_SCHEDULED", checklistCompletedIds: ["interview_notice", "passports", "unused_item"] };
  const base = getJourneyChecklist(caseProfile, {}, "en");
  assert.equal(base.length, 4);
  assert.equal(base.some(item => item.id === "marriage_documents"), false);
  assert.ok(base.every(item => item.preparationSuggestion && item.verifiedAt === null && item.sourceUrl.startsWith("https://www.uscis.gov/")));
  const personalized = getJourneyChecklist(caseProfile, { flags: { married: true, has_travel: true, previously_married: false, name_changed: false } });
  assert.ok(personalized.some(item => item.id === "marriage_documents"));
  assert.ok(personalized.some(item => item.id === "travel_records"));
  assert.equal(personalized.some(item => item.id === "prior_marriage_documents"), false);
  const progress = getJourneyChecklistProgress(caseProfile, {});
  assert.equal(progress.completed, 2);
  assert.equal(progress.total, 4);
  assert.equal(getJourneyChecklist({ currentStage: "OATH_SCHEDULED" }, { flags: { married: true } }).some(item => item.id === "marriage_documents"), false);
  const evidence = getJourneyChecklist({ currentStage: "ADDITIONAL_EVIDENCE" });
  assert.ok(evidence.every(item => item.id.startsWith("evidence_")));
  assert.notEqual(getJourneyChecklist(caseProfile, {}, "es")[0].label, base[0].label);
});

test("help reuses the resource directory with eight journey categories and stage-relevant order", () => {
  assert.equal(JOURNEY_HELP_CATEGORIES.length, 8);
  assert.equal(getJourneyHelpCategory("INTERVIEW_SCHEDULED"), "interview-day");
  assert.equal(getJourneyHelpCategory("OATH_SCHEDULED"), "oath");
  assert.equal(getJourneyHelpCategory("CITIZEN"), "after-naturalization");
  assert.equal(getContextualHelpResources("OATH_SCHEDULED")[0].id, "naturalization-ceremony");
  assert.equal(getContextualHelpResources("CITIZEN", "es")[0].title, "Información para Nuevos Ciudadanos");
  assert.equal(IMMIGRATION_RESOURCES.find(item => item.id === "naturalization-ceremony").last_verified, null);
  assert.equal(new Set(IMMIGRATION_RESOURCES.map(item => item.id)).size, IMMIGRATION_RESOURCES.length);
  assert.ok(IMMIGRATION_RESOURCES.some(item => item.id === "detainee"));
});

test("historical notices append to the journey without regressing the current stage or overwriting a newer appointment", () => {
  const existing = { currentStage: "INTERVIEW_SCHEDULED", interviewDate: "2026-12-15", interviewTime: "08:30", source: "USER_CONFIRMED", confidence: "USER_CONFIRMED", lastConfirmedStatusDate: "2026-10-04", notices: [], events: [] };
  const oldReceipt = confirmNoticeDraft({ noticeType: "RECEIPT", noticeDate: "2026-04-01" }, existing, { confirmed: true });
  assert.equal(oldReceipt.currentStage, undefined);
  assert.equal(oldReceipt.source, undefined);
  assert.equal(oldReceipt.notices.length, 1);
  const oldInterview = confirmNoticeDraft({ noticeType: "INTERVIEW", noticeDate: "2026-08-01", appointmentDate: "2026-09-15", appointmentTime: "09:00" }, existing, { confirmed: true });
  assert.equal(oldInterview.interviewDate, undefined);
  assert.equal(oldInterview.interviewTime, undefined);
  const rescheduled = confirmNoticeDraft({ noticeType: "INTERVIEW", noticeDate: "2026-10-05", appointmentDate: "2027-01-15" }, existing, { confirmed: true });
  assert.equal(rescheduled.currentStage, "INTERVIEW_SCHEDULED");
  assert.equal(rescheduled.interviewDate, "2027-01-15");
});

test("a notice for a different receipt cannot silently replace the user's current case", () => {
  const existing = { receiptNumber: "IOE1234567890", currentStage: "INTERVIEW_PENDING" };
  const draft = { noticeType: "INTERVIEW", receiptNumber: "IOE0000000001" };
  assert.equal(validateNoticeDraft(draft, existing).receiptNumber, "RECEIPT_MISMATCH");
  assert.throws(() => confirmNoticeDraft(draft, existing, { confirmed: true }), /Review/);
});
