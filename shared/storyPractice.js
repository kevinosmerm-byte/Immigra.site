export const STORY_LIMITS = Object.freeze({ bytes: 10 * 1024 * 1024, pages: 40, characters: 40000 });

export function readStoryRequest(body) {
  if (body?.consent !== true) throw new Error("STORY_CONSENT_REQUIRED");
  if (!["es", "en"].includes(body.language)) throw new Error("STORY_LANGUAGE_REQUIRED");
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length < 30) throw new Error("STORY_TEXT_REQUIRED");
  if (text.length > STORY_LIMITS.characters) throw new Error("STORY_TOO_LONG");
  return { text, language: body.language };
}

export function validateStoryAnalysis(value, text) {
  const clean = input => typeof input === "string" ? input.trim() : "";
  const normalize = input => clean(input).normalize("NFKC").replace(/\s+/g, " ");
  const source = normalize(text);
  if (!clean(value?.summary) || value.summary.length > 1800 || !Array.isArray(value?.topics)
    || value.topics.length < 1 || value.topics.length > 5 || !Array.isArray(value?.questions)
    || value.questions.length < 3 || value.questions.length > 6) throw new Error("STORY_ANALYSIS_INVALID");
  const topics = value.topics.map(topic => {
    const label = clean(topic?.label), quote = clean(topic?.quote);
    if (!label || label.length > 120 || quote.length < 8 || quote.length > 500 || !source.includes(normalize(quote))) throw new Error("STORY_ANALYSIS_INVALID");
    return { label, quote };
  });
  const questions = value.questions.map(clean);
  if (questions.some(question => !question || question.length > 400)
    || new Set(questions.map(normalize)).size !== questions.length) throw new Error("STORY_ANALYSIS_INVALID");
  return { summary: clean(value.summary), topics, questions };
}
