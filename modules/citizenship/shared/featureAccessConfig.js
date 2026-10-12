export const PROMOTION_ACCESS_CONFIG = Object.freeze({
  promotionActive: false,
  allowContinueWithoutPayment: false,
  proAvailable: true,
  freeAllowanceType: "seven_day_first_use",
  trialDays: 7,
});

export const PRO_PLAN = Object.freeze({
  productKey: "citizenship_ai_pro",
  currency: "USD",
  regularMonthlyPriceCents: 599,
  introductoryMonthlyPriceCents: 499,
  annualPriceCents: 4999,
  billingAvailable: false,
  liveAvatarMonthlySessions: 1,
});

export const AI_FEATURE_ACCESS = Object.freeze({
  coach: Object.freeze({ label: "AI English Coach", freeSessions: null, rewardedAdsEnabled: false, proMonthlyLimit: null }),
  classicInterview: Object.freeze({ label: "Classic Civics Interview", freeSessions: null, rewardedAdsEnabled: false, proMonthlyLimit: null }),
  writing: Object.freeze({ label: "Writing AI", freeSessions: null, rewardedAdsEnabled: false, proMonthlyLimit: null }),
  speaking: Object.freeze({ label: "Speaking / Reading AI", freeSessions: null, rewardedAdsEnabled: false, proMonthlyLimit: null }),
  realInterview: Object.freeze({ label: "Real Interview", freeSessions: null, rewardedAdsEnabled: false, proMonthlyLimit: null }),
});

export const FREE_AI_LIMITS = Object.freeze(Object.fromEntries(
  Object.entries(AI_FEATURE_ACCESS).map(([feature, config]) => [feature, config.freeSessions])
));

export function getAiFeatureConfig(feature) {
  return Object.hasOwn(AI_FEATURE_ACCESS, feature) ? AI_FEATURE_ACCESS[feature] : null;
}

// Authorization is time-based. Burst protection is enforced separately.
export function getDailyAiLimit() { return null; }
