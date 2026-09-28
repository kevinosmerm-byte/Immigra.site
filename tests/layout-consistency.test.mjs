import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../src/App.css", import.meta.url), "utf8");

test("cross-screen spacing tokens keep controls and gaps on one rhythm", () => {
  assert.match(css, /--layout-gap-xs:\s*8px/);
  assert.match(css, /--layout-gap-sm:\s*12px/);
  assert.match(css, /--layout-control-height:\s*48px/);
  assert.match(css, /--layout-card-control-height:\s*68px/);
});

test("paired home actions and practice cards stretch to equal heights", () => {
  assert.match(css, /\.home-ai \.home-interview-actions,[\s\S]*?grid-auto-rows:\s*1fr/);
  assert.match(css, /\.home-ai \.home-interview-actions \.home-primary-button,[\s\S]*?height:\s*100%/);
  assert.match(css, /\.practice-options\s*\{[\s\S]*?grid-auto-rows:\s*minmax\(78px, auto\)/);
});

test("writing, quiz and resource grids preserve equal sibling geometry", () => {
  assert.match(css, /\.writing-review-actions\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.quiz-level-list\s*\{[\s\S]*?grid-auto-rows:\s*minmax\(82px, auto\)/);
  assert.match(css, /\.immigration-featured-grid,[\s\S]*?\.progress-ai-modules\s*\{[\s\S]*?grid-auto-rows:\s*1fr/);
});

test("mobile layouts keep uniform rows and stack writing review actions", () => {
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.practice-options\s*\{[\s\S]*?grid-auto-rows:\s*minmax\(70px, auto\)/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.writing-review-actions\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
  assert.match(css, /original mobile practice hierarchy[\s\S]*?\.home-ai \.home-practice-list\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /original mobile practice hierarchy[\s\S]*?\.home-ai \.practice-mini-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
});
