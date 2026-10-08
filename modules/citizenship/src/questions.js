import official from "./data/uscis2025Civics.json" with { type: "json" };
// Compatibility view; the uploaded USCIS document is the only English source.
export const civicsQuestions = official.questions.map(item => ({ id: item.id, english: item.question, spanish: item.spanish }));
