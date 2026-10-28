export const TRIAL_POLICY_VERSION = "seven_day_first_use_v1";
export const TRIAL_DAYS = 7;

export function isVerifiedPracticeAccess(access) {
  return access?.policyVersion === TRIAL_POLICY_VERSION && access.allowed === true
    && ["trial_active", "subscribed"].includes(access.status);
}

export function premiumFeatureForScreen(screen, mode = "full") {
  if (screen === "interview") return mode === "full" ? "realInterview" : "classicInterview";
  return ({ coach: "coach", writing: "writing", reading: "speaking" })[screen] || null;
}
