import { authenticatedFetch } from "./authentication/fetch.mjs";
import { readStoryRequest } from "./storyPractice.js";

export async function prepareStoryWithAi({ signal, ...input }) {
  const { text, language } = readStoryRequest(input);
  const excerpts = [];
  const categoryLabels = language === "es" ? { date: "Fecha", place: "Lugar", event: "Evento", uncertainty: "Información que no recuerdas" } : { date: "Date", place: "Place", event: "Event", uncertainty: "Information you do not remember" };
  for (let offset = 0; offset < text.length; offset += 5000) {
    signal?.throwIfAborted();
    const part = text.slice(offset, offset + 5000);
    const response = await authenticatedFetch("/api/asylum/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal,
      body: JSON.stringify({ text: part, language, domain: "personal", source_id: `prepared-story-${offset}`, consent: true, consent_version: "ai-excerpts-v1" }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error([401, 403].includes(response.status) ? "ACCESS_REQUIRED" : "STORY_SERVICE_UNAVAILABLE");
    if (!Array.isArray(payload.excerpts) || payload.excerpts.some(item => typeof item.quote !== "string" || !part.includes(item.quote) || !Object.hasOwn(categoryLabels, item.category))) throw new Error("STORY_ANALYSIS_INVALID");
    excerpts.push(...payload.excerpts);
  }
  return { analysis: {
    summary: language === "es" ? `Leímos tu texto completo. La IA identificó ${excerpts.length} fragmentos para revisar; no son hechos confirmados ni una evaluación de tu caso.` : `We read your full text. AI identified ${excerpts.length} excerpts to review; these are not confirmed facts or an assessment of your case.`,
    topics: excerpts.map(item => ({ label: categoryLabels[item.category], quote: item.quote })),
    questions: [],
  } };
}
