export const PROMOTION_ACCESS_CONFIG = Object.freeze({
  promotionActive: true,
  allowContinueWithoutPayment: true,
  proAvailable: false,
  freeAllowanceType: "launch_trial",
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
  coach: Object.freeze({ label: "AI English Coach", freeSessions: 2, rewardedAdsEnabled: true, proMonthlyLimit: 30 }),
  classicInterview: Object.freeze({ label: "Classic Civics Interview", freeSessions: 2, rewardedAdsEnabled: true, proMonthlyLimit: 15 }),
  writing: Object.freeze({ label: "Writing AI", freeSessions: 2, rewardedAdsEnabled: true, proMonthlyLimit: 30 }),
  speaking: Object.freeze({ label: "Speaking / Reading AI", freeSessions: 2, rewardedAdsEnabled: true, proMonthlyLimit: 30 }),
  realInterview: Object.freeze({ label: "Real Interview", freeSessions: 2, rewardedAdsEnabled: false, proMonthlyLimit: PRO_PLAN.liveAvatarMonthlySessions }),
});

export const FREE_AI_LIMITS = Object.freeze(Object.fromEntries(
  Object.entries(AI_FEATURE_ACCESS).map(([feature, config]) => [feature, config.freeSessions])
));

export function getAiFeatureConfig(feature) {
  return AI_FEATURE_ACCESS[feature] || null;
}
