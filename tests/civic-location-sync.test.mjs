import test from "node:test";
import assert from "node:assert/strict";
import { getCivicsQuestion } from "../src/civicsQuestionBank.js";
import { civicAddressIdentity, getCivicProfileForLocation } from "../src/civicProfile.js";
import { resolveCivicsQuestion } from "../src/dynamicCivicsData.js";
import { cancelCivicProfileRefresh, cancelCivicRefreshToken, captureCivicRefreshToken, refreshCivicProfile } from "../src/civicProfileSync.js";
import { readCivicProfile, saveCivicProfile, subscribeCivicProfile } from "../src/civicProfileStorage.js";

const profile = {
  state: { code: "AK", capital: "Juneau" }, zipCode: "99501", district: "00", congressionalDistrict: "00", districtStatus: "confirmed",
  representative: "Old district member", senators: ["Same-state senator"], governor: "Governor",
  stateSenator: { name: "Old state senator" }, stateRepresentative: { name: "Old state representative" },
  verifiedAt: "2020-01-01", addressUpdatedAt: "old", locationIdentity: "old-identity",
};
const now = Date.parse("2026-10-05T12:00:00Z");

function assertDistrictAnswersUnavailable(safe) {
  assert.equal(safe.district, null);
  assert.equal(safe.stateSenator, null);
  assert.equal(safe.stateRepresentative, null);
  assert.deepEqual(resolveCivicsQuestion(getCivicsQuestion(29), { profile: safe, now }).acceptedAnswers, []);
}

test("changing a personal address immediately gates old district answers in cards/quiz/interview while retaining same-state records", () => {
  const safe = getCivicProfileForLocation(profile, { userProfile: { streetAddress: "456 Changed Street", state: "Alaska", zipCode: "99502", addressUpdatedAt: "new" } });
  assertDistrictAnswersUnavailable(safe);
  assert.equal(safe.locationStatus, "changed");
  assert.deepEqual(safe.senators, profile.senators);
  assert.equal(safe.state.code, "AK");
  assert.deepEqual(resolveCivicsQuestion(getCivicsQuestion(23), { profile: safe, now }).acceptedAnswers, ["Same-state senator"]);
  assert.equal(profile.representative, "Old district member", "gating preserves the stored verification record");
});

test("changing state or ZIP without a confirmed same state cannot show or grade old statewide officials", () => {
  for (const userProfile of [{ state: "Texas", zipCode: "77001" }, { zipCode: "77001" }]) {
    const safe = getCivicProfileForLocation(profile, { userProfile });
    assertDistrictAnswersUnavailable(safe);
    assert.equal(safe.state, null);
    assert.deepEqual(resolveCivicsQuestion(getCivicsQuestion(23), { profile: safe, now }).acceptedAnswers, []);
    assert.deepEqual(resolveCivicsQuestion(getCivicsQuestion(61), { profile: safe, now }).acceptedAnswers, []);
  }
});

test("N400 address identity changes are gated without waiting for a provider or timestamp; age alone preserves verified facts", () => {
  const safe = getCivicProfileForLocation(profile, { n400Profile: { answers: { P_ADDRESS_CURRENT: "456 Other Street, City, AK 99501" } }, locationIdentity: "changed-identity" });
  assertDistrictAnswersUnavailable(safe);
  assert.strictEqual(getCivicProfileForLocation(profile, { userProfile: { state: "AK", zipCode: "99501" }, locationIdentity: "old-identity" }), profile);
  const checking = getCivicProfileForLocation(profile, { userProfile: { state: "AK", streetAddress: "Unverified current address", zipCode: "99501" }, identityPending: true });
  assertDistrictAnswersUnavailable(checking);
  assert.equal(checking.locationStatus, "checking");
});

test("same-account location synchronization deduplicates ongoing lookups and avoids calls for each question", async () => {
  const account = "sync-dedupe-test";
  const identity = await civicAddressIdentity("123 Known Street", "99501");
  let calls = 0, resolve;
  const readProfile = () => profile;
  const options = { now, readProfile, saveProfile: () => {}, fetchProfile: () => { calls += 1; return new Promise(done => { resolve = done; }); } };
  const input = { userKey: account, address: "123 Known Street", zipCode: "99501", locationIdentity: identity };
  const first = refreshCivicProfile(input, options), second = refreshCivicProfile(input, options);
  assert.equal(calls, 1);
  resolve(profile);
  assert.equal((await first).status, "updated");
  assert.equal((await second).status, "updated");
  assert.equal((await refreshCivicProfile(input, options)).status, "cooldown");
  assert.equal(calls, 1);
  cancelCivicProfileRefresh(account);
});

