import test from "node:test";
import assert from "node:assert/strict";

import {
  AI_FEATURE_ACCESS,
  FREE_AI_LIMITS,
  PROMOTION_ACCESS_CONFIG,
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

test("real interview never offers rewarded-ad access", () => {
  assert.equal(AI_FEATURE_ACCESS.realInterview.rewardedAdsEnabled, false);
  assert.equal(AI_FEATURE_ACCESS.coach.rewardedAdsEnabled, true);
});
