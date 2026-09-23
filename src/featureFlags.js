export const featureFlags = Object.freeze({
  // Phase one: compute comparisons only. Never use shadow output for learner scheduling.
  tsFsrsShadow: import.meta.env.VITE_TS_FSRS_SHADOW === "true",
  tsFsrsActive: import.meta.env.VITE_TS_FSRS_ACTIVE === "true",
});

export function getSchedulerMode(flags = featureFlags) {
  if (flags.tsFsrsActive) return "ts-fsrs";
  if (flags.tsFsrsShadow) return "shadow";
  return "legacy";
}
