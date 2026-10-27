import test from "node:test";
import assert from "node:assert/strict";
import { LegacySpacedRepetitionEngine, SpacedRepetitionEngine } from "../src/learning.js";
import { createCivicProfile, normalizeZipCode } from "../src/civicProfile.js";
import { createTsFsrsAdapter } from "../src/fsrsAdapter.js";
import { getCurrentMembers } from "../server/civicLocationService.js";
import { createConfiguredScheduler } from "../src/featureFlags.js";

test("FSRS shadow output never changes the legacy visible schedule", () => {
  let comparison;
  const engine = new SpacedRepetitionEngine({ shadowMode: true, fsrsAdapter: { schedule: () => ({ nextReviewAt: "2099-01-01T00:00:00Z" }) }, onShadowResult: (value) => { comparison = value; } });
  const previous = { questionId: "q1", mastery: .3, lapses: 0 };
  const attempt = { correct: true, answeredAt: "2026-09-23T00:00:00Z", helpUsed: [], mode: "text" };
  const visible = engine.schedule(previous, attempt);
  const legacy = new LegacySpacedRepetitionEngine().schedule(previous, attempt);
  assert.deepEqual(visible, legacy);
  assert.equal(comparison.fsrs.nextReviewAt, "2099-01-01T00:00:00Z");
});

test("ambiguous ZIP districts never produce a guessed representative", () => {
  const profile = createCivicProfile({ zipCode: "12345-6789", districts: ["NY-20", "NY-21"], officials: { representative: "Not safe to show" } });
  assert.equal(normalizeZipCode("12345-6789"), "12345");
  assert.equal(profile.districtStatus, "ambiguous");
  assert.equal(profile.district, null);
  assert.equal(profile.representative, null);
});

test("TS-FSRS adapter maps an independent answer to a stable persisted card", () => {
  let receivedRating;
  const fakeModule = {
    Rating: { Again: 1, Hard: 2, Good: 3, Easy: 4 },
    createEmptyCard: (date) => ({ due: date, state: 0 }),
    fsrs: () => ({ next: (card, date, rating) => {
      receivedRating = rating;
      return { card: { ...card, due: new Date(date.getTime() + 3 * 86_400_000), state: 2 }, log: { rating } };
    } }),
  };
  const adapter = createTsFsrsAdapter(fakeModule);
  const result = adapter.schedule({}, { correct: true, score: 85, answeredAt: "2026-10-20T12:00:00Z", helpUsed: [] });
  assert.equal(receivedRating, fakeModule.Rating.Good);
  assert.equal(result.intervalDays, 3);
  assert.equal(result.fsrsCard.state, 2);
});

test("FSRS failure falls back to legacy and is reported without breaking study", () => {
  let comparison;
  const engine = new SpacedRepetitionEngine({ fsrsAdapter: { schedule: () => { throw new Error("adapter unavailable"); } }, onShadowResult: (value) => { comparison = value; } });
  const result = engine.schedule({ questionId: 2 }, { correct: true, answeredAt: "2026-10-20T12:00:00Z", helpUsed: [] });
  assert.equal(result.scheduler, "legacy");
  assert.equal(comparison.error, "adapter unavailable");
});

test("Congress.gov member lookup separates senators from the confirmed district", async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({ members: [
    { name: "Senator One", terms: { item: [{ chamber: "Senate" }] } },
    { name: "Senator Two", terms: { item: [{ chamber: "Senate" }] } },
    { name: "Correct Representative", district: 7, terms: { item: [{ chamber: "House of Representatives" }] } },
    { name: "Other Representative", district: 8, terms: { item: [{ chamber: "House of Representatives" }] } },
  ] }) });
  const result = await getCurrentMembers("VA", "7", { fetchImpl, apiKey: "test-key", now: Date.parse("2026-10-20T00:00:00Z") });
  assert.deepEqual(result.senators, ["Senator One", "Senator Two"]);
  assert.equal(result.representative, "Correct Representative");
});

test("scheduler feature flags keep shadow invisible and allow explicit activation", () => {
  const adapter = { schedule: () => ({ nextReviewAt: "2026-12-01T00:00:00.000Z" }) };
  const previous = { questionId: 9 };
  const attempt = { correct: true, answeredAt: "2026-10-20T00:00:00.000Z", helpUsed: [] };
  const shadow = createConfiguredScheduler({ fsrsAdapter: adapter, flags: { tsFsrsShadow: true, tsFsrsActive: false } }).schedule(previous, attempt);
  const active = createConfiguredScheduler({ fsrsAdapter: adapter, flags: { tsFsrsShadow: false, tsFsrsActive: true } }).schedule(previous, attempt);
  assert.equal(shadow.scheduler, "legacy");
  assert.equal(active.scheduler, "ts-fsrs");
});
