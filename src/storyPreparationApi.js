import { apiFetch } from "./api.js";
import { readStoryRequest } from "../shared/storyPractice.js";

export async function prepareStoryWithAi({ signal, ...input }) {
  const source = readStoryRequest(input);
  const response = await apiFetch("/story/prepare", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...source, consent: true }), signal,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error([401, 403].includes(response.status) ? "ACCESS_REQUIRED" : "STORY_SERVICE_UNAVAILABLE");
  return payload;
}
