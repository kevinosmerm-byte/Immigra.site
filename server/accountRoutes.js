import { Router } from "express";
import { randomUUID } from "node:crypto";
import {
  deleteAccount,
  exportAccountData,
  finishAiSession,
  getAccountConfiguration,
  getBillingIdentity,
  getPublicAccountConfiguration,
  getPublicAiFeatureAvailability,
  getUsageSnapshot,
  isPromotionalAiAccessAllowed,
  recordProductEvent,
  requireAccount,
  startAiSession,
  getPrivateProfileConfiguration,
  getAccountBrainProfile,
  setAccountBrainProfile,
  deleteAccountBrainProfile,
} from "./accountService.js";
import { getAiFeatureConfig } from "../shared/featureAccessConfig.js";
import { getBillingConfiguration } from "./stripeBilling.js";
import { getSavedQuestions, setSavedQuestion } from "./accountService.js";
import { getCivicsQuestion } from "../src/civicsQuestionBank.js";
import { DEFAULT_TEST_VERSION } from "../src/civicsVersions.js";

const router = Router();
const IDEMPOTENCY_KEY_PATTERN = /^[a-zA-Z0-9._:-]{12,128}$/;

router.get("/status", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(getAccountConfiguration());
});

router.get("/public-config", async (_req, res) => {
  res.set("Cache-Control", "no-store");
  const [promotionAccess, aiFeatures] = await Promise.all([
    isPromotionalAiAccessAllowed(),
    getPublicAiFeatureAvailability(),
  ]);
  res.json({
    ...getPublicAccountConfiguration(),
    promotionAccess,
    aiFeatures,
    billing: getBillingConfiguration(),
  });
});

router.use(requireAccount);

router.use("/brain-profile", (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
router.get("/brain-profile/status", (_req, res) => res.json(getPrivateProfileConfiguration()));
router.get("/brain-profile", async (req, res) => {
  try { res.json(await getAccountBrainProfile(req.account.userId)); }
  catch { res.status(503).json({ error: "Your secure profile could not be restored. Your local profile is unchanged.", code: "profile_storage_unavailable" }); }
});
router.put("/brain-profile", async (req, res) => {
  if (req.body?.consent !== true || !req.body?.profile || typeof req.body.profile !== "object" || Array.isArray(req.body.profile)) {
    return res.status(400).json({ error: "Confirm cloud storage and provide a profile.", code: "profile_consent_required" });
  }
  try { res.json(await setAccountBrainProfile(req.account.userId, req.body.profile)); }
  catch { res.status(503).json({ error: "Secure profile storage is unavailable. Your profile remains on this device.", code: "profile_storage_unavailable" }); }
});
router.delete("/brain-profile", async (req, res) => {
  if (req.body?.confirmation !== "DELETE_PROFILE") return res.status(400).json({ error: "Confirm removal of your cloud profile.", code: "profile_deletion_confirmation_required" });
  try { res.json(await deleteAccountBrainProfile(req.account.userId)); }
  catch { res.status(503).json({ error: "Your cloud profile could not be removed. Please try again.", code: "profile_deletion_unavailable" }); }
});

router.get("/saved-questions", async (req, res) => {
  res.set("Cache-Control", "no-store");
  try { res.json(await getSavedQuestions(req.account.userId)); }
  catch { res.status(503).json({ error: "Saved questions are temporarily unavailable." }); }
});

router.put("/saved-questions/:id", async (req, res) => {
  const version = req.body?.testVersion || DEFAULT_TEST_VERSION;
  const question = getCivicsQuestion(req.params.id, version);
  if (!question || typeof req.body?.saved !== "boolean") return res.status(400).json({ error: "A valid question and saved state are required." });
  try { await setSavedQuestion(req.account.userId, question.questionId, version, req.body.saved); res.status(204).end(); }
  catch { res.status(503).json({ error: "Your question remains saved on this device. Cloud sync is temporarily unavailable." }); }
});

router.post("/events", async (req, res) => {
  try {
    await recordProductEvent({
      userId: req.account.userId,
      eventName: typeof req.body?.eventName === "string" ? req.body.eventName.trim() : "",
      feature: typeof req.body?.feature === "string" ? req.body.feature.trim() : "",
    });
    return res.status(204).end();
  } catch (error) {
    const unsupported = error.message === "Unsupported product event.";
    if (!unsupported) console.error("Product event error", { message: error.message, cause: error.cause?.code });
    return res.status(unsupported ? 400 : 503).json({
      error: unsupported ? "Unsupported product event." : "Product analytics are temporarily unavailable.",
      code: unsupported ? "invalid_product_event" : "analytics_unavailable",
    });
  }
});

router.get("/usage", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json(await getUsageSnapshot(req.account.userId));
  } catch (error) {
    console.error("Account usage error", { message: error.message, cause: error.cause?.code });
    res.status(503).json({ error: "AI usage is temporarily unavailable.", code: "usage_unavailable" });
  }
});

