import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import assert from "node:assert/strict";

const requiredFiles = [
  "dist/index.html",
  "public/manifest.webmanifest",
  "public/sw.js",
  "public/app-icon.svg",
  "capacitor.config.js",
];

for (const file of requiredFiles) {
  await access(file, constants.R_OK);
}

const manifest = JSON.parse(await readFile("public/manifest.webmanifest", "utf8"));
assert.equal(manifest.display, "standalone", "PWA must open in standalone mode");
assert.equal(manifest.start_url, "/", "PWA start URL must remain on the app root");
assert.ok(manifest.icons?.some((icon) => icon.purpose?.includes("maskable")), "A maskable icon is required");

const capacitor = await readFile("capacitor.config.js", "utf8");
assert.match(capacitor, /us\.citizenshipai\.app/, "Stable Android application id is required");
assert.match(capacitor, /webDir:\s*["']dist["']/, "Capacitor must package the production build");

const html = await readFile("dist/index.html", "utf8");
assert.match(html, /manifest\.webmanifest/, "Production HTML must expose the web manifest");
assert.match(html, /viewport/, "Production HTML must declare a mobile viewport");

console.log("Mobile readiness checks passed.");
