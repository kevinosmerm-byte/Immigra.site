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
