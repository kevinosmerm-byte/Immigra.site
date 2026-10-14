import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const shareImage = await readFile(new URL("../public/citizenshipai-share.png", import.meta.url));

test("the public site exposes a complete large social sharing card", () => {
  assert.match(index, /<link rel="canonical" href="https:\/\/immigra\.site\/" \/>/);
  assert.match(index, /property="og:type" content="website"/);
  assert.match(index, /property="og:title" content="Immigra — Your Interview\. Your Future\."/);
  assert.match(index, /property="og:image" content="https:\/\/immigra\.site\/citizenshipai-share\.png"/);
  assert.match(index, /property="og:image:width" content="1734"/);
  assert.match(index, /property="og:image:height" content="907"/);
  assert.match(index, /name="twitter:card" content="summary_large_image"/);
  assert.match(index, /name="twitter:image" content="https:\/\/immigra\.site\/citizenshipai-share\.png"/);
});

test("the social image is a correctly sized PNG within common preview limits", () => {
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.deepEqual(shareImage.subarray(0, 8), pngSignature);
  assert.equal(shareImage.readUInt32BE(16), 1734);
  assert.equal(shareImage.readUInt32BE(20), 907);
  assert.ok(shareImage.byteLength < 5 * 1024 * 1024);
});
