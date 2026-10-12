import test from "node:test";
import assert from "node:assert/strict";
import { getDailyAiLimit } from "../shared/featureAccessConfig.js";
import { isVerifiedPracticeAccess, premiumFeatureForScreen } from "../shared/trialPolicy.js";
test("authorization uses verified dates instead of daily practice quotas", () => {
  for (const source of ["free_trial", "pro_allowance", "launch_promotion", undefined]) assert.equal(getDailyAiLimit(source), null);
  assert.equal(isVerifiedPracticeAccess({ allowed: true, status: "trial_active" }), false);
  assert.equal(isVerifiedPracticeAccess({ policyVersion: "seven_day_first_use_v1", allowed: true, status: "trial_active" }), true);
  assert.equal(isVerifiedPracticeAccess({ policyVersion: "seven_day_first_use_v1", allowed: true, status: "trial_expired" }), false);
});
test("interviews and cost features require premium access; local study remains free", () => {
  for (const mode of ["n400", "civics", "full"]) assert.ok(premiumFeatureForScreen("interview",mode));
  for (const screen of ["coach","writing","reading"]) assert.ok(premiumFeatureForScreen(screen));
  for (const screen of ["civics","quiz","podcasts","vocabulary","preparation","immigrationHelp","profile","progress"]) assert.equal(premiumFeatureForScreen(screen),null);
});
