import test from "node:test";
import assert from "node:assert/strict";
import { createBrowserSpeech, selectVoice } from "../src/browserSpeech.js";

const female = { name: "Microsoft Zira", lang: "en-US" };
const male = { name: "Microsoft David", lang: "en-US" };
function setup(voices = [female, male], startWaitMs = 100) {
  const events = new EventTarget();
  const spoken = [];
  const synth = {
    voices, paused: false,
    getVoices() { return this.voices; },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    cancel() {},
    resume() { this.paused = false; },
    speak(utterance) { spoken.push(utterance); },
  };
  class Utterance { constructor(text) { this.text = text; } }
  return { synth, spoken, events, speech: createBrowserSpeech(synth, Utterance, 15, startWaitMs) };
}

test("Kevin selects a male English voice, including English outside the US", () => {
  assert.equal(selectVoice([female, male], "male", true), male);
  const daniel = { name: "Daniel", lang: "en-GB" };
  assert.equal(selectVoice([female, daniel], "male", true), daniel);
  assert.equal(selectVoice([{ name: "Female voice", lang: "en-US" }], "male", true), undefined);
  assert.equal(selectVoice([{ name: "Alexandra", lang: "en-US" }], "male", true), undefined);
});

test("Sarah waits for delayed voices and reports actual speech start and end", async () => {
  const { synth, events, speech, spoken } = setup([]);
  let starts = 0;
  let ends = 0;
  const result = speech.speak("Question", { onStart: () => starts++, onEnd: () => ends++ });
  assert.equal(spoken.length, 0);
  synth.voices = [female];
  events.dispatchEvent(new Event("voiceschanged"));
  assert.equal(spoken[0].voice, female);
  assert.equal(starts, 0);
  spoken[0].onstart();
  spoken[0].onend();
  assert.equal(await result, true);
  assert.equal(starts, 1);
  assert.equal(ends, 1);
});

test("ready voices speak synchronously within a user gesture", async () => {
  const { speech, spoken } = setup();
  const result = speech.speak("Question");
  assert.equal(spoken.length, 1);
  spoken[0].onend();
  assert.equal(await result, true);
});

test("Kevin never silently falls back to a female voice", async () => {
  const { speech, spoken } = setup([female]);
  let error;
  assert.equal(await speech.speak("Question", { profile: "male", requireProfile: true, onError: (value) => error = value }), false);
  assert.equal(error, "voice-unavailable");
  assert.equal(spoken.length, 0);
});

test("switching interviewer while voices load cancels the stale request", async () => {
  const { synth, events, speech, spoken } = setup([]);
  let oldEnds = 0;
  const first = speech.speak("Old question", { onEnd: () => oldEnds++ });
  const second = speech.speak("New question", { profile: "male", requireProfile: true });
  assert.equal(await first, false);
  synth.voices = [female, male];
  events.dispatchEvent(new Event("voiceschanged"));
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].text, "New question");
  assert.equal(spoken[0].voice, male);
  spoken[0].onend();
  assert.equal(await second, true);
  assert.equal(oldEnds, 0);
});

test("stop settles playback and ignores late callbacks", async () => {
  const { speech, spoken } = setup();
  let ends = 0;
  const result = speech.speak("Question", { onEnd: () => ends++ });
  speech.stop();
  spoken[0].onend();
  assert.equal(await result, false);
  assert.equal(ends, 0);
});

test("blocked playback ends with an actionable error", async () => {
  const { speech, spoken } = setup();
  let error;
  const result = speech.speak("Question", { onError: (value) => error = value });
  spoken[0].onerror({ error: "not-allowed" });
  assert.equal(await result, false);
  assert.equal(error, "not-allowed");
});

test("silent startup timeout clears the speaking state", async () => {
  const { speech } = setup([female], 5);
  let error;
  let ends = 0;
  assert.equal(await speech.speak("Question", { onError: (value) => error = value, onEnd: () => ends++ }), false);
  assert.equal(error, "not-allowed");
  assert.equal(ends, 1);
});

test("an empty voice list is retried on later playback", async () => {
  const { synth, speech, spoken } = setup([]);
  assert.equal(await speech.speak("Question", { profile: "male", requireProfile: true }), false);
  synth.voices = [male];
  const result = speech.speak("Retry", { profile: "male", requireProfile: true });
  assert.equal(spoken[0].voice, male);
  spoken[0].onend();
  assert.equal(await result, true);
});

test("missing browser speech support resolves with an error", async () => {
  let error;
  const speech = createBrowserSpeech(undefined, undefined);
  assert.equal(await speech.speak("Question", { onError: (value) => error = value }), false);
  assert.equal(error, "unsupported");
});
