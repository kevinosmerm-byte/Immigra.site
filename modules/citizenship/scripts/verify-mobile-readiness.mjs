import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import assert from "node:assert/strict";

const requiredFiles = [
  "dist/index.html",
  "public/manifest.webmanifest",
  "public/sw.js",
  "public/app-icon-192.png",
  "public/app-icon-512.png",
  "capacitor.config.ts",
  "android/app/src/main/AndroidManifest.xml",
  "android/variables.gradle",
];

for (const file of requiredFiles) {
  await access(file, constants.R_OK);
}

const manifest = JSON.parse(await readFile("public/manifest.webmanifest", "utf8"));
assert.equal(manifest.display, "standalone", "PWA must open in standalone mode");
assert.equal(manifest.start_url, "/", "PWA start URL must remain on the app root");
assert.ok(manifest.icons?.some((icon) => icon.purpose?.includes("maskable")), "A maskable icon is required");
assert.ok(manifest.icons?.some((icon) => icon.sizes === "192x192" && icon.type === "image/png"), "A 192px PNG icon is required");
assert.ok(manifest.icons?.some((icon) => icon.sizes === "512x512" && icon.type === "image/png"), "A 512px PNG icon is required");

const capacitor = await readFile("capacitor.config.ts", "utf8");
assert.match(capacitor, /us\.citizenshipai\.app/, "Stable Android application id is required");
assert.match(capacitor, /webDir:\s*["']\.\.\/\.\.\/dist["']/, "Capacitor must package the production build");

const androidManifest = await readFile("android/app/src/main/AndroidManifest.xml", "utf8");
assert.match(androidManifest, /android\.permission\.RECORD_AUDIO/, "Android must declare microphone access for voice practice");
assert.match(androidManifest, /android\.permission\.CAMERA/, "Android must declare optional camera access for the live avatar");
assert.match(androidManifest, /android:allowBackup="false"/, "Android WebView data backups must be disabled");
assert.match(androidManifest, /android:usesCleartextTraffic="false"/, "Android must reject cleartext network traffic");

const androidVersions = await readFile("android/variables.gradle", "utf8");
assert.match(androidVersions, /compileSdkVersion\s*=\s*36/, "Android must compile against API 36");
assert.match(androidVersions, /targetSdkVersion\s*=\s*36/, "Android must target API 36");

const html = await readFile("../../dist/index.html", "utf8");
assert.match(html, /manifest\.webmanifest/, "Production HTML must expose the web manifest");
assert.match(html, /viewport/, "Production HTML must declare a mobile viewport");

console.log("Mobile readiness checks passed.");
