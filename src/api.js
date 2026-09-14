const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
const API_BASE_URL = configuredBaseUrl.replace(/\/$/, "");

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options);
}
