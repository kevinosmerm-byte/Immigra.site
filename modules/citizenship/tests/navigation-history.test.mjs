import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createNavigationHistory, navigateBack, navigateForward } from "../src/navigationHistory.js";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

test("navigation history returns through the actual screen sequence", () => {
  let state = createNavigationHistory("home");
  state = navigateForward(state, "progress");
  state = navigateForward(state, "reading");
  state = navigateForward(state, "coach");

  state = navigateBack(state);
  assert.equal(state.current, "reading");
  state = navigateBack(state);
  assert.equal(state.current, "progress");
  state = navigateBack(state);
  assert.equal(state.current, "home");
});

test("replace navigation skips transient completed screens", () => {
  let state = createNavigationHistory("home");
  state = navigateForward(state, "interview");
  state = navigateForward(state, "civics", { replace: true });
  state = navigateBack(state);
  assert.equal(state.current, "home");
});

test("back uses a safe fallback when a screen was opened directly", () => {
  const state = navigateBack(createNavigationHistory("settings"), "home");
  assert.equal(state.current, "home");
});

test("all routed screen back controls use navigation history", () => {
  assert.doesNotMatch(app, /onBack=\{\(\) => setScreen\(/);
  assert.doesNotMatch(app, /onClick=\{\(\) => setScreen\((?:"home"|"practice"|"english"|"civics")\)\}/);
  assert.match(app, /onExit=\{\(\) => goBack\("home"\)\}/);
  assert.match(app, /onBack=\{\(\) => goBack\("civics"\)\}/);
  assert.match(app, /previousScreenLabel\("english"\)/);
  assert.match(app, /previousScreenLabel\("practice"\)/);
});
