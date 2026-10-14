import { Capacitor } from "@capacitor/core";
import { APP_IDENTITY } from "../shared/appIdentity.js";

// Production requests stay on the page's own domain and are relayed by the
// Cloudflare Pages Function in functions/api. Local development can still use
// a custom API target from .env.
const isLocalDevelopment = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const configuredBaseUrl = Capacitor.isNativePlatform()
  ? import.meta.env.VITE_NATIVE_API_BASE_URL || `${APP_IDENTITY.origin}/api`
  : isLocalDevelopment
  ? import.meta.env.VITE_API_BASE_URL || "/api"
  : "/api";
const API_BASE_URL = configuredBaseUrl.replace(/\/$/, "");
let aiRequestContext = null;
const METERED_AI_PATHS = new Set([
  "/evaluate",
  "/evaluate-writing",
  "/transcribe",
  "/evaluate-reading",
  "/coach",
  "/avatar/session",
]);

export function setAiRequestContext(context) {
  aiRequestContext = context?.feature || (context?.sessionId && context?.accessToken)
    ? {
        sessionId: context?.sessionId || "",
        accessToken: context?.accessToken || "",
        feature: context?.feature || "",
      }
    : null;
}

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function apiFetch(path, options) {
  const headers = new Headers(options?.headers || {});
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (aiRequestContext && METERED_AI_PATHS.has(normalizedPath)) {
    if (aiRequestContext.accessToken) headers.set("Authorization", `Bearer ${aiRequestContext.accessToken}`);
    if (aiRequestContext.sessionId) headers.set("X-Citizenship-AI-Session", aiRequestContext.sessionId);
    if (aiRequestContext.feature) headers.set("X-Citizenship-AI-Feature", aiRequestContext.feature);
  }
  return fetch(apiUrl(path), { ...options, headers });
}

export async function apiJson(path, options) {
  const reportedFeature = aiRequestContext?.feature;
  const response = await apiFetch(path, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status}).`);
  }

  if (typeof window !== "undefined" && ["/coach", "/evaluate-writing", "/evaluate-reading"].includes(path)) {
    const text = [payload.reply, payload.feedback, payload.correction, payload.encouragement].filter(item => typeof item === "string").join("\n").slice(0, 6000);
    if (text) window.dispatchEvent(new CustomEvent("immigra:ai-feedback", { detail: { text, feature: reportedFeature } }));
  }

  return payload;
}
