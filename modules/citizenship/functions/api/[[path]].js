// Cloudflare Pages proxy. Keeping API calls under citizenshipai.us avoids
// browser extensions and privacy tools blocking the Render hostname.
const API_ORIGIN = "https://citizenshipai.onrender.com";

export async function onRequest(context) {
  const incomingUrl = new URL(context.request.url);
  const upstreamPath = incomingUrl.pathname.replace(/^\/api/, "") || "/";
  const upstreamUrl = new URL(upstreamPath + incomingUrl.search, API_ORIGIN);
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
