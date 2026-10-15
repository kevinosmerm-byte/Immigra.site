import {getBillingReadiness} from "./billingReadiness.js";
import {billingFailure} from "./billingErrors.js";
import { Router } from "express";
import { requireAccount, requireVerifiedAccount, isPracticePolicyReady } from "./accountService.js";
import { createCheckoutSession, createPortalSession } from "./stripeBilling.js";

export function createBillingRouter({ authenticate = requireAccount, verifyAccount = requireVerifiedAccount, policyReady = isPracticePolicyReady, checkout = createCheckoutSession, portal = createPortalSession, readiness = getBillingReadiness } = {}) {
const router = Router();
router.get("/status",async(_req,res)=>{res.set("Cache-Control","no-store");try{res.json(await readiness());}catch{res.status(503).json({enabled:false,ready:false,reason:"checkout_unavailable"});}});
router.use(authenticate);

router.post("/checkout-session", async (req, res) => {
  if (req.get('x-immigra-client') === 'native' || ['capacitor://localhost','https://localhost','http://localhost'].includes(req.get('origin'))) return res.status(403).json({ code: 'native_checkout_unavailable' });
  const interval = req.body?.interval;
  if (!["monthly", "annual"].includes(interval)) {
    return res.status(400).json({ error: "Choose a monthly or annual plan.", code: "invalid_billing_interval" });
  }
  try {
    if (!await policyReady()) return res.status(503).json({ error: "Subscription access is not ready yet.", code: "access_policy_unavailable" });
    const session = await checkout({ userId: req.account.userId, email: req.account.email, interval });
    res.set("Cache-Control", "no-store");
    return res.status(201).json(session);
  } catch (error) {
    const failure=billingFailure(error);console.error('Stripe Checkout error',failure);
    return res.status(failure.status).json({error:failure.code==='subscription_already_active'?'A Pro subscription is already active.':'Secure checkout is temporarily unavailable.',code:failure.code,reference:failure.reference});
  }
});

router.post("/portal-session", verifyAccount, async (req, res) => {
  try {
    const session = await portal({ userId: req.account.userId });
    res.set("Cache-Control", "no-store");
    return res.status(201).json(session);
  } catch (error) {
    const failure=billingFailure(error,'portal_unavailable');console.error('Stripe Portal error',failure);
    return res.status(failure.status).json({error:'Subscription management is temporarily unavailable.',code:failure.code,reference:failure.reference});
  }
});

return router;
}
export default createBillingRouter();
