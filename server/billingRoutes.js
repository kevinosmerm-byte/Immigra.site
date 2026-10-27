import { Router } from "express";
import { requireAccount, isPracticePolicyReady } from "./accountService.js";
import { createCheckoutSession, createPortalSession, verifyPaidCheckoutForAds } from "./stripeBilling.js";

const router = Router();
router.use(requireAccount);

router.post("/checkout-session", async (req, res) => {
  const interval = req.body?.interval;
  if (!["monthly", "annual"].includes(interval)) {
    return res.status(400).json({ error: "Choose a monthly or annual plan.", code: "invalid_billing_interval" });
  }
  try {
    if (!await isPracticePolicyReady()) return res.status(503).json({ error: "Subscription access is not ready yet.", code: "access_policy_unavailable" });
    const session = await createCheckoutSession({ userId: req.account.userId, email: req.account.email, interval });
    res.set("Cache-Control", "no-store");
    return res.status(201).json(session);
  } catch (error) {
    const conflict = error.code === "subscription_already_active";
    console.error("Stripe Checkout error", { code: error.code || "", message: error.message });
    return res.status(conflict ? 409 : 503).json({
      error: conflict ? "A Pro subscription is already active." : "Secure checkout is temporarily unavailable.",
      code: conflict ? error.code : "checkout_unavailable",
    });
  }
});

router.get("/paid-conversion", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const sessionId = req.query?.session_id;
  if (typeof sessionId !== "string" || !/^cs_live_[A-Za-z0-9]+$/.test(sessionId)) {
    return res.status(400).json({ code: "invalid_checkout_session" });
  }
  try {
    const conversion = await verifyPaidCheckoutForAds({ userId: req.account.userId, sessionId });
    return conversion ? res.json({ conversion }) : res.status(404).json({ code: "paid_checkout_not_verified" });
  } catch {
    return res.status(503).json({ code: "checkout_verification_unavailable" });
  }
});

router.post("/portal-session", async (req, res) => {
  try {
    const session = await createPortalSession({ userId: req.account.userId });
    res.set("Cache-Control", "no-store");
    return res.status(201).json(session);
  } catch (error) {
    const missing = error.code === "stripe_customer_not_found";
    console.error("Stripe Portal error", { code: error.code || "", message: error.message });
    return res.status(missing ? 404 : 503).json({
      error: missing ? "No Stripe subscription was found for this account." : "Subscription management is temporarily unavailable.",
      code: missing ? error.code : "portal_unavailable",
    });
  }
});

export default router;
