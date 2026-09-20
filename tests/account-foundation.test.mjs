import test from "node:test";
import assert from "node:assert/strict";

test("account configuration never exposes credentials", async () => {
  const { getAccountConfiguration } = await import("../server/accountService.js");
  const status = getAccountConfiguration();

  assert.deepEqual(Object.keys(status).sort(), ["configured", "provider"]);
  assert.equal(status.provider, "supabase");
  assert.equal(typeof status.configured, "boolean");
});

test("database migration contains atomic and privacy protections", async () => {
  const { readFile } = await import("node:fs/promises");
  const sql = await readFile(new URL("../supabase/migrations/202609200001_ai_entitlements.sql", import.meta.url), "utf8");

  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /unique \(user_id, idempotency_key\)/);
  assert.match(sql, /enable row level security/g);
  assert.match(sql, /revoke all on table public\.ai_sessions from anon, authenticated/);
  assert.doesNotMatch(sql, /microphone_recording|receipt_number|conversation_text/);
});

test("public account configuration never exposes the server secret", async () => {
  const previousSecret = process.env.SUPABASE_SECRET_KEY;
  const previousPublic = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  process.env.SUPABASE_SECRET_KEY = "server-secret-must-not-leak";
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "safe-publishable-key";
  const { getPublicAccountConfiguration } = await import(`../server/accountService.js?public=${Date.now()}`);
  const config = getPublicAccountConfiguration();
  assert.equal(config.publishableKey, "safe-publishable-key");
  assert.doesNotMatch(JSON.stringify(config), /server-secret-must-not-leak/);
  if (previousSecret === undefined) delete process.env.SUPABASE_SECRET_KEY; else process.env.SUPABASE_SECRET_KEY = previousSecret;
  if (previousPublic === undefined) delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY; else process.env.VITE_SUPABASE_PUBLISHABLE_KEY = previousPublic;
});

test("AI API requests can carry a server-verified account session", async () => {
  const { readFile } = await import("node:fs/promises");
  const api = await readFile(new URL("../src/api.js", import.meta.url), "utf8");
  const server = await readFile(new URL("../server/accountService.js", import.meta.url), "utf8");

  assert.match(api, /X-Citizenship-AI-Session/);
  assert.match(api, /Authorization/);
  assert.match(server, /eq\("user_id", authData\.user\.id\)/);
  assert.match(server, /X-Citizenship-AI-Session-Verified/);
});

test("provider usage metering stores technical metadata without user content", async () => {
  const { readFile } = await import("node:fs/promises");
  const accountService = await readFile(new URL("../server/accountService.js", import.meta.url), "utf8");
  const server = await readFile(new URL("../server/server.js", import.meta.url), "utf8");

  assert.match(accountService, /event_name: "ai_provider_request"/);
  assert.match(accountService, /inputTokens/);
  assert.match(accountService, /outputTokens/);
  assert.doesNotMatch(accountService, /conversationText|audioBlob|transcriptText/);
  assert.match(server, /response\.usage/);
  assert.match(server, /provider: "d-id"/);
});

test("session completion aggregates trusted server usage events", async () => {
  const { readFile } = await import("node:fs/promises");
  const accountService = await readFile(new URL("../server/accountService.js", import.meta.url), "utf8");
  const routes = await readFile(new URL("../server/accountRoutes.js", import.meta.url), "utf8");

  assert.match(accountService, /eq\("event_name", "ai_provider_request"\)/);
  assert.match(accountService, /total\.requestCount/);
  assert.doesNotMatch(routes, /req\.body\.telemetry/);
});

