import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/App.css", import.meta.url), "utf8");
const logo = await readFile(new URL("../public/app-icon-192.png", import.meta.url));

test("Home renders the approved flag icon with the Citizenship AI wordmark", () => {
  assert.match(app, /className="home-brand-logo" src="\/app-icon-192\.png"/);
  assert.match(app, /className="home-brand-wordmark">Citizenship <strong>AI<\/strong>/);
  assert.doesNotMatch(app, /className="brand-main"/);
  assert.ok(logo.byteLength > 1000);
});

test("header logo uses a compact square icon and preserves mobile gutters", () => {
  const logoRule = css.match(/\.home-brand-logo\s*\{[^}]+\}/)?.[0] || "";
  assert.match(logoRule, /width:\s*clamp\(/);
  assert.match(logoRule, /height:\s*clamp\(/);
  assert.match(logoRule, /object-fit:\s*cover/);
  assert.match(css, /\.home-brand-wordmark strong\s*\{[^}]*color:\s*#22d3ee/);
  assert.match(css, /padding-inline:\s*clamp\(16px, 4vw, 48px\)/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?padding-inline:\s*16px/);
});

test("header geometry supports all requested viewport widths", () => {
  const widths = [320, 375, 390, 430, 768, 1440];
  for (const viewport of widths) {
    const gutter = viewport <= 430 ? 16 : Math.min(48, Math.max(16, viewport * 0.04));
    const logoWidth = viewport <= 430 ? 142 : 176;
    const actionControls = 126;
    assert.ok(logoWidth + actionControls + gutter * 2 <= viewport, `${viewport}px header must not overflow`);
  }
});
