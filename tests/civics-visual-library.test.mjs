import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { civicsVisualLibrary, getCivicsVisual } from "../src/civicsVisuals.js";

test("visual library covers every one of the 128 cards", () => {
  assert.equal(civicsVisualLibrary.length, 128);
  assert.deepEqual(civicsVisualLibrary.map((item) => item.questionId), Array.from({ length: 128 }, (_, index) => index + 1));
  for (let questionId = 1; questionId <= 128; questionId += 1) assert.ok(getCivicsVisual(questionId));
});

test("every mapped image has complete source, license, and accessibility metadata", async () => {
  for (const visual of civicsVisualLibrary) {
    assert.ok(visual.alt.length >= 20);
    assert.equal(visual.license, "Original project artwork");
    assert.ok(visual.sourceName && visual.sourceUrl && visual.attribution);
    const asset = new URL(`../public${visual.imagePath}`, import.meta.url);
    assert.ok((await stat(asset)).size < 150_000);
    const svg = await readFile(asset, "utf8");
    assert.match(svg, /<title/);
    assert.doesNotMatch(svg, /USCIS|official seal|agency logo/i);
  }
});

test("study UI keeps images optional and eager-loads only the current card image", async () => {
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(app, /citizenshipai\.civics-images\.v1/);
  assert.match(app, /aria-pressed={showCivicsImages}/);
  assert.match(app, /loading="eager" decoding="async" fetchPriority="high"/);
  assert.match(app, /currentVisual && showCivicsImages/);
});
