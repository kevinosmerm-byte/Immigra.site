import test from "node:test";
import assert from "node:assert/strict";
import { selectVoiceIndex, voiceProfileDefaults } from "../src/voiceProfiles.js";

test("selects clearly different named voices for Sarah and Kevin", () => {
  const voices = [
    { name: "Samantha", voiceURI: "com.apple.voice.samantha", lang: "en-US", localService: true },
    { name: "Daniel", voiceURI: "com.apple.voice.daniel", lang: "en-US", localService: true },
  ];

  assert.equal(selectVoiceIndex(voices, "female"), 0);
  assert.equal(selectVoiceIndex(voices, "male"), 1);
});

test("uses Android voice URIs when display names do not include gender", () => {
  const voices = [
    { name: "English United States", voiceURI: "en-us-x-tpf#female_1-local", lang: "en_US" },
    { name: "English United States", voiceURI: "en-us-x-sfg#male_1-local", lang: "en_US" },
  ];

  assert.equal(selectVoiceIndex(voices, "female"), 0);
  assert.equal(selectVoiceIndex(voices, "male"), 1);
});

test("keeps profiles distinct even when platform voice names are unknown", () => {
  const voices = [
    { name: "English Voice A", voiceURI: "voice-a", lang: "en-US" },
    { name: "English Voice B", voiceURI: "voice-b", lang: "en-US" },
  ];

  assert.notEqual(selectVoiceIndex(voices, "female"), selectVoiceIndex(voices, "male"));
});

test("preserves natural pitch and a clear near-normal pace for both profiles", () => {
  const sarah = voiceProfileDefaults("female");
  const kevin = voiceProfileDefaults("male");

  assert.equal(sarah.pitch, 1);
  assert.equal(kevin.pitch, 1);
  assert.ok(sarah.rate >= 0.95 && sarah.rate <= 1);
  assert.ok(kevin.rate >= 0.95 && kevin.rate <= 1);
});

test("prefers an enhanced male voice over its basic variant", () => {
  const voices = [
    { name: "Daniel", lang: "en-US", localService: true },
    { name: "Daniel Enhanced", lang: "en-US", localService: true },
    { name: "Samantha Premium", lang: "en-US", localService: true },
  ];
  assert.equal(selectVoiceIndex(voices, "male"), 1);
});
