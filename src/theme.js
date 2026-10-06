export const THEME_STORAGE_KEY = "citizenshipai.theme.v1";
export const APPEARANCE_STORAGE_KEY = "citizenshipai.appearance.v2";
export const APPEARANCE_VERSION = "white-public-sans";
export const THEME_PREFERENCES = ["system", "light", "dark"];

export function normalizeThemePreference(value, fallback = "light") {
  return THEME_PREFERENCES.includes(value) ? value : fallback;
}

export function initialThemePreference(savedPreference, appearanceVersion) {
  // Apply the white redesign once, then respect subsequent choices in Settings.
  return appearanceVersion === APPEARANCE_VERSION
    ? normalizeThemePreference(savedPreference)
    : "light";
}

export function resolveTheme(preference, systemPrefersLight = false) {
  const normalized = normalizeThemePreference(preference);
  if (normalized === "system") return systemPrefersLight ? "light" : "dark";
  return normalized;
}
