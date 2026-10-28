import test from "node:test";
import assert from "node:assert/strict";
import { createCaseStatusProvider, USCIS_PUBLIC_CASE_STATUS_URL } from "../server/uscisService.js";

const receiptNumber = "IOE1234567890";
const checkedAt = "2026-10-05T12:00:00Z";
const fixture = ({ production = true } = {}) => ({
  case_status: { current_case_status_text_en: "Interview Was Scheduled", current_case_status_desc_en: "Read your appointment notice.", modifiedDate: "2026-10-01", receiptNumber },
  tracker: { environment: production ? "production" : "sandbox", isTestData: !production, checkedAt },
});

test("manual CaseStatusProvider works without API, credentials, receipt or network and invents no lookup date/status", async () => {
  let requests = 0;
  const provider = createCaseStatusProvider({ fetchStatus: async () => { requests += 1; throw new Error("Must not call network"); } });
  const result = await provider.getStatus({ receiptNumber });
  assert.equal(requests, 0);
  assert.equal(result.requiresUserAction, true);
  assert.equal(result.sourceUrl, USCIS_PUBLIC_CASE_STATUS_URL);
  assert.equal(result.title, null);
  assert.equal(result.lastCheckedAt, null);
  assert.equal(result.retrievedAt, null);
  assert.equal(result.official, false);
  assert.equal(result.canUpdateCaseProfile, false);
  assert.equal(JSON.stringify(result).includes(receiptNumber), false);
});

test("official provider reuses authorized lookup, preserves source/date and keeps raw payload backend-only", async () => {
  let received;
  const raw = fixture();
  const provider = createCaseStatusProvider({ mode: "official-api", fetchStatus: async input => { received = input; return raw; } });
  const result = await provider.getStatus({ receiptNumber: receiptNumber.toLowerCase() });
  assert.equal(received, receiptNumber);
  assert.equal(result.title, "Interview Was Scheduled");
  assert.equal(result.statusDate, "2026-10-01");
  assert.equal(result.retrievedAt, checkedAt);
  assert.equal(result.source, "USCIS");
  assert.equal(result.confidence, "OFFICIAL_USCIS");
  assert.equal(result.official, true);
  assert.equal(result.canUpdateCaseProfile, true);
  assert.equal(result.isTestData, false);
  assert.strictEqual(result.raw, raw);
  assert.equal(JSON.stringify(result).includes(receiptNumber), false);
  assert.equal(JSON.stringify(result).includes('"raw"'), false);
});

test("sandbox case status is explicit test data and never eligible to update a real profile", async () => {
  const provider = createCaseStatusProvider({ mode: "official-api", fetchStatus: async () => fixture({ production: false }) });
  const result = await provider.getStatus(receiptNumber);
  assert.equal(result.isTestData, true);
  assert.equal(result.official, false);
  assert.equal(result.confidence, "SANDBOX_TEST_DATA");
  assert.equal(result.canUpdateCaseProfile, false);
  assert.equal(result.retrievedAt, checkedAt);
});

test("unknown provenance/incomplete status cannot claim official production verification", async () => {
  const unknown = createCaseStatusProvider({ mode: "official-api", fetchStatus: async () => ({ case_status: fixture().case_status, tracker: { checkedAt } }) });
  assert.equal((await unknown.getStatus(receiptNumber)).canUpdateCaseProfile, false);
  const incomplete = createCaseStatusProvider({ mode: "official-api", fetchStatus: async () => ({ case_status: {}, tracker: fixture().tracker }) });
  const result = await incomplete.getStatus(receiptNumber);
  assert.equal(result.official, false);
  assert.equal(result.canUpdateCaseProfile, false);
  assert.equal(result.requiresUserAction, true);
});

test("invalid receipt is rejected before official API lookup; missing credentials remain an honest blocker", async () => {
  let requests = 0;
  const provider = createCaseStatusProvider({ mode: "official-api", fetchStatus: async () => { requests += 1; } });
  await assert.rejects(provider.getStatus({ receiptNumber: "invalid" }), error => error.status === 400);
  assert.equal(requests, 0);
  const unconfigured = createCaseStatusProvider({ mode: "official-api", environment: {} });
  await assert.rejects(unconfigured.getStatus(receiptNumber), error => error.status === 503 && error.source === "configuration");
});
