import test from "node:test";
import assert from "node:assert/strict";

import {
  AI_FEATURE_ACCESS,
  FREE_AI_LIMITS,
  PROMOTION_ACCESS_CONFIG,
  PRO_PLAN,
  getAiFeatureConfig,
} from "../shared/featureAccessConfig.js";

test("launch promotion informs after two sessions without creating a hard paywall", () => {
  assert.equal(PROMOTION_ACCESS_CONFIG.promotionActive, true);
  assert.equal(PROMOTION_ACCESS_CONFIG.allowContinueWithoutPayment, true);
  assert.equal(PROMOTION_ACCESS_CONFIG.proAvailable, false);

  for (const [feature, config] of Object.entries(AI_FEATURE_ACCESS)) {
    assert.equal(config.freeSessions, 2, `${feature} should include two introductory sessions`);
    assert.equal(FREE_AI_LIMITS[feature], 2);
    assert.equal(getAiFeatureConfig(feature), config);
  }
});

test("approved Pro pricing is centralized but billing remains inactive", () => {
  assert.equal(PRO_PLAN.currency, "USD");
  assert.equal(PRO_PLAN.introductoryMonthlyPriceCents, 499);
  assert.equal(PRO_PLAN.regularMonthlyPriceCents, 599);
  assert.equal(PRO_PLAN.annualPriceCents, 4999);
  assert.equal(PRO_PLAN.billingAvailable, false);
  assert.equal(PROMOTION_ACCESS_CONFIG.proAvailable, false);
});

test("Pro allowances keep costly live-avatar usage bounded", () => {
  assert.equal(AI_FEATURE_ACCESS.coach.proMonthlyLimit, 30);
  assert.equal(AI_FEATURE_ACCESS.classicInterview.proMonthlyLimit, 15);
  assert.equal(AI_FEATURE_ACCESS.writing.proMonthlyLimit, 30);
  assert.equal(AI_FEATURE_ACCESS.speaking.proMonthlyLimit, 30);
  assert.equal(AI_FEATURE_ACCESS.realInterview.proMonthlyLimit, 1);
});

test("real interview never offers rewarded-ad access", () => {
  assert.equal(AI_FEATURE_ACCESS.realInterview.rewardedAdsEnabled, false);
  assert.equal(AI_FEATURE_ACCESS.coach.rewardedAdsEnabled, true);
});
