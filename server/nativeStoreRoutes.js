import { Router } from "express";
import { requireAccount, isPracticePolicyReady, isNativeStoreSchemaReady } from "./accountService.js";
import { getNativeStoreConfiguration } from "./nativeStoreVerification.js";
import { syncNativePurchase } from "./nativeStoreService.js";

const router = Router();
router.get("/config", async (_req, res) => {
  res.set("Cache-Control", "no-store");
  const ready = await isPracticePolicyReady() && await isNativeStoreSchemaReady();
  const config = getNativeStoreConfiguration();
  res.json({ apple: { ...config.apple, enabled: ready && config.apple.enabled }, google: { ...config.google, enabled: ready && config.google.enabled } });
});
router.use(requireAccount);
router.post("/verify", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const { provider, reference } = req.body || {};
  if (!["apple", "google_play"].includes(provider) || typeof reference !== "string" || reference.length > 4096) return res.status(400).json({ code: "invalid_purchase_reference" });
  try {
    if (!await isPracticePolicyReady() || !await isNativeStoreSchemaReady()) return res.status(503).json({ code: "native_billing_unavailable" });
    return res.json(await syncNativePurchase({ userId: req.account.userId, provider, reference }));
  } catch (error) {
    const denied = ["purchase_owner_or_product_mismatch", "subscription_already_active", "test_purchase_not_allowed", "invalid_purchase_reference"].includes(error.message);
    return res.status(denied ? 403 : 503).json({ code: denied ? error.message : "purchase_verification_unavailable" });
  }
});
export default router;
