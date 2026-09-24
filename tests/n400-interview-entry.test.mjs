import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/App.css", import.meta.url), "utf8");
const companion = await readFile(new URL("../src/companion.js", import.meta.url), "utf8");

test("Home exposes a dedicated N-400 interview entry without replacing existing actions", () => {
  assert.match(app, /onStartN400Interview/);
  assert.match(app, /ENTREVISTA N-400/);
  assert.match(app, /startInterview\("n400"\)/);
  assert.match(app, /mode === "n400"\) return \[\.\.\.n400InterviewQuestions\]/);
  assert.match(styles, /\.home-n400-interview-button/);
});

test("N-400 practice reuses the existing interview engine and can restart in place", () => {
  assert.match(app, /INTERACTIVE N-400 PRACTICE/);
  assert.match(app, /PRACTICE N-400 AGAIN/);
  assert.match(app, /key=\{`\$\{interviewMode\}-\$\{interviewRunId\}`\}/);
});

test("full interview keeps the companion neutral while practice exposes user controls", () => {
  assert.match(app, /mode === "full"\) emitCompanionState\("idle", \{ duration: 0, silent: true \}\)/);
  assert.match(app, /Companion: \{companionEnabled \? "On" : "Off"\}/);
  assert.match(app, /Hide for this interview/);
  assert.match(companion, /data-silent/);
  assert.match(styles, /\.interview-companion-controls/);
});

