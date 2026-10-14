// Cloudflare Pages proxy. Keeping API calls under citizenshipai.us avoids
// browser extensions and privacy tools blocking the Render hostname.
const API_ORIGIN = "https://citizenshipai.onrender.com";

export async function onRequest(context) {
  const incomingUrl = new URL(context.request.url);
  const upstreamPath = incomingUrl.pathname.replace(/^\/api/, "") || "/";
  const configuredOrigin = context.env?.API_ORIGIN || API_ORIGIN;
  const origin = new URL(configuredOrigin);
  if (origin.protocol !== "https:" || origin.username || origin.password) return new Response("API configuration unavailable", { status: 503 });
  const upstreamUrl = new URL(upstreamPath + incomingUrl.search, origin.origin);
  const headers = new Headers(context.request.headers);

  headers.delete("host");
  headers.set("x-forwarded-host", incomingUrl.host);

  return fetch(upstreamUrl, {
    method: context.request.method,
    headers,
    body: ["GET", "HEAD"].includes(context.request.method)
      ? undefined
      : context.request.body,
    redirect: "follow",
  });
}
