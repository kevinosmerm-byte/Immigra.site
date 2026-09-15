// Production requests stay on the page's own domain and are relayed by the
// Cloudflare Pages Function in functions/api. Local development can still use
// a custom API target from .env.
const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const configuredBaseUrl = isLocalDevelopment
  ? import.meta.env.VITE_API_BASE_URL || "/api"
  : "/api";
const API_BASE_URL = configuredBaseUrl.replace(/\/$/, "");

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options);
}

export async function apiJson(path, options) {
  const response = await apiFetch(path, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status}).`);
  }

  return payload;
}
