import { Capacitor } from "@capacitor/core";
import { apiUrl } from "./api.js";

export const GOOGLE_ADS_ID = "AW-17910999514";
export const PAID_SUBSCRIPTION_DESTINATION = "AW-17910999514/oryYCMy6yKkdENrT0NxC";
const sentKey = sessionId => `immigra.ads.paid-checkout.v1:${sessionId}`;
let googleTagPromise;

export function canTrackPaidWebCheckout({ search, accessToken, native = Capacitor.isNativePlatform() }) {
  if (native || !accessToken || typeof search !== "string") return null;
  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id") || "";
  return params.get("billing") === "success" && /^cs_live_[A-Za-z0-9]+$/.test(sessionId) ? sessionId : null;
}

export function loadGoogleAdsTag(doc = document) {
  if (googleTagPromise) return googleTagPromise;
  googleTagPromise = new Promise((resolve, reject) => {
    const win = doc.defaultView;
    if (!win) return reject(new Error("No browser context"));
    win.dataLayer = win.dataLayer || [];
    win.gtag = win.gtag || function gtag() { win.dataLayer.push(arguments); };
    win.gtag("js", new Date());
    win.gtag("config", GOOGLE_ADS_ID);
    const script = doc.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`;
    script.onload = resolve;
    script.onerror = () => { googleTagPromise = null; reject(new Error("Google tag unavailable")); };
    doc.head.appendChild(script);
  });
  return googleTagPromise;
}

export async function reportPaidSubscriptionConversion({ search, accessToken, storage = globalThis.localStorage, fetcher = fetch, doc = document } = {}) {
  const sessionId = canTrackPaidWebCheckout({ search, accessToken });
  if (!sessionId) return false;
  try {
    if (storage?.getItem(sentKey(sessionId))) return false;
  } catch { return false; } // Fail closed: cannot guard against duplicates.
  const response = await fetcher(`${apiUrl("/billing/paid-conversion")}?session_id=${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return false;
  const { conversion } = await response.json();
  if (!conversion || conversion.transaction_id !== sessionId || conversion.currency !== "USD"
    || !Number.isFinite(conversion.value) || conversion.value <= 0) return false;
  try {
    await loadGoogleAdsTag(doc);
    doc.defaultView.gtag("event", "conversion", {
      send_to: PAID_SUBSCRIPTION_DESTINATION,
      value: conversion.value,
      currency: conversion.currency,
      transaction_id: conversion.transaction_id,
    });
    storage?.setItem(sentKey(sessionId), "1");
    return true;
  } catch { return false; }
}
