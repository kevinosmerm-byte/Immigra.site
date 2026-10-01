import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

test("Spanish home copy keeps the remaining dashboard headings translated", () => {
  for (const text of [
    "ENTRENAMIENTO DE CIUDADANÍA CON IA",
    "TU PREPARACIÓN",
    "VER PROGRESO",
    "Seguimiento del caso",
  ]) {
    assert.match(app, new RegExp(text));
  }
});

test("Home opens directly into practice cards without a redundant section banner", () => {
  assert.match(app, /className="home-new-section home-practice-section"/);
  assert.doesNotMatch(app, /copy\.quickPractice|copy\.trainWithAi/);
});

test("Home uses the promotional video as the primary real-interview action with playback controls", () => {
  assert.match(app, /src="\/citizenshipai-home-cta\.mp4"/);
  assert.match(app, /autoPlay/);
  assert.match(app, /onClick=\{onStartInterview\}/);
  assert.match(app, /toggleHomeVideoPlayback/);
  assert.match(app, /toggleHomeVideoSound/);
  assert.match(app, /homeVideoNeedsSound/);
  assert.doesNotMatch(app, /home-video-primary-action/);
});

test("Home preparation card uses measured progress instead of hard-coded zeroes", () => {
  assert.match(app, /className="home-progress-link" onClick=\{onOpenProgress\}/);
  assert.match(app, /practiceSummary\?\.civics\?\.viewed/);
  assert.doesNotMatch(app, /className="preparation-score"/);
});

test("Home keeps unfinished case tracking visible but inaccessible", () => {
  assert.match(app, /development: "EN DESARROLLO"/);
  assert.match(app, /className="home-uscis-disabled-button"[\s\S]{0,100}disabled/);
  assert.doesNotMatch(app, /onClick=\{\(\) => onOpenFeature\("uscisTracker"\)\}/);
});

test("Coach entry buttons are removed while reading and writing remain", () => {
  assert.doesNotMatch(app, /onClick=\{openCoachFrom\}/);
  assert.match(app, /onOpenFeature\("reading"\)/);
  assert.match(app, /onOpenFeature\("writing"\)/);
});
