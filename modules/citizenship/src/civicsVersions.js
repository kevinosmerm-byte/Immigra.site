export const DEFAULT_TEST_VERSION = "uscis-2025";
export const TEST_VERSIONS = Object.freeze({
  [DEFAULT_TEST_VERSION]: Object.freeze({
    id: DEFAULT_TEST_VERSION,
    label: "2025 Civics Test",
    officialSource: "https://www.uscis.gov/citizenship/2025test",
  }),
});

export function getCivicsCategory(questionId) {
  if (questionId <= 14) return "principles";
  if (questionId <= 60) return "government";
  if (questionId <= 72) return "rights";
  if (questionId <= 118) return "history";
  return "symbols";
}
