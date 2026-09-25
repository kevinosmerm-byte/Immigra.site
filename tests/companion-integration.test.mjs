import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { emitCompanionResult, emitCompanionState, getCompanionVisibility, setCompanionVisibility } from "../src/companionEvents.js";

const main = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const quiz = await readFile(new URL("../src/QuizLearningPath.jsx", import.meta.url), "utf8");
const settings = await readFile(new URL("../src/LegalSettings.jsx", import.meta.url), "utf8");
const companion = await readFile(new URL("../src/companion.js", import.meta.url), "utf8");
const mascotAsset = await readFile(new URL("../public/citizenship-companion.png", import.meta.url));
const reactionAssets = await Promise.all([
  "approved", "denied", "goal", "love", "sleeping", "studying",
].map((name) => readFile(new URL(`../public/companion-${name}-cutout.png`, import.meta.url))));

test("the study companion is registered and mounted exactly once at app level", () => {
  assert.match(main, /import '\.\/companion\.js'/);
  assert.equal((main.match(/<citizenship-companion\s*\/>/g) || []).length, 1);
  assert.match(companion, /customElements\.define\("citizenship-companion"/);
});

test("the companion is accessible, non-blocking, persistent, and reduced-motion aware", () => {
  assert.match(companion, /role="status" aria-live="polite"/);
  assert.match(companion, /prefers-reduced-motion:reduce/);
  assert.match(companion, /citizenshipai-companion-visible-v1/);
  assert.match(companion, /:host \{[^}]*pointer-events:none/);
  assert.match(companion, /bubbles: true/);
  assert.match(companion, /composed: true/);
  assert.match(companion, /class="figure" type="button" aria-label="Ocultar acompañante de estudio"/);
  assert.doesNotMatch(companion, /Tu compañero de práctica/);
  assert.doesNotMatch(companion, /class="hide"/);
  assert.match(companion, /querySelector\("\.figure"\)\.addEventListener\("click"/);
  assert.ok(mascotAsset.byteLength > 100_000);
});

test("the mascot uses dedicated reaction artwork for real learning states", () => {
  assert.equal((companion.match(/class="mascot-image"/g) || []).length, 1);
  for (const state of ["thinking", "correct", "incorrect", "streak", "reading", "coach", "celebration", "welcome", "sleepy"]) {
    assert.match(companion, new RegExp(`data-state=\\"${state}\\"`));
  }
  assert.match(companion, /@keyframes mascotCelebrate/);
  assert.match(companion, /@keyframes mascotComfort/);
  assert.match(companion, /@keyframes mascotListen/);
  for (const name of ["approved", "denied", "goal", "love", "sleeping", "studying"]) {
    assert.match(companion, new RegExp(`companion-${name}-cutout\\.png`));
  }
  for (const asset of reactionAssets) assert.ok(asset.byteLength > 100_000);
});

test("all approved encouragement phrases are available in Spanish and English", () => {
  const phrases = [
    ["¡Vas muy bien!", "You're doing great!"],
    ["¡Un paso más!", "One more step!"],
    ["¡Sigue así!", "Keep it up!"],
    ["¡Buen esfuerzo!", "Great effort!"],
    ["¡Lo estás logrando!", "You're making it happen!"],
    ["¡Confía en ti!", "Believe in yourself!"],
    ["¡Cada intento cuenta!", "Every try counts!"],
    ["¡Vamos juntos!", "Let's do this together!"],
    ["¡Tómate tu tiempo!", "Take your time!"],
    ["¡Puedes intentarlo otra vez!", "You can try again!"],
    ["¡Aprendiste algo nuevo!", "You learned something new!"],
    ["¡Mira cuánto avanzaste!", "Look how far you've come!"],
    ["¡Gran respuesta!", "Great answer!"],
    ["¡Qué buena racha!", "What a great streak!"],
  ];
  for (const [spanish, english] of phrases) {
    assert.ok(companion.includes(spanish));
    assert.ok(companion.includes(english));
  }
  assert.match(companion, /localStorage\.getItem\("citizenshipai\.language"\)/);
});

test("real practice flows drive companion reactions and Settings controls visibility", () => {
  for (const state of ["thinking", "coach", "reading", "celebration"]) {
    assert.match(app, new RegExp(`emitCompanionState\\(\\"${state}\\"`));
  }
  assert.match(app, /emitCompanionResult\(/);
  assert.match(quiz, /emitCompanionResult\(/);
  assert.match(settings, /setCompanionVisibility/);
  assert.match(settings, /Hide study companion/);
});

test("the event bridge validates state, persists visibility, and tracks a local streak", () => {
  const values = new Map();
  const events = [];
  const previousWindow = globalThis.window;
  const previousCustomEvent = globalThis.CustomEvent;
  globalThis.CustomEvent = class CustomEvent { constructor(type, options) { this.type = type; this.detail = options.detail; } };
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
    },
    dispatchEvent: (event) => { events.push(event); return true; },
    setTimeout,
  };

  try {
    assert.equal(getCompanionVisibility(), true);
    assert.equal(setCompanionVisibility(false), false);
    assert.equal(getCompanionVisibility(), false);
    assert.equal(emitCompanionState("not-a-state"), false);
    assert.equal(emitCompanionState("studying"), true);
    assert.equal(events.at(-1).detail.state, "studying");
    assert.equal(emitCompanionResult(true), 1);
    assert.equal(events.at(-1).detail.state, "correct");
    assert.equal(values.get("citizenshipai-companion-streak-v1"), "1");
  } finally {
    globalThis.window = previousWindow;
    globalThis.CustomEvent = previousCustomEvent;
  }
});