test("active AI sessions are finalized when the app page is hidden", async () => {
  const { readFile } = await import("node:fs/promises");
  const account = await readFile(new URL("../src/Account.jsx", import.meta.url), "utf8");
  const promotion = await readFile(new URL("../src/PromotionAccess.jsx", import.meta.url), "utf8");

  assert.match(account, /keepalive: Boolean\(options\.keepalive\)/);
  assert.match(promotion, /addEventListener\("pagehide"/);
  assert.match(promotion, /keepalive: true/);
});

test("abandoned sessions are reconciled without giving back consumed provider usage", async () => {
  const { readFile } = await import("node:fs/promises");
  const accountService = await readFile(new URL("../server/accountService.js", import.meta.url), "utf8");

  assert.match(accountService, /reconcileStaleAiSessions\(userId\)/);
  assert.match(accountService, /event_name", "ai_provider_request"/);
  assert.match(accountService, /outcome: count > 0 \? "completed" : "refunded"/);
});

test("signed-in users receive a compact per-feature allowance summary", async () => {
  const { readFile } = await import("node:fs/promises");
  const account = await readFile(new URL("../src/Account.jsx", import.meta.url), "utf8");

  assert.match(account, /account-usage-summary/);
  assert.match(account, /item\.freeUsed/);
  assert.match(account, /item\.freeLimit/);
  assert.match(account, /Math\.max\(0, limit - used\)/);
});

test("usage snapshots aggregate provider units without embedding prices", async () => {
  const { readFile } = await import("node:fs/promises");
  const sql = await readFile(new URL("../supabase/migrations/202609200002_usage_metering_snapshot.sql", import.meta.url), "utf8");

  assert.match(sql, /sum\(s\.request_count\)/);
  assert.match(sql, /sum\(s\.input_tokens\)/);
  assert.match(sql, /sum\(s\.output_tokens\)/);
  assert.match(sql, /sum\(s\.transcription_seconds\)/);
  assert.doesNotMatch(sql, /\$\d|usd|unit_price/i);
});

test("account exports are authenticated, bounded, and omit private content", async () => {
  const { readFile } = await import("node:fs/promises");
  const routes = await readFile(new URL("../server/accountRoutes.js", import.meta.url), "utf8");
  const service = await readFile(new URL("../server/accountService.js", import.meta.url), "utf8");
  const account = await readFile(new URL("../src/Account.jsx", import.meta.url), "utf8");

  assert.match(routes, /router\.use\(requireAccount\)[\s\S]*router\.get\("\/export"/);
  assert.match(routes, /Content-Disposition/);
  assert.match(service, /exportAccountData/);
  assert.match(service, /\.limit\(1000\)/);
  assert.doesNotMatch(service, /conversation_text|audio_blob|transcript_text/i);
  assert.match(account, /DOWNLOAD MY DATA/);
  assert.match(account, /DESCARGAR MIS DATOS/);
});

test("account deletion requires an explicit confirmation and uses the admin API", async () => {
  const { readFile } = await import("node:fs/promises");
  const routes = await readFile(new URL("../server/accountRoutes.js", import.meta.url), "utf8");
  const service = await readFile(new URL("../server/accountService.js", import.meta.url), "utf8");
  const account = await readFile(new URL("../src/Account.jsx", import.meta.url), "utf8");

  assert.match(routes, /router\.delete\("\/"/);
  assert.match(routes, /confirmation !== "DELETE"/);
  assert.match(service, /auth\.admin\.deleteUser\(userId\)/);
  assert.match(account, /deleteConfirmation !== "DELETE"/);
  assert.match(account, /Local study progress on this device is not removed/);
});

test("rate limits are shared atomically without storing raw IP addresses", async () => {
  const { readFile } = await import("node:fs/promises");
  const sql = await readFile(new URL("../supabase/migrations/202609200003_distributed_rate_limits.sql", import.meta.url), "utf8");
  const server = await readFile(new URL("../server/server.js", import.meta.url), "utf8");

  assert.match(sql, /on conflict \(bucket, subject_hash\) do update/);
  assert.match(sql, /security definer/);
  assert.match(sql, /revoke all on table public\.api_rate_limit_windows from anon, authenticated/);
  assert.match(server, /createHmac\("sha256"/);
  assert.match(server, /consumeDistributedRateLimit/);
  assert.doesNotMatch(sql, /ip_address|raw_ip/i);
});

test("expired distributed rate-limit windows are cleaned in bounded batches", async () => {
  const { readFile } = await import("node:fs/promises");
  const sql = await readFile(new URL("../supabase/migrations/202609200004_rate_limit_retention.sql", import.meta.url), "utf8");

  assert.match(sql, /api_rate_limit_windows_updated_idx/);
  assert.match(sql, /updated_at < v_now - interval '24 hours'/);
  assert.match(sql, /limit 1000/);
  assert.match(sql, /random\(\) < 0\.02/);
});

test("AI responses and microphone recordings have explicit cost ceilings", async () => {
  const { readFile } = await import("node:fs/promises");
  const server = await readFile(new URL("../server/server.js", import.meta.url), "utf8");
  const audio = await readFile(new URL("../src/audio.js", import.meta.url), "utf8");

  assert.match(server, /OPENAI_MAX_OUTPUT_TOKENS/);
  assert.equal((server.match(/max_output_tokens: MAX_AI_OUTPUT_TOKENS/g) || []).length, 4);
  assert.match(server, /Math\.min\(600/);
  assert.match(audio, /MAX_RECORDING_DURATION_MS = 45_000/);
  assert.match(audio, /automaticStopTimer = window\.setTimeout/);
});

test("paid and external providers have bounded waits and retries", async () => {
  const { readFile } = await import("node:fs/promises");
  const server = await readFile(new URL("../server/server.js", import.meta.url), "utf8");
  const uscis = await readFile(new URL("../server/uscisService.js", import.meta.url), "utf8");

  assert.match(server, /timeout: 30_000, maxRetries: 1/);
  assert.match(server, /AbortSignal\.timeout\(15_000\)/);
  assert.equal((uscis.match(/signal: AbortSignal\.timeout\(USCIS_REQUEST_TIMEOUT_MS\)/g) || []).length, 2);
});

test("failed provider attempts remain visible in cost telemetry", async () => {
  const { readFile } = await import("node:fs/promises");
  const server = await readFile(new URL("../server/server.js", import.meta.url), "utf8");

  assert.equal((server.match(/let providerAttempted = false/g) || []).length, 6);
  assert.equal((server.match(/if \(providerAttempted\) await recordProviderUsage/g) || []).length, 6);
  assert.match(server, /provider: "d-id", model: "agents-client-key"/);
  assert.match(server, /model: "gpt-4o-mini-transcribe"/);
});
