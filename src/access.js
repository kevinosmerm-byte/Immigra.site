import { AI_FEATURE_ACCESS, FREE_AI_LIMITS, getAiFeatureConfig } from "../shared/featureAccessConfig.js";

// Promotional counters are intentionally local-only. They inform the launch
// experience but never represent a paid entitlement or authoritative balance.
const PROMO_SESSION_STORAGE_KEY = "citizenshipai.ai-sessions.promo.v1";

function isValidSessionEvent(event) {
  return event
    && Object.prototype.hasOwnProperty.call(AI_FEATURE_ACCESS, event.feature)
    && typeof event.at === "number";
}

function readSessionEvents() {
  try {
    const value = JSON.parse(localStorage.getItem(PROMO_SESSION_STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter(isValidSessionEvent).slice(-250) : [];
  } catch {
    return [];
  }
}

function writeSessionEvents(events) {
  try {
    localStorage.setItem(PROMO_SESSION_STORAGE_KEY, JSON.stringify(events.slice(-250)));
  } catch {
    // Promotional access remains available when browser storage is unavailable.
  }
}

export function getAiUsageSummary() {
  const events = readSessionEvents();
  const features = Object.fromEntries(Object.entries(AI_FEATURE_ACCESS).map(([feature, config]) => {
    const sessionsStarted = events.filter((event) => event.feature === feature).length;
    const includedUsed = Math.min(sessionsStarted, config.freeSessions);
    return [feature, {
      limit: config.freeSessions,
      used: includedUsed,
      sessionsStarted,
      remaining: Math.max(0, config.freeSessions - includedUsed),
    }];
  }));
  return { features };
}

export function shouldShowPromotionNotice(feature) {
  const config = getAiFeatureConfig(feature);
  if (!config) return false;
  return (getAiUsageSummary().features[feature]?.sessionsStarted || 0) >= config.freeSessions;
}

export function recordAiSessionStart(feature) {
  if (!getAiFeatureConfig(feature)) return getAiUsageSummary();
  writeSessionEvents([...readSessionEvents(), { feature, at: Date.now() }]);
  return getAiUsageSummary();
}

// Compatibility exports while server-authoritative accounts are introduced.
export function canUseAiFeature(feature) {
  return Boolean(getAiFeatureConfig(feature));
}

export const recordAiUsage = recordAiSessionStart;
export { FREE_AI_LIMITS };

export function clearAiUsage() {
  try {
    localStorage.removeItem(PROMO_SESSION_STORAGE_KEY);
    // Preserve the legacy key until the user explicitly clears app data.
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}
