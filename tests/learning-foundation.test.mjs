import test from "node:test";
import assert from "node:assert/strict";
import { LegacySpacedRepetitionEngine, SpacedRepetitionEngine } from "../src/learning.js";
import { createCivicProfile, normalizeZipCode } from "../src/civicProfile.js";

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
