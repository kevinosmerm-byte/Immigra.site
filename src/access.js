const STORAGE_KEY = "citizenshipai.ai-usage.v1";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const FREE_AI_LIMITS = {
  reading: 8,
  writing: 8,
  coach: 12,
  interview: 3,
};

function isValidUsageEvent(event) {
  return event
    && Object.prototype.hasOwnProperty.call(FREE_AI_LIMITS, event.feature)
    && typeof event.at === "number";
}

function readUsageEvents() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const cutoff = Date.now() - WEEK_MS;
    return Array.isArray(value)
      ? value.filter((event) => isValidUsageEvent(event) && event.at >= cutoff)
      : [];
  } catch {
    return [];
  }
}

function writeUsageEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // The feature remains available when browser storage is unavailable.
  }
}

export function getAiUsageSummary() {
  const events = readUsageEvents();
  const features = Object.fromEntries(Object.entries(FREE_AI_LIMITS).map(([feature, limit]) => {
    const used = events.filter((event) => event.feature === feature).length;
    return [feature, { limit, used, remaining: Math.max(0, limit - used) }];
  }));
  return { features };
}

export function canUseAiFeature(feature) {
  return getAiUsageSummary().features[feature]?.remaining > 0;
}

export function recordAiUsage(feature) {
  if (!Object.prototype.hasOwnProperty.call(FREE_AI_LIMITS, feature)) return getAiUsageSummary();
  const events = readUsageEvents();
  const alreadyUsed = events.filter((event) => event.feature === feature).length;
  if (alreadyUsed >= FREE_AI_LIMITS[feature]) return getAiUsageSummary();
  writeUsageEvents([...events, { feature, at: Date.now() }]);
  return getAiUsageSummary();
}

export function clearAiUsage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}
