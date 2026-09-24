import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { allCivicsQuestionIds, civicsVisualLibrary, getCivicsVisual, prototypeQuestionIds } from "../src/civicsVisuals.js";

test("the approved visual system covers all 128 official civics questions", () => {
  assert.equal(civicsVisualLibrary.length, 128);
  assert.deepEqual(civicsVisualLibrary.map((item) => item.questionId), allCivicsQuestionIds);
  for (const questionId of prototypeQuestionIds) assert.ok(getCivicsVisual(questionId));
  for (const questionId of allCivicsQuestionIds) assert.ok(getCivicsVisual(questionId)?.imagePath);
  assert.equal(getCivicsVisual(129), null);
});

test("every mapped image has complete source, license, and accessibility metadata", async () => {
  const verifiedAssets = new Set();
  for (const visual of civicsVisualLibrary) {
    assert.ok(visual.imageAlt.length >= 20);
    assert.ok(visual.license && visual.license !== "Original project artwork");
    assert.ok(visual.sourceName && visual.sourceLabel && visual.sourceUrl.startsWith("https://"));
    assert.ok(["document", "institution", "person", "map"].includes(visual.category));
    assert.match(visual.imagePath, /\.webp$/);
    if (!verifiedAssets.has(visual.imagePath)) {
      assert.ok((await stat(new URL(visual.imagePath))).size < 300_000);
      verifiedAssets.add(visual.imagePath);
    }
  }
});

test("study UI uses the reusable premium card and preloads adjacent official photos", async () => {
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const component = await readFile(new URL("../src/CivicsStudyCard.jsx", import.meta.url), "utf8");
  assert.match(app, /<CivicsStudyCard/);
  assert.doesNotMatch(app, /Imágenes educativas activadas|showCivicsImages/);
  assert.match(component, /loading="eager" decoding="async" fetchPriority="high"/);
  assert.match(component, /preloadImages\.filter\(Boolean\)/);
  assert.match(component, /disabled=\{!audioEnabled\}/);
  assert.match(app, /if \(!next\) stopAppSpeech\(\)/);
  assert.match(app, /\[screen, civicsIndex, soundEnabled\]/);
  assert.doesNotMatch(component, /rotateY|preserve-3d/);
});
