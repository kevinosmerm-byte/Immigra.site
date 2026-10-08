import test from "node:test";
import assert from "node:assert/strict";
import { getDailyAiLimit } from "../shared/featureAccessConfig.js";
test("promotional and untrusted sources have finite free ceilings", () => {
  assert.equal(getDailyAiLimit("launch_promotion"), 60);
  assert.equal(getDailyAiLimit("pro"), 60);
  assert.equal(getDailyAiLimit(undefined, true), 2);
});
test("only server-verified Pro session sources receive higher ceilings", () => {
  assert.equal(getDailyAiLimit("pro_allowance"), 600);
  assert.equal(getDailyAiLimit("pro_allowance", true), 6);
});
