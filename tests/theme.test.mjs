import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeThemePreference, initialThemePreference, resolveTheme, THEME_STORAGE_KEY, APPEARANCE_VERSION } from "../src/theme.js";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const settings = await readFile(new URL("../src/LegalSettings.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/App.css", import.meta.url), "utf8");

test("theme preferences normalize safely and system mode resolves predictably", () => {
  assert.equal(normalizeThemePreference("light"), "light");
  assert.equal(normalizeThemePreference("unknown"), "light");
  assert.equal(resolveTheme("system", true), "light");
  assert.equal(resolveTheme("system", false), "dark");
  assert.equal(resolveTheme("dark", true), "dark");
});

test("the white redesign migrates legacy defaults once and retains later explicit choices", () => {
  assert.equal(initialThemePreference("dark", ""), "light");
  assert.equal(initialThemePreference("system", ""), "light");
  assert.equal(initialThemePreference(null, null), "light");
  assert.equal(initialThemePreference("dark", APPEARANCE_VERSION), "dark");
  assert.equal(initialThemePreference("system", APPEARANCE_VERSION), "system");
  assert.equal(initialThemePreference("light", APPEARANCE_VERSION), "light");
  assert.equal(initialThemePreference("invalid", APPEARANCE_VERSION), "light");
});

test("App persists and applies the resolved theme at the document root", () => {
  assert.equal(THEME_STORAGE_KEY, "citizenshipai.theme.v1");
  assert.match(app, /document\.documentElement\.dataset\.theme = resolvedTheme/);
  assert.match(app, /prefers-color-scheme: light/);
  assert.match(app, /saveLocalValue\(THEME_STORAGE_KEY, themePreference\)/);
});

test("Settings exposes accessible system, light, and dark choices", () => {
  assert.match(settings, /THEME_PREFERENCES\.map/);
  assert.match(settings, /aria-pressed=\{themePreference === value\}/);
  assert.match(settings, /Tema de la aplicación/);
  assert.match(css, /html\[data-theme="light"\]/);
  assert.match(css, /\.settings-header \.back-button\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/);
});
