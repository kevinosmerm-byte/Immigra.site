import test from "node:test";
import assert from "node:assert/strict";
import { providerFailureDiagnostic, logProviderFailure } from "../server/providerDiagnostics.js";

test("provider diagnostics distinguish actionable upstream failures", () => {
  for (const [error, category] of [
    [{ status: 401 }, "authentication"],
    [{ status: 403 }, "permission"],
    [{ status: 429, code: "insufficient_quota" }, "quota"],
    [{ status: 429, code: "rate_limit_exceeded" }, "rate_limit"],
    [{ status: 404, code: "model_not_found" }, "model_access"],
    [{ status: 503 }, "provider_unavailable"],
    [{ code: "ECONNRESET" }, "connection"],
    [null, "unknown"],
  ]) assert.equal(providerFailureDiagnostic(error, "coach").category, category);
});

test("diagnostics exclude sensitive messages, bodies, headers and arbitrary codes", () => {
  const diagnostic = providerFailureDiagnostic({ status: 401, code: "private transcript", message: "secret key", headers: { authorization: "secret" }, request: { body: "private audio" } }, "private user answer");
  assert.deepEqual(diagnostic, { event: "ai_provider_failure", provider: "openai", operation: "unknown", status: 401, category: "authentication" });
  assert.equal(providerFailureDiagnostic({ code: "__proto__", status: 200 }, "transcribe").category, "unknown");
  assert.equal(providerFailureDiagnostic({ status: "invalid" }, "transcribe").status, null);
});

test("provider logger writes only the structured allowlisted diagnostic", () => {
  const original = console.error;
  const records = [];
  console.error = (...args) => records.push(args);
  try { logProviderFailure({ status: 429, code: "insufficient_quota", message: "sensitive" }, "transcribe"); }
  finally { console.error = original; }
  assert.equal(records.length, 1);
  assert.equal(records[0].length, 1);
  assert.deepEqual(JSON.parse(records[0][0]), { event: "ai_provider_failure", provider: "openai", operation: "transcribe", status: 429, category: "quota" });
});
