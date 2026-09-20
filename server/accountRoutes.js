import { Router } from "express";
import { randomUUID } from "node:crypto";
import {
  finishAiSession,
  getAccountConfiguration,
  getPublicAccountConfiguration,
  getUsageSnapshot,
  requireAccount,
  startAiSession,
} from "./accountService.js";
import { getAiFeatureConfig } from "../shared/featureAccessConfig.js";

const router = Router();
const IDEMPOTENCY_KEY_PATTERN = /^[a-zA-Z0-9._:-]{12,128}$/;

router.get("/status", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(getAccountConfiguration());
});

router.get("/public-config", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(getPublicAccountConfiguration());
});

router.use(requireAccount);

router.get("/usage", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json(await getUsageSnapshot(req.account.userId));
  } catch (error) {
    console.error("Account usage error", { message: error.message, cause: error.cause?.code });
    res.status(503).json({ error: "AI usage is temporarily unavailable.", code: "usage_unavailable" });
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
  if (!/^[0-9a-f-]{36}$/i.test(sessionId) || !["completed", "failed", "refunded"].includes(outcome)) {
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
