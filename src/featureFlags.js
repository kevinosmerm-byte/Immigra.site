import { SpacedRepetitionEngine } from "./learning.js";

const env = import.meta.env || {};

export const featureFlags = Object.freeze({
  // Phase one: compute comparisons only. Never use shadow output for learner scheduling.
  tsFsrsShadow: env.VITE_TS_FSRS_SHADOW === "true",
  tsFsrsActive: env.VITE_TS_FSRS_ACTIVE === "true",
});

export function getSchedulerMode(flags = featureFlags) {
  if (flags.tsFsrsActive) return "ts-fsrs";
  if (flags.tsFsrsShadow) return "shadow";
  return "legacy";
}

export function createConfiguredScheduler({ fsrsAdapter = null, flags = featureFlags, onShadowResult } = {}) {
  const mode = getSchedulerMode(flags);
  return new SpacedRepetitionEngine({
    fsrsAdapter: mode === "legacy" ? null : fsrsAdapter,
    shadowMode: mode !== "ts-fsrs",
    onShadowResult,
  });
}
