export const STORY_LIMITS = Object.freeze({ bytes: 10 * 1024 * 1024, pages: 40, characters: 30000 });

export function readStoryRequest(body) {
  if (body?.consent !== true) throw new Error("STORY_CONSENT_REQUIRED");
  if (!["es", "en"].includes(body.language)) throw new Error("STORY_LANGUAGE_REQUIRED");
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length < 30) throw new Error("STORY_TEXT_REQUIRED");
  if (text.length > STORY_LIMITS.characters) throw new Error("STORY_TOO_LONG");
  return { text, language: body.language };
}
