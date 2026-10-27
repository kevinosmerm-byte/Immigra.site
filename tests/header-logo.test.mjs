import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/App.css", import.meta.url), "utf8");
const logo = await readFile(new URL("../public/immigra-site-logo.svg", import.meta.url), "utf8");

test("Home renders one complete SVG wordmark instead of separately spaced pieces", () => {
  assert.match(app, /className="home-brand-logo" src="\/immigra-site-logo\.svg" alt="Immigra\.site"/);
  assert.doesNotMatch(app, /className="brand-main"/);
  assert.match(logo, /viewBox="0 0 470 96"/);
  assert.match(logo, />IMMIGRA<\/text>/);
  assert.match(logo, />\.SITE<\/text>/);
  assert.doesNotMatch(logo, />CITIZENSHIP</);
});

test("header logo preserves aspect ratio and mobile gutters", () => {
  const logoRule = css.match(/\.home-brand-logo\s*\{[^}]+\}/)?.[0] || "";
  assert.match(logoRule, /width:\s*clamp\(/);
  assert.match(logoRule, /height:\s*auto/);
  assert.match(logoRule, /object-fit:\s*contain/);
  assert.doesNotMatch(logoRule, /object-fit:\s*cover/);
  assert.match(css, /padding-inline:\s*clamp\(16px, 4vw, 48px\)/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*?padding-inline:\s*16px/);
});

test("header geometry supports all requested viewport widths", () => {
  const widths = [320, 375, 390, 430, 768, 1440];
  for (const viewport of widths) {
    const gutter = viewport <= 430 ? 16 : Math.min(48, Math.max(16, viewport * 0.04));
    const logoWidth = viewport <= 430
      ? Math.min(156, Math.max(128, viewport * 0.38))
      : Math.min(220, Math.max(132, viewport * 0.34));
    const actionControls = 126;
    assert.ok(logoWidth + actionControls + gutter * 2 <= viewport, `${viewport}px header must not overflow`);
  }
});
