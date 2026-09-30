export const ACCESS_LEVELS = Object.freeze({ FREE: "free", AD_SUPPORTED: "ad_supported", PRO: "pro" });
export const LEARNING_FEATURES = Object.freeze({
  civics: "free", quiz: "free", vocabulary: "free", reading: "free", writing: "free",
  interview: "pro", coach: "pro", realInterview: "pro",
});
// Presentation policy only: costly API authorization remains server-authoritative.
export function learningEntitlements(snapshot) {
  return { tier: snapshot?.tier === "pro" ? "pro" : "free", adSupported: false };
}
export function shouldOfferProgressGate({ completed, total, tier, busy = false, shown = false }) {
  return tier !== "pro" && !busy && !shown && Number.isFinite(completed) && Number.isFinite(total) && total > 0 && completed / total >= 0.7;
}
