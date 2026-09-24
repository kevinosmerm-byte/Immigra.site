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

test("falls back to noticeably different speech characteristics", () => {
  const sarah = voiceProfileDefaults("female");
  const kevin = voiceProfileDefaults("male");

  assert.ok(sarah.pitch > kevin.pitch);
  assert.ok(sarah.rate > kevin.rate);
});
