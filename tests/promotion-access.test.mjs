import test from "node:test";
import assert from "node:assert/strict";

import {
  AI_FEATURE_ACCESS,
  FREE_AI_LIMITS,
  PROMOTION_ACCESS_CONFIG,
  PRO_PLAN,
  getAiFeatureConfig,
} from "../shared/featureAccessConfig.js";

test("seven-day policy replaces perpetual promotion and numeric quotas", () => {
  assert.equal(PROMOTION_ACCESS_CONFIG.promotionActive, false);
  assert.equal(PROMOTION_ACCESS_CONFIG.allowContinueWithoutPayment, false);
  assert.equal(PROMOTION_ACCESS_CONFIG.proAvailable, true);

  for (const [feature, config] of Object.entries(AI_FEATURE_ACCESS)) {
    assert.equal(config.freeSessions, null, `${feature} should include no count-based introductory limit`);
    assert.equal(FREE_AI_LIMITS[feature], null);
    assert.equal(getAiFeatureConfig(feature), config);
  }
});

test("approved Pro pricing is centralized but billing remains inactive", () => {
  assert.equal(PRO_PLAN.currency, "USD");
  assert.equal(PRO_PLAN.introductoryMonthlyPriceCents, 499);
  assert.equal(PRO_PLAN.regularMonthlyPriceCents, 599);
  assert.equal(PRO_PLAN.annualPriceCents, 4999);
  assert.equal(PRO_PLAN.billingAvailable, false);
  assert.equal(PROMOTION_ACCESS_CONFIG.proAvailable, true);
});

test("authorized practice has no monthly count quotas", () => {
  assert.equal(AI_FEATURE_ACCESS.coach.proMonthlyLimit, null);
  assert.equal(AI_FEATURE_ACCESS.classicInterview.proMonthlyLimit, null);
  assert.equal(AI_FEATURE_ACCESS.writing.proMonthlyLimit, null);
  assert.equal(AI_FEATURE_ACCESS.speaking.proMonthlyLimit, null);
  assert.equal(AI_FEATURE_ACCESS.realInterview.proMonthlyLimit, null);
});

test("real interview never offers rewarded-ad access", () => {
  assert.equal(AI_FEATURE_ACCESS.realInterview.rewardedAdsEnabled, false);
  assert.equal(AI_FEATURE_ACCESS.coach.rewardedAdsEnabled, false);
  for (const feature of ["__proto__", "constructor", "invalid"]) assert.equal(getAiFeatureConfig(feature), null);
});
