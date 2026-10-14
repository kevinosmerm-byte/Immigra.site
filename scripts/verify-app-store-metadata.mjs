import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const metadata = JSON.parse(await readFile("app-store/metadata.json", "utf8"));
assert.equal(metadata.app.bundleId, "us.citizenshipai.app");

for (const [locale, copy] of Object.entries(metadata.localizations)) {
  assert.ok(copy.name.length >= 2 && copy.name.length <= 30, `${locale} name must be 2–30 characters`);
  assert.ok(copy.subtitle.length <= 30, `${locale} subtitle must be at most 30 characters`);
  assert.ok(copy.promotionalText.length <= 170, `${locale} promotional text must be at most 170 characters`);
  assert.ok(copy.description.length <= 4000, `${locale} description must be at most 4000 characters`);
  assert.ok(Buffer.byteLength(copy.keywords, "utf8") <= 100, `${locale} keywords must be at most 100 UTF-8 bytes`);
  assert.doesNotMatch(copy.keywords, /(^|,)\s|\s(,|$)/, `${locale} keywords should not waste bytes around commas`);
}

for (const field of ["privacyPolicyUrl", "supportUrl", "marketingUrl"]) {
  assert.match(metadata.app[field], /^https:\/\//, `${field} must use HTTPS`);
}
assert.equal(metadata.review.demoAccountRequired, true);
assert.match(metadata.review.notes, /independent educational study app/);
assert.match(metadata.review.notes, /No advertising SDK is present/);



assert.equal(metadata.localizations["en-US"].name, "Immigra");
assert.equal(new URL(metadata.app.privacyPolicyUrl).hostname, "immigra.site");
assert.equal(metadata.app.accountDeletionUrl, "https://immigra.site/#deleteAccount");
assert.doesNotMatch(metadata.review.notes, /launch promotion/i);

const play = JSON.parse(await readFile("google-play/metadata.json", "utf8"));
assert.equal(play.app.packageName, metadata.app.bundleId);
assert.equal(play.app.accountDeletionUrl, metadata.app.accountDeletionUrl);
for (const [locale, copy] of Object.entries(play.localizations)) {
  assert.ok(copy.title.length > 0 && copy.title.length <= 30, `${locale} Play title must fit`);
  assert.ok(copy.shortDescription.length > 0 && copy.shortDescription.length <= 80, `${locale} Play short description must fit`);
  assert.ok(copy.fullDescription.length > 0 && copy.fullDescription.length <= 4000, `${locale} Play description must fit`);
}

console.log("Apple and Google Play metadata foundation checks passed.");
