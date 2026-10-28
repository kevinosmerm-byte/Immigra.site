import test from "node:test";
import assert from "node:assert/strict";
import { saveModuleProgress, getModuleProgress, getContinueStudying, progressMetrics, migrateLegacyCivicsProgress, recordCivicsMistake } from "../src/progress.js";
const storage = () => { const data = new Map(); return { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) }; };
test("new learners have no invented progress", () => assert.equal(getContinueStudying("guest", storage()), null));
test("closing and reopening restores the exact next question and isolates accounts", () => {
  const store = storage();
  saveModuleProgress("civics", { completed: 48, total: 128, questionIndex: 48 }, "alice", store);
  assert.equal(getModuleProgress("alice", store).civics.questionIndex, 48);
  assert.equal(getContinueStudying("alice", store).progressPercentage, 37.5);
  assert.deepEqual(getModuleProgress("bob", store), {});
});
test("completed sessions do not appear in Continue Studying", () => {
  const store = storage();
  saveModuleProgress("quiz", { completed: 10, total: 10 }, "guest", store);
  assert.equal(getContinueStudying("guest", store), null);
});
test("storage errors and invalid metrics cannot break practice", () => {
  const store = { getItem() { throw Error(); }, setItem() { throw Error(); } };
  assert.deepEqual(getModuleProgress("guest", store), {});
  assert.equal(saveModuleProgress("writing", { completed: -1, total: 10 }, "guest", store).completed, 0);
  assert.equal(progressMetrics(100, 10).progressPercentage, 100);
});
test("resume records exclude transcripts, recordings and personal answers", () => {
  const saved = saveModuleProgress("interview", { completed: 1, total: 5, transcript: "private", answer: "private", recording: "private" }, "guest", storage());
  assert.equal(JSON.stringify(saved).includes("private"), false);
});

test("legacy viewed progress migrates once without altering original records", () => {
  const store = storage();
  store.setItem("civicsViewed", "[0,1,47,47,900]");
  const migrated = migrateLegacyCivicsProgress(128, "guest", store);
  assert.equal(migrated.completed, 3);
  assert.equal(migrated.questionIndex, 47);
  assert.equal(store.getItem("civicsViewed"), "[0,1,47,47,900]");
  saveModuleProgress("civics", { completed: 4, total: 128, questionIndex: 48 }, "guest", store);
  assert.equal(migrateLegacyCivicsProgress(128, "guest", store).questionIndex, 48);
  assert.equal(migrateLegacyCivicsProgress(128, "another-account", store), null);
});
test("mistakes from all practice modes share a persistent review collection", () => {
  const store = storage();
  assert.deepEqual(recordCivicsMistake(4, false, "alice", store), [4]);
  assert.deepEqual(recordCivicsMistake(4, false, "alice", store), [4]);
  assert.deepEqual(recordCivicsMistake(4, true, "alice", store), []);
  assert.deepEqual(recordCivicsMistake(2, false, "bob", store), [2]);
});
