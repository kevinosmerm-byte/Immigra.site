import test from "node:test";
import assert from "node:assert/strict";
import { CONTINUOUS_VOICE_LIMITS, createContinuousTurn, encodeVoiceWav } from "../src/continuousTurn.js";
import { conversationCorrection, conversationIntent } from "../src/conversationFlow.js";

function fixture(options = {}) {
  const events = [];
  const turn = createContinuousTurn({ sampleRate: 16000, ...options });
  const feed = (ms, volume = 0, playing = false) => {
    for (let i = 0; i < ms / 50; i++) events.push(...turn.push(new Float32Array(800).fill(volume), playing));
  };
  return { events, turn, feed };
}

test("continuous capture ignores silence and clicks, then closes an idle microphone without a turn", () => {
  const f = fixture();
  f.feed(1000); f.feed(50, .1); f.feed(58950);
  assert.deepEqual(f.events, [{ type: "close", reason: "idle" }]);
});

test("first words are retained before speech confirmation; short pauses do not split the answer", () => {
  const f = fixture();
  f.feed(500); f.feed(300, .1); f.feed(1000); f.feed(400, .1); f.feed(2250);
  assert.equal(f.events.filter(e => e.type === "start").length, 1);
  const [answer] = f.events.filter(e => e.type === "turn");
  assert.ok(answer.chunks.some(chunk => chunk[0] > .09));
  assert.equal(answer.chunks.filter(chunk => chunk[0] > .09).length, 14);
  assert.equal(answer.reason, "silence");
  assert.equal(answer.number, 1);
});

test("two answers use the same detector but generate separate numbered turns", () => {
  const f = fixture();
  for (let i = 0; i < 2; i++) { f.feed(300, .1); f.feed(2250); }
  assert.deepEqual(f.events.filter(e => e.type === "turn").map(e => e.number), [1, 2]);
});

test("playback guard and sustained voice distinguish interruption from a brief sound", () => {
  const f = fixture();
  f.feed(700, .15, true);
  f.feed(50, .15, true); f.feed(100, 0, true);
  assert.equal(f.events.length, 0);
  f.feed(350, .15, true);
  assert.deepEqual(f.events, [{ type: "start", interrupted: true }]);
  f.feed(100, .1, false); f.feed(2250, 0, false);
  assert.equal(f.events.filter(e => e.type === "turn").length, 1);
});

test("turning off voice interruptions suppresses playback and its tail", () => {
  const f = fixture({ interruptions: false });
  f.feed(2000, .2, true); f.feed(200, .2, false);
  assert.equal(f.events.length, 0);
  f.feed(400, .1, false);
  assert.equal(f.events[0].type, "start");
  assert.equal(f.events[0].interrupted, false);
});

test("45-second answer is marked for review rather than assumed complete", () => {
  const f = fixture();
  f.feed(45200, .1);
  const turns = f.events.filter(e => e.type === "turn");
  assert.equal(turns.length, 1); assert.equal(turns[0].reason, "turn-limit");
  assert.ok(turns[0].chunks.reduce((sum, a) => sum + a.length, 0) / 16000 <= 45.1);
});

test("ten turns exhaust the capture budget without another utterance", () => {
  const f = fixture();
  for (let i = 0; i < 10; i++) { f.feed(250, .1); f.feed(2200); }
  f.feed(50);
  assert.equal(f.events.filter(e => e.type === "turn").length, 10);
  assert.ok(f.events.some(e => e.type === "close" && e.reason === "turn-budget"));
});

test("session duration is bounded even while the character speaks", () => {
  const f = fixture();
  f.feed(CONTINUOUS_VOICE_LIMITS.sessionMs, 0, true);
  assert.deepEqual(f.events, [{ type: "close", reason: "session-limit" }]);
});

test("manual finish requires speech and discard prevents a half-answer leaking into the next turn", () => {
  const f = fixture();
  assert.equal(f.turn.finish(), null);
  f.feed(300, .1); f.turn.discard(); f.feed(2300);
  assert.equal(f.events.filter(e => e.type === "turn").length, 0);
  f.feed(300, .1);
  assert.equal(f.turn.finish().reason, "manual");
});

test("WAV encoding generates mono 16 kHz signed PCM with correct lengths and clipping", async () => {
  const wav = encodeVoiceWav([new Float32Array(4800).fill(.5)], 48000);
  const bytes = await wav.blob.arrayBuffer(), view = new DataView(bytes);
  assert.equal(wav.blob.type, "audio/wav");
  assert.equal(wav.fileName, "voice-turn.wav");
  assert.equal(new TextDecoder().decode(new Uint8Array(bytes, 0, 4)), "RIFF");
  assert.equal(view.getUint16(22, true), 1);
  assert.equal(view.getUint32(24, true), 16000);
  assert.equal(view.getUint32(40, true), 3200);
  assert.equal(bytes.byteLength, 3244);
  assert.equal(view.getInt16(44, true), 16384);
  const clipped = new DataView(await encodeVoiceWav([new Float32Array([2, -2])], 16000).blob.arrayBuffer());
  assert.equal(clipped.getInt16(44, true), 32767);
  assert.equal(clipped.getInt16(46, true), -32768);
});

test("correction and pause commands preserve supplied content in English and Spanish", () => {
  assert.deepEqual(conversationCorrection("Quiero corregir mi respuesta: vivo en Austin."), { answer: "vivo en Austin." });
  assert.deepEqual(conversationCorrection("I want to correct my answer. I live in Austin."), { answer: "I live in Austin." });
  assert.deepEqual(conversationCorrection("Correct my last answer"), { answer: "" });
  assert.equal(conversationIntent("Pausa"), "pause");
  assert.equal(conversationIntent("Stop listening"), "pause");
  assert.equal(conversationIntent("Quiero corregir mi respuesta"), "correct");
  assert.equal(conversationCorrection("I correct my children's homework"), null);
});
