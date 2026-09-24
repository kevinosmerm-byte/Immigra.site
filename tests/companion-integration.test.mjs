import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { emitCompanionResult, emitCompanionState, getCompanionVisibility, setCompanionVisibility } from "../src/companionEvents.js";

const main = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const quiz = await readFile(new URL("../src/QuizLearningPath.jsx", import.meta.url), "utf8");
const settings = await readFile(new URL("../src/LegalSettings.jsx", import.meta.url), "utf8");
const companion = await readFile(new URL("../src/companion.js", import.meta.url), "utf8");

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
    assert.equal(emitCompanionResult(true), 1);
    assert.equal(events.at(-1).detail.state, "correct");
    assert.equal(values.get("citizenshipai-companion-streak-v1"), "1");
  } finally {
    globalThis.window = previousWindow;
    globalThis.CustomEvent = previousCustomEvent;
  }
});
