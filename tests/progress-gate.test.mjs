import test from "node:test";
import assert from "node:assert/strict";
import { learningEntitlements, shouldOfferProgressGate } from "../shared/learningAccess.js";
test("free users cross the threshold only at safe transitions", () => {
  assert.equal(shouldOfferProgressGate({ completed: 69, total: 100, tier: "free" }), false);
  assert.equal(shouldOfferProgressGate({ completed: 70, total: 100, tier: "free" }), true);
  assert.equal(shouldOfferProgressGate({ completed: 70, total: 100, tier: "free", busy: true }), false);
});
test("Pro and previously notified sessions skip the gate", () => {
  assert.equal(shouldOfferProgressGate({ completed: 7, total: 10, tier: "pro" }), false);
  assert.equal(shouldOfferProgressGate({ completed: 8, total: 10, tier: "free", shown: true }), false);
});
test("no ad entitlement or paid status is invented", () => {
  assert.deepEqual(learningEntitlements(null), { tier: "free", adSupported: false });
  assert.equal(learningEntitlements({ tier: "pro" }).tier, "pro");
  assert.equal(shouldOfferProgressGate({ completed: 1, total: 0 }), false);
});
