import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

test("Spanish home copy does not leave the primary dashboard headings in English", () => {
  for (const text of [
    "ENTRENAMIENTO DE CIUDADANÍA CON IA",
    "PRÁCTICA RÁPIDA",
    "Entrena con IA",
    "TU PREPARACIÓN",
    "VER PROGRESO",
    "Seguimiento del caso",
  ]) {
    assert.match(app, new RegExp(text));
  }
});

test("Home preparation card uses measured progress instead of hard-coded zeroes", () => {
  assert.match(app, /const readiness = practiceSummary\?\.readiness \?\? 0/);
  assert.match(app, /style=\{\{ width: `\$\{readiness\}%` \}\}/);
  assert.match(app, /practiceSummary=\{practiceSummary\}/);
  assert.doesNotMatch(app, /className="preparation-score">[\s\S]{0,120}<strong>0%<\/strong>/);
});

test("Home keeps unfinished case tracking visible but inaccessible", () => {
  assert.match(app, /development: "EN DESARROLLO"/);
  assert.match(app, /className="home-uscis-disabled-button"[\s\S]{0,100}disabled/);
  assert.doesNotMatch(app, /onClick=\{\(\) => onOpenFeature\("uscisTracker"\)\}/);
});

test("Sarah coach is contextual to reading and writing instead of Home", () => {
  assert.doesNotMatch(app, /className="coach-feature-card"/);
  assert.match(app, /const openCoachFrom = \(\) =>/);
  assert.ok((app.match(/className="english-coach-secondary" onClick=\{openCoachFrom\}/g) || []).length >= 2);
});
