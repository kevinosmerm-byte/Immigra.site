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

test("privacy disclosure accurately describes content-free product telemetry", async () => {
  const { readFile } = await import("node:fs/promises");
  const legal = await readFile(new URL("../src/LegalSettings.jsx", import.meta.url), "utf8");

  assert.match(legal, /limited, account-linked product and cost telemetry/);
  assert.match(legal, /not to contain complete conversations, recordings, transcripts, practice answers, receipt numbers, or case details/);
  assert.match(legal, /Account panel exports account records, the explicitly saved encrypted profile and technical usage/);
  assert.match(legal, /asks you to agree before sending a snapshot/);
  assert.match(legal, /server encrypts personal, immigration, N-400 and journey data before saving/);
  assert.match(legal, /Browser storage is not an encrypted vault/);
  assert.match(legal, /Guardar el perfil en la nube es una acción separada y opcional/);
  assert.doesNotMatch(legal, /does not create user accounts|does not include a database|does not implement application analytics/);
});

test("product analytics are authenticated, allowlisted, and content-free", async () => {
  const { readFile } = await import("node:fs/promises");
  const service = await readFile(new URL("../server/accountService.js", import.meta.url), "utf8");
  const routes = await readFile(new URL("../server/accountRoutes.js", import.meta.url), "utf8");
  const promotion = await readFile(new URL("../src/PromotionAccess.jsx", import.meta.url), "utf8");

  assert.match(routes, /router\.use\(requireAccount\)[\s\S]*router\.post\("\/events"/);
  assert.match(service, /PRODUCT_EVENT_NAMES/);
  assert.match(service, /"paywall_viewed"/);
  assert.match(service, /metadata: \{\}/);
  assert.doesNotMatch(service, /conversationText|receiptNumber|audioBlob|transcriptText/);
  assert.match(promotion, /recordAccountEvent\("paywall_viewed", pending\.feature\)/);
});

test("reward credits require a server-verified, idempotent provider callback", async () => {
  const { readFile } = await import("node:fs/promises");
  const sql = await readFile(new URL("../supabase/migrations/202609200005_verified_reward_credits.sql", import.meta.url), "utf8");
  const service = await readFile(new URL("../server/accountService.js", import.meta.url), "utf8");
  const routes = await readFile(new URL("../server/accountRoutes.js", import.meta.url), "utf8");

  assert.match(sql, /security definer/);
  assert.match(sql, /on conflict \(verification_id\) do nothing/);
  assert.match(sql, /rewarded_ads_enabled/);
  assert.match(sql, /revoke all on function public\.grant_verified_reward_credit[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute[\s\S]*to service_role/);
  assert.match(service, /grantVerifiedRewardCredit/);
  assert.doesNotMatch(routes, /grantVerifiedRewardCredit|reward_credit_granted/);
});

test("subscription entitlements are provider-neutral, ordered, and server-only", async () => {
  const { readFile } = await import("node:fs/promises");
  const sql = await readFile(new URL("../supabase/migrations/202609200006_verified_entitlements.sql", import.meta.url), "utf8");
  const service = await readFile(new URL("../server/accountService.js", import.meta.url), "utf8");
  const routes = await readFile(new URL("../server/accountRoutes.js", import.meta.url), "utf8");

  assert.match(sql, /unique \(provider, provider_event_id\)/);
  assert.match(sql, /excluded\.provider_event_at >= public\.entitlements\.provider_event_at/);
  assert.match(sql, /on conflict \(provider, provider_event_id\) do nothing/);
  assert.match(sql, /revoke all on function public\.apply_verified_entitlement_event[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /to service_role/);
  assert.match(service, /applyVerifiedEntitlementEvent/);
  assert.doesNotMatch(routes, /applyVerifiedEntitlementEvent|providerEventId/);
});

test("costly AI endpoints honor remote and emergency feature switches", async () => {
  const { readFile } = await import("node:fs/promises");
  const service = await readFile(new URL("../server/accountService.js", import.meta.url), "utf8");
  const server = await readFile(new URL("../server/server.js", import.meta.url), "utf8");
  const api = await readFile(new URL("../src/api.js", import.meta.url), "utf8");
  const promotion = await readFile(new URL("../src/PromotionAccess.jsx", import.meta.url), "utf8");

  assert.match(service, /DISABLED_AI_FEATURES/);
  assert.match(service, /from\("ai_feature_config"\)[\s\S]*select\("enabled"\)/);
  assert.match(server, /app\.post\("\/evaluate", \(req, res\) =>/);
  assert.match(server, /requireAiFeature\("writing"\)/);
  assert.match(server, /requireAiFeature\("coach", \["coach", "realInterview"\]\)/);
  assert.match(server, /requireAiFeature\("realInterview"\)/);
  assert.match(server, /feature_check_unavailable/);
  assert.match(api, /X-Citizenship-AI-Feature/);
  assert.match(promotion, /isVerifiedPracticeAccess/);
});

test("direct provider calls require an authorized session after promotion ends", async () => {
  const { readFile } = await import("node:fs/promises");
  const service = await readFile(new URL("../server/accountService.js", import.meta.url), "utf8");
  const server = await readFile(new URL("../server/server.js", import.meta.url), "utf8");

  assert.doesNotMatch(service, /PROMOTION_ACCESS_OVERRIDE/);
  assert.match(service, /get_practice_access/);
  assert.match(service, /isVerifiedPracticeAccess/);
  assert.match(server, /requireAuthorizedAiAccess/);
  assert.match(server, /req\.aiSession\?\.id/);
  assert.match(server, /code: "ai_session_required"/);
  assert.equal((server.match(/requireAuthorizedAiAccess, (?:aiRateLimit|transcriptionRateLimit|avatarSessionRateLimit)/g) || []).length, 5);
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
  assert.match(account, /usage\?\.access\?\.allowed/);
  assert.match(account, /Sin cuotas/);
  assert.match(account, /trialEndsAt/);
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

test("account exports are authenticated, bounded, and include only the explicitly saved profile plus content-free usage", async () => {
  const { readFile } = await import("node:fs/promises");
  const routes = await readFile(new URL("../server/accountRoutes.js", import.meta.url), "utf8");
  const service = await readFile(new URL("../server/accountService.js", import.meta.url), "utf8");
  const account = await readFile(new URL("../src/Account.jsx", import.meta.url), "utf8");

  assert.match(routes, /router\.use\(requireAccount\)[\s\S]*router\.get\("\/export"/);
  assert.match(routes, /Content-Disposition/);
  assert.match(service, /exportAccountData/);
  assert.match(service, /\.limit\(1000\)/);
  assert.match(service, /brainProfile: brainProfile\?\.profile/);
  assert.match(service, /brainProfileExportAvailable/);
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
  assert.match(account, /Local study data remains on this device until you clear it in Settings/);
});

test("rate limits are shared atomically without storing raw IP addresses", async () => {
  const { readFile } = await import("node:fs/promises");
  const sql = await readFile(new URL("../supabase/migrations/202609200003_distributed_rate_limits.sql", import.meta.url), "utf8");
  const server = await readFile(new URL("../server/server.js", import.meta.url), "utf8");
  const accountService = await readFile(new URL("../server/accountService.js", import.meta.url), "utf8");

  assert.match(sql, /on conflict \(bucket, subject_hash\) do update/);
  assert.match(sql, /security definer/);
  assert.match(sql, /revoke all on table public\.api_rate_limit_windows from anon, authenticated/);
  assert.match(server, /createHmac\("sha256"/);
  assert.match(server, /consumeDistributedRateLimit/);
  assert.doesNotMatch(sql, /ip_address|raw_ip/i);
  assert.match(server, /causeCode: error\.cause\?\.code/);
  assert.match(server, /causeMessage: error\.cause\?\.message/);
  assert.match(accountService, /empty_rate_limit_result/);
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
  assert.equal((server.match(/max_output_tokens: MAX_AI_OUTPUT_TOKENS/g) || []).length, 3);
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

  assert.equal((server.match(/let providerAttempted = false/g) || []).length, 5);
  assert.equal((server.match(/if \(providerAttempted\) await recordProviderUsage/g) || []).length, 5);
  assert.match(server, /provider: "d-id", model: "agents-client-key"/);
  assert.match(server, /model: "gpt-4o-mini-transcribe"/);
});

test("unused rewarded credits are refunded atomically and only once", async () => {
  const { readFile } = await import("node:fs/promises");
  const sql = await readFile(new URL("../supabase/migrations/202609200007_reward_credit_failure_refunds.sql", import.meta.url), "utf8");

  assert.match(sql, /reward_credit_id uuid references public\.reward_credits/);
  assert.match(sql, /v_session\.source = 'reward_credit'/);
  assert.match(sql, /v_request_count = 0/);
  assert.match(sql, /least\(credits_granted, credits_remaining \+ 1\)/);
  assert.match(sql, /v_session\.status in \('completed', 'failed', 'refunded'\)/);
  assert.match(sql, /'creditRefunded', v_credit_refunded/);
});

test("automatic session closure refunds empty sessions and completes used sessions", async () => {
  const { readFile } = await import("node:fs/promises");
  const promotion = await readFile(new URL("../src/PromotionAccess.jsx", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const routes = await readFile(new URL("../server/accountRoutes.js", import.meta.url), "utf8");
  const service = await readFile(new URL("../server/accountService.js", import.meta.url), "utf8");

  assert.match(routes, /\["auto", "completed", "failed", "refunded"\]/);
  assert.match(service, /outcome === "auto"[\s\S]*telemetry\.requestCount > 0 \? "completed" : "refunded"/);
  assert.match(promotion, /finishAiSession\(current\.sessionId, "auto", \{ keepalive: true \}\)/);
  assert.match(promotion, /finishActiveAiSession\("auto",/);
  assert.match(app, /finishActiveAiSessionRef\.current\("auto"\)/);
});

test("explicit server access denials cannot fall through into an AI feature", async () => {
  const { readFile } = await import("node:fs/promises");
  const account = await readFile(new URL("../src/Account.jsx", import.meta.url), "utf8");
  const promotion = await readFile(new URL("../src/PromotionAccess.jsx", import.meta.url), "utf8");

  assert.match(account, /response\.status === 403 && decision\.allowed === false/);
  assert.match(account, /accessError\.decision = decision/);
  assert.match(promotion, /deny\(error\?\.decision\?\.reason/);
  assert.match(promotion, /isVerifiedPracticeAccess\(result\.access\)/);
  assert.match(promotion, /return deny\("access_unavailable"\)/);
  assert.doesNotMatch(promotion, /continuePromotion/);
});

test("the client follows the remote launch-promotion switch without a new release", async () => {
  const { readFile } = await import("node:fs/promises");
  const routes = await readFile(new URL("../server/accountRoutes.js", import.meta.url), "utf8");
  const account = await readFile(new URL("../src/Account.jsx", import.meta.url), "utf8");
  const promotion = await readFile(new URL("../src/PromotionAccess.jsx", import.meta.url), "utf8");

  assert.match(routes, /const \[promotionAccess, aiFeatures\] = await Promise\.all/);
  assert.match(routes, /isPromotionalAiAccessAllowed\(\)/);
  assert.match(account, /setPromotionAccess\(config\?\.promotionAccess !== false\)/);
  assert.match(account, /usage, promotionAccess/);
  assert.match(promotion, /!session\?\.access_token/);
  assert.match(promotion, /deny\("account_required"\)/);
});

test("remote AI feature switches reach the client before a feature opens", async () => {
  const { readFile } = await import("node:fs/promises");
  const service = await readFile(new URL("../server/accountService.js", import.meta.url), "utf8");
  const routes = await readFile(new URL("../server/accountRoutes.js", import.meta.url), "utf8");
  const account = await readFile(new URL("../src/Account.jsx", import.meta.url), "utf8");
  const promotion = await readFile(new URL("../src/PromotionAccess.jsx", import.meta.url), "utf8");

  assert.match(service, /getPublicAiFeatureAvailability/);
  assert.match(service, /Object\.keys\(AI_FEATURE_ACCESS\)/);
  assert.match(routes, /getPublicAiFeatureAvailability\(\)/);
  assert.match(routes, /aiFeatures,/);
  assert.match(account, /setAiFeatureAvailability\(config\?\.aiFeatures/);
  assert.match(promotion, /aiFeatureAvailability\?\.\[feature\] === false/);
  assert.match(promotion, /deny\("feature_unavailable"\)/);
});

test("the operations runbook documents safe shutdown and paid-launch gates", async () => {
  const { readFile } = await import("node:fs/promises");
  const architecture = await readFile(new URL("../docs/MONETIZATION_ARCHITECTURE.md", import.meta.url), "utf8");
  const runbook = await readFile(new URL("../docs/OPERATIONS_RUNBOOK.md", import.meta.url), "utf8");

  assert.match(architecture, /Abuse and recovery testing — complete/);
  assert.match(runbook, /DISABLED_AI_FEATURES/);
  assert.match(runbook, /practicePolicyReady/);
  assert.match(runbook, /A consumed rewarded credit is restored at most once/);
  assert.match(runbook, /Do not enable paid subscriptions or rewarded ads/);
  assert.doesNotMatch(runbook, /SUPABASE_SECRET_KEY\s*=|OPENAI_API_KEY\s*=|DID_API_KEY\s*=/);
});

test("production verification is recorded without claiming ads or payments are active", async () => {
  const { readFile } = await import("node:fs/promises");
  const runbook = await readFile(new URL("../docs/OPERATIONS_RUNBOOK.md", import.meta.url), "utf8");
  const ios = await readFile(new URL("../docs/IOS_READINESS.md", import.meta.url), "utf8");

  assert.match(runbook, /Verified September 20, 2026/);
  assert.match(runbook, /did not invoke OpenAI, D-ID, USCIS/);
  assert.match(runbook, /advertising and paid subscriptions remain intentionally inactive/);
  assert.match(ios, /verified in production/);
  assert.match(ios, /advertising and payments intentionally inactive/);
});