test("a late response for the previous address cannot overwrite the new location or another account", async () => {
  const account = "sync-race-test";
  let saved = null, oldResolve;
  const readProfile = () => saved;
  const saveProfile = next => { saved = next; };
  const old = refreshCivicProfile({ userKey: account, address: "Old address", zipCode: "99501", locationIdentity: "old" }, { now, readProfile, saveProfile, fetchProfile: () => new Promise(resolve => { oldResolve = resolve; }) });
  const latest = { ...profile, representative: "Current district member", locationIdentity: "new" };
  await refreshCivicProfile({ userKey: account, address: "New address", zipCode: "99502", locationIdentity: "new" }, { now: now + 1, readProfile, saveProfile, fetchProfile: async () => latest });
  oldResolve(profile);
  assert.equal((await old).status, "superseded");
  assert.strictEqual(saved, latest);
  cancelCivicProfileRefresh(account);
});

test("existing account-scoped civic store publishes updates and retains in-memory data if browser storage is unavailable", () => {
  let notifications = 0;
  const stop = subscribeCivicProfile(() => { notifications += 1; }, "civic-store-test-a");
  saveCivicProfile(profile, "civic-store-test-a");
  assert.strictEqual(readCivicProfile("civic-store-test-a"), profile);
  assert.equal(readCivicProfile("civic-store-test-b"), null);
  assert.equal(notifications, 1);
  stop();
});

test("device wipe clears inactive account civic snapshots before that account signs in again", () => {
  const originalAdd = globalThis.addEventListener, originalRemove = globalThis.removeEventListener;
  const handlers = new Map();
  globalThis.addEventListener = (type, handler) => { if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type).add(handler); };
  globalThis.removeEventListener = (type, handler) => handlers.get(type)?.delete(handler);
  const accountA = "civic-wipe-inactive-a", accountB = "civic-wipe-active-b";
  let stopA, stopB;
  try {
    stopA = subscribeCivicProfile(() => {}, accountA);
    saveCivicProfile(profile, accountA);
    stopA(); stopA = null;
    stopB = subscribeCivicProfile(() => {}, accountB);
    saveCivicProfile({ ...profile, zipCode: "77001" }, accountB);
    for (const handler of handlers.get("citizenshipai:local-data-cleared") || []) handler({ type: "citizenshipai:local-data-cleared" });
    assert.equal(readCivicProfile(accountA), null);
    assert.equal(readCivicProfile(accountB), null);
  } finally { stopA?.(); stopB?.(); globalThis.addEventListener = originalAdd; globalThis.removeEventListener = originalRemove; }
});

test("manual editor and central profile use one canonical address identity to avoid duplicate lookups", async () => {
  const manual = await civicAddressIdentity("123 Main, City, AK", "99501");
  const central = await civicAddressIdentity("123 Main, City, AK, 99501", "99501");
  assert.equal(manual, central);
});

test("a device clear during delayed identity hashing cannot register a lookup or resurrect civic data", async () => {
  const account = "civic-digest-clear-race";
  const requestToken = captureCivicRefreshToken(account);
  let finishDigest, requests = 0, saves = 0;
  const delayedDigest = new Promise(resolve => { finishDigest = resolve; });
  const pending = (async () => {
    const locationIdentity = await delayedDigest;
    return refreshCivicProfile({ userKey: account, address: "Old private address", zipCode: "99501", locationIdentity }, {
      requestToken, readProfile: () => null, fetchProfile: async () => { requests += 1; return profile; }, saveProfile: () => { saves += 1; },
    });
  })();
  cancelCivicProfileRefresh(account);
  finishDigest("old-address-hash");
  assert.equal((await pending).status, "cancelled");
  assert.equal(requests, 0);
  assert.equal(saves, 0);
});

test("unmounting a caller during an ongoing lookup prevents its result from saving", async () => {
  const account = "civic-unmount-save-race";
  const requestToken = captureCivicRefreshToken(account);
  let finishLookup, saves = 0;
  const pending = refreshCivicProfile({ userKey: account, address: "Private address", zipCode: "99501", locationIdentity: "old" }, {
    requestToken, readProfile: () => null, fetchProfile: () => new Promise(resolve => { finishLookup = resolve; }), saveProfile: () => { saves += 1; },
  });
  cancelCivicRefreshToken(requestToken);
  finishLookup(profile);
  assert.equal((await pending).status, "cancelled");
  assert.equal(saves, 0);
  cancelCivicProfileRefresh(account);
});

test("a newer same-account location cancels a prior lookup before save even while the next digest is pending", async () => {
  const account = "civic-location-epoch-race";
  let currentLocation = "old", finishLookup, saves = 0;
  const requestToken = captureCivicRefreshToken(account, { isCurrent: () => currentLocation === "old" });
  const pending = refreshCivicProfile({ userKey: account, address: "Old address", zipCode: "99501", locationIdentity: "old" }, {
    requestToken, readProfile: () => null, fetchProfile: () => new Promise(resolve => { finishLookup = resolve; }), saveProfile: () => { saves += 1; },
  });
  currentLocation = "new";
  finishLookup(profile);
  assert.equal((await pending).status, "cancelled");
  assert.equal(saves, 0);
  cancelCivicProfileRefresh(account);
});
