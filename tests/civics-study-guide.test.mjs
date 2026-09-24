import test from "node:test";
import assert from "node:assert/strict";
import { open, readFile, stat } from "node:fs/promises";

const pdfUrl = new URL("../public/study-guides/uscis-2025-civics-test-study-guide.pdf", import.meta.url);

test("the official USCIS study guide is bundled intact as a PDF", async () => {
  const details = await stat(pdfUrl);
  assert.ok(details.size > 40_000_000);
  const file = await open(pdfUrl, "r");
  const header = Buffer.alloc(5);
  await file.read(header, 0, header.length, 0);
  await file.close();
  assert.equal(header.toString(), "%PDF-");
});

test("the civics section exposes a book-style reader with accessible controls", async () => {
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const reader = await readFile(new URL("../src/CivicsStudyGuide.jsx", import.meta.url), "utf8");
  assert.match(app, /setScreen\("civicsGuide"\)/);
  assert.match(app, /<CivicsStudyGuide/);
  assert.match(reader, /pdfjs-dist/);
  assert.match(reader, /Previous page/);
  assert.match(reader, /Next page/);
  assert.match(reader, /onTouchStart/);
  assert.match(reader, /ArrowLeft/);
  assert.match(reader, /type="range"/);
  assert.match(reader, /Open original PDF/);
});
