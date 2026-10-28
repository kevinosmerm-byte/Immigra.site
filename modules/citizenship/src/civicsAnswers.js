import official from "./data/uscis2025Civics.json" with { type: "json" };
// Compatibility view; do not maintain another answer list here.
export const civicsAnswers = official.questions.map(item => item.answers);