router.get("/export", async (req, res) => {
  try {
    const payload = await exportAccountData(req.account.userId);
    res.set({
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="citizenship-ai-account-${new Date().toISOString().slice(0, 10)}.json"`,
      "Content-Type": "application/json; charset=utf-8",
    });
    res.send(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error("Account export error", { message: error.message, cause: error.cause?.code });
    res.status(503).json({ error: "Your account data could not be exported.", code: "export_unavailable" });
  }
});

router.delete("/", async (req, res) => {
  if (req.body?.confirmation !== "DELETE") {
    return res.status(400).json({ error: "Account deletion requires confirmation.", code: "deletion_confirmation_required" });
  }
  try {
    const billingIdentity = await getBillingIdentity(req.account.userId);
    if (billingIdentity?.provider === "stripe" && ["active", "grace"].includes(billingIdentity.status)) {
      return res.status(409).json({
        error: "Cancel the active web subscription in the billing portal before deleting this account.",
        code: "active_subscription_requires_cancellation",
      });
    }
    res.set("Cache-Control", "no-store");
    await deleteAccount(req.account.userId);
    return res.json({ deleted: true });
  } catch (error) {
    console.error("Account deletion error", { message: error.message, cause: error.cause?.code });
    return res.status(503).json({ error: "Your account could not be deleted.", code: "deletion_unavailable" });
  }
});

router.post("/sessions", async (req, res) => {
  const feature = typeof req.body?.feature === "string" ? req.body.feature.trim() : "";
  const providedKey = typeof req.body?.idempotencyKey === "string" ? req.body.idempotencyKey.trim() : "";
  const idempotencyKey = providedKey || randomUUID();

  if (!getAiFeatureConfig(feature)) {
    return res.status(400).json({ error: "Unknown AI feature.", code: "invalid_feature" });
  }
  if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    return res.status(400).json({ error: "Invalid idempotency key.", code: "invalid_idempotency_key" });
  }

  try {
    res.set("Cache-Control", "no-store");
    const decision = await startAiSession({ userId: req.account.userId, feature, idempotencyKey });
    return res.status(decision?.allowed ? 201 : 403).json(decision);
  } catch (error) {
    console.error("AI session start error", { feature, message: error.message, cause: error.cause?.code });
    return res.status(503).json({ error: "The AI session could not be started.", code: "session_start_unavailable" });
  }
});

router.post("/sessions/:sessionId/finish", async (req, res) => {
  const sessionId = req.params.sessionId;
  const outcome = req.body?.outcome;
  if (!/^[0-9a-f-]{36}$/i.test(sessionId) || !["auto", "completed", "failed", "refunded"].includes(outcome)) {
    return res.status(400).json({ error: "Invalid session result.", code: "invalid_session_result" });
  }

  try {
    res.set("Cache-Control", "no-store");
    res.json(await finishAiSession({ userId: req.account.userId, sessionId, outcome }));
  } catch (error) {
    console.error("AI session finish error", { sessionId, message: error.message, cause: error.cause?.code });
    res.status(503).json({ error: "The AI session result could not be saved.", code: "session_finish_unavailable" });
  }
});

export default router;
