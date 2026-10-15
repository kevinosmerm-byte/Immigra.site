import {getBillingReadiness} from "./billingReadiness.js";
import {billingFailure} from "./billingErrors.js";
import { Router } from "express";
import { requireAccount, requireVerifiedAccount, isPracticePolicyReady } from "./accountService.js";
import { createCheckoutSession, createPortalSession } from "./stripeBilling.js";

const router = Router();
router.get("/status",async(_req,res)=>{res.set("Cache-Control","no-store");try{res.json(await getBillingReadiness());}catch{res.status(503).json({enabled:false,ready:false,reason:"checkout_unavailable"});}});
router.use(requireAccount);
router.use(requireVerifiedAccount);

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
    const failure=billingFailure(error);console.error('Stripe Checkout error',failure);
    return res.status(failure.status).json({error:failure.code==='subscription_already_active'?'A Pro subscription is already active.':'Secure checkout is temporarily unavailable.',code:failure.code,reference:failure.reference});
  }
});

router.post("/portal-session", async (req, res) => {
  try {
    const session = await createPortalSession({ userId: req.account.userId });
    res.set("Cache-Control", "no-store");
    return res.status(201).json(session);
  } catch (error) {
    const failure=billingFailure(error,'portal_unavailable');console.error('Stripe Portal error',failure);
    return res.status(failure.status).json({error:'Subscription management is temporarily unavailable.',code:failure.code,reference:failure.reference});
  }
});

export default router;
