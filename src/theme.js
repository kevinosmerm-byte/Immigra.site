export const THEME_STORAGE_KEY = "citizenshipai.theme.v1";
export const THEME_PREFERENCES = ["system", "light", "dark"];

export function normalizeThemePreference(value, fallback = "dark") {
  return THEME_PREFERENCES.includes(value) ? value : fallback;
}

export function resolveTheme(preference, systemPrefersLight = false) {
  const normalized = normalizeThemePreference(preference);
  if (normalized === "system") return systemPrefersLight ? "light" : "dark";
  return normalized;
}
