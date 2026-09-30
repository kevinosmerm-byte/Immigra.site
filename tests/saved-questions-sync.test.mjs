import test from "node:test";
import assert from "node:assert/strict";
import { queueSavedQuestion, syncSavedQuestions } from "../src/savedQuestions.js";

test("offline saved changes retry, unsaves persist and accounts stay separate", async () => {
  const originalStorage = globalThis.localStorage;
  const originalFetch = globalThis.fetch;
  const data = new Map();
  globalThis.localStorage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  const session = { user: { id: "alice" }, access_token: "test-token" };
  try {
    queueSavedQuestion("alice", 2, true);
    globalThis.fetch = async () => { throw Error("offline"); };
    await assert.rejects(syncSavedQuestions(session));
    assert.match(data.get("citizenshipai.saved-pending.v1:alice"), /"2"/);
    const writes = [];
    globalThis.fetch = async (url, options) => {
      if (options.method === "PUT") { writes.push(JSON.parse(options.body)); return { ok: true }; }
      return { ok: true, json: async () => [{ question_id: 2, test_version: "uscis-2025", saved: true }] };
    };
    assert.deepEqual(await syncSavedQuestions(session), [1]);
    assert.equal(writes[0].saved, true);
    assert.equal(data.get("citizenshipai.saved-pending.v1:alice"), "{}");
    queueSavedQuestion("alice", 2, false);
    queueSavedQuestion("bob", 8, true);
    await syncSavedQuestions(session);
    assert.equal(writes.at(-1).saved, false);
    assert.match(data.get("citizenshipai.saved-pending.v1:bob"), /"8"/);
  } finally { globalThis.localStorage = originalStorage; globalThis.fetch = originalFetch; }
});
