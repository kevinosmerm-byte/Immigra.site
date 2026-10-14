import test from "node:test";
import assert from "node:assert/strict";
import { readStoryRequest, validateStoryAnalysis, STORY_LIMITS } from "../shared/storyPractice.js";
import { prepareStoryPractice } from "../server/storyPractice.js";
import { readStoryFile } from "../src/storyImport.js";
import { readFile } from "node:fs/promises";

const text = "Llegué en 2021. Trabajaba en una tienda. No recuerdo la fecha exacta del cambio de empleo.";
const analysis = { summary: "La persona describe su trabajo y una fecha que no recuerda.", topics: [{ label: "Trabajo", quote: "Trabajaba en una tienda." }], questions: ["¿Cómo describirías tu trabajo?", "¿Cómo explicarías que no recuerdas la fecha?", "¿Quieres practicar pedir un descanso?"] };

test("story analysis requires explicit permission and preserves the full source", () => {
  assert.throws(() => readStoryRequest({ text, language: "es" }), /CONSENT/);
  assert.throws(() => readStoryRequest({ text, language: "fr", consent: true }), /LANGUAGE/);
  assert.throws(() => readStoryRequest({ text: "x".repeat(STORY_LIMITS.characters + 1), language: "es", consent: true }), /TOO_LONG/);
  assert.deepEqual(readStoryRequest({ text, language: "es", consent: true }), { text, language: "es" });
});

test("analysis rejects unsupported source quotations and repetitive questions", () => {
  assert.deepEqual(validateStoryAnalysis(analysis, text), analysis);
  assert.throws(() => validateStoryAnalysis({ ...analysis, topics: [{ label: "Inventado", quote: "Me amenazaron en 2015." }] }, text), /INVALID/);
  assert.throws(() => validateStoryAnalysis({ ...analysis, questions: ["Repite?", "Repite?", "Otra?"] }, text), /INVALID/);
  assert.throws(() => validateStoryAnalysis({ ...analysis, questions: [] }, text), /INVALID/);
});

test("the preparation provider receives bounded educational instructions and full untrusted source", async () => {
  let request, options;
  const client = { responses: { create: async (input, args) => { request = input; options = args; return { output_text: JSON.stringify(analysis), usage: { input_tokens: 100, output_tokens: 50 } }; } } };
  const abort = new AbortController();
  const result = await prepareStoryPractice(client, "fixture-model", { text, language: "es" }, abort.signal);
  assert.deepEqual(result.analysis, analysis);
  assert.equal(JSON.parse(request.input).sourceText, text);
  assert.match(request.instructions, /Spanish/);
  assert.match(request.instructions, /Do not assess eligibility/);
  assert.equal(options.signal, abort.signal);
  assert.deepEqual(result.usage, { input_tokens: 100, output_tokens: 50 });
});

test("unreadable or oversized text is rejected without silently cutting content", async () => {
  assert.equal(await readStoryFile(new File([text], "story.txt", { type: "text/plain" })), text);
  await assert.rejects(() => readStoryFile(new File(["brief"], "story.txt")), /TEXT_REQUIRED/);
  await assert.rejects(() => readStoryFile(new File(["x".repeat(40001)], "story.txt")), /TOO_LONG/);
  await assert.rejects(() => readStoryFile(new File([text], "story.docx")), /FILE_TYPE/);
  const abort = new AbortController(); abort.abort();
  await assert.rejects(() => readStoryFile(new File([text], "story.txt"), { signal: abort.signal }), { name: "AbortError" });
});

test("the new preparation endpoint uses the existing account gate and sends only text", async () => {
  const server = await readFile(new URL("../server/server.js", import.meta.url), "utf8");
  const api = await readFile(new URL("../src/api.js", import.meta.url), "utf8");
  assert.match(server, /app\.post\("\/story\/prepare", requireAiFeature\("coach"\), requireAuthorizedAiAccess, aiRateLimit/);
  assert.match(api, /METERED_AI_PATHS = new Set\([\s\S]*?"\/story\/prepare"/);
  assert.match(server, /recordProviderUsage\(req, \{ provider: "openai", model: OPENAI_TEXT_MODEL, usage: result\.usage/);
});
