import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import multer from "multer";
import { createHmac } from "node:crypto";
import { fetchUscisCaseStatus, getUscisConfig, maskReceiptNumber } from "./uscisService.js";
import accountRoutes from "./accountRoutes.js";
import { attachOptionalAiSession, consumeDistributedRateLimit, recordAiUsageEvent } from "./accountService.js";

dotenv.config();

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin is not allowed by CORS."));
  }
}));
app.use(express.json({ limit: "256kb" }));
app.use(attachOptionalAiSession);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});
// Start the API even before AI credentials are configured. AI endpoints return
// a clear 503 response until OPENAI_API_KEY is added in the hosting provider.
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30_000, maxRetries: 1 })
  : null;

const MAX_TEXT_LENGTH = 5_000;
const MAX_HISTORY_ITEMS = 12;
const MAX_AI_OUTPUT_TOKENS = Math.max(64, Math.min(600, Number(process.env.OPENAI_MAX_OUTPUT_TOKENS) || 220));
// Use a public API model by default. It can be changed in Render without a
// code deployment by setting OPENAI_TEXT_MODEL.
const OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
const DID_API_KEY = process.env.DID_API_KEY?.trim();
const DID_AGENT_ID = process.env.DID_AGENT_ID?.trim();
const DID_ALLOWED_ORIGINS = (process.env.DID_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
const DID_CLIENT_KEY_TTL_SECONDS = 300;
const rateLimitBuckets = new Map();
const RATE_LIMIT_HASH_SECRET = process.env.RATE_LIMIT_HASH_SECRET?.trim()
  || process.env.SUPABASE_SECRET_KEY?.trim()
  || "citizenship-ai-local-rate-limit";
const uscisManualRefreshes = new Map();
const configuredUscisCooldown = Number(process.env.USCIS_MANUAL_COOLDOWN_SECONDS || 60);
const USCIS_MANUAL_COOLDOWN_MS = Math.max(15, Number.isFinite(configuredUscisCooldown) ? configuredUscisCooldown : 60) * 1000;

function requestRateLimit(name, limit, windowMs) {
  return async (req, res, next) => {
    const forwardedIp = req.get("cf-connecting-ip") || req.ip || "unknown";
    const key = `${name}:${forwardedIp}`;
    const now = Date.now();
    const subjectHash = createHmac("sha256", RATE_LIMIT_HASH_SECRET).update(forwardedIp).digest("hex");

    try {
      const shared = await consumeDistributedRateLimit({
        bucket: name,
        subjectHash,
        limit,
        windowSeconds: Math.ceil(windowMs / 1000),
      });
      if (shared) {
        res.set("X-RateLimit-Remaining", String(Math.max(0, Number(shared.remaining) || 0)));
        if (!shared.allowed) {
          res.set("Retry-After", String(Math.max(1, Number(shared.retryAfterSeconds) || 1)));
          return res.status(429).json({ error: "Too many requests. Please wait a few minutes and try again." });
        }
        return next();
      }
    } catch (error) {
      console.error("Shared rate limit unavailable; using local fallback", { bucket: name, message: error.message });
    }

    if (rateLimitBuckets.size > 1_000) {
      for (const [bucketKey, bucket] of rateLimitBuckets) {
        if (now - bucket.startedAt >= windowMs) rateLimitBuckets.delete(bucketKey);
      }
    }
    const existing = rateLimitBuckets.get(key);
    const active = existing && now - existing.startedAt < windowMs
      ? existing
      : { startedAt: now, count: 0 };

    active.count += 1;
    rateLimitBuckets.set(key, active);

    if (active.count > limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - active.startedAt)) / 1000));
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests. Please wait a few minutes and try again." });
    }

    next();
  };
}

const aiRateLimit = requestRateLimit("ai", 30, 10 * 60 * 1000);
const transcriptionRateLimit = requestRateLimit("transcription", 10, 10 * 60 * 1000);
const uscisRateLimit = requestRateLimit("uscis", 15, 10 * 60 * 1000);
const avatarSessionRateLimit = requestRateLimit("avatar-session", 6, 10 * 60 * 1000);
const accountRateLimit = requestRateLimit("account", 30, 10 * 60 * 1000);

function enforceUscisManualCooldown(req, res) {
  const requester = req.get("cf-connecting-ip") || req.ip || "unknown";
  const now = Date.now();
  const nextAllowedAt = uscisManualRefreshes.get(requester) || 0;
  if (nextAllowedAt > now) {
    const retryAfterSeconds = Math.max(1, Math.ceil((nextAllowedAt - now) / 1000));
    res.set("Retry-After", String(retryAfterSeconds));
    res.status(429).json({ error: `Please wait ${retryAfterSeconds} seconds before checking again.` });
    return false;
  }
  uscisManualRefreshes.set(requester, now + USCIS_MANUAL_COOLDOWN_MS);
  if (uscisManualRefreshes.size > 1_000) {
    for (const [key, allowedAt] of uscisManualRefreshes) {
      if (allowedAt <= now) uscisManualRefreshes.delete(key);
    }
  }
  return true;
}

function readText(value, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function readAnswer(value) {
  if (Array.isArray(value)) {
    return value.map((item) => readText(item, 1_000)).filter(Boolean).join("; ");
  }
  return readText(value);
}

function requireOpenAI(res) {
  if (openai) return true;
  res.status(503).json({ error: "AI service is not configured." });
  return false;
}

function getDidConfiguration() {
  return {
    configured: Boolean(DID_API_KEY && DID_AGENT_ID && DID_ALLOWED_ORIGINS.length),
    agentId: DID_AGENT_ID || null,
  };
}

function normalizeOrigin(origin) {
  return typeof origin === "string" ? origin.trim().replace(/\/$/, "") : "";
}

function parseModelJson(output) {
  const json = output.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error("The AI response did not include JSON.");
  return JSON.parse(json);
}

function safeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-MAX_HISTORY_ITEMS).flatMap((entry) => {
    const role = entry?.role === "assistant" ? "assistant" : entry?.role === "user" ? "user" : null;
    const content = readText(entry?.content, 1_000);
    return role && content ? [{ role, content }] : [];
  });
}

async function recordProviderUsage(req, { provider, model, usage, transcriptionSeconds }) {
  if (!req.aiSession) return;
  try {
    await recordAiUsageEvent({
      aiSession: req.aiSession,
      provider,
      model,
      usage: {
        inputTokens: usage?.input_tokens,
        outputTokens: usage?.output_tokens,
        transcriptionSeconds,
      },
    });
  } catch (error) {
    // Metering must never interrupt a paid provider response or the launch promotion.
    console.error("AI usage metering error", { sessionId: req.aiSession.id, message: error.message });
  }
}

app.post("/evaluate", aiRateLimit, async (req, res) => {
  let providerAttempted = false;
  try {
    if (!requireOpenAI(res)) return;
    const question = readText(req.body?.question, 1_000);
    const answer = readText(req.body?.answer, 1_000);
    const correctAnswer = readAnswer(req.body?.correctAnswer);
    if (!question || !answer || !correctAnswer) {
      return res.status(400).json({ error: "Question, answer, and accepted answers are required." });
    }

    providerAttempted = true;
    const response = await openai.responses.create({
      model: OPENAI_TEXT_MODEL,
      max_output_tokens: MAX_AI_OUTPUT_TOKENS,
      instructions: `
You are an evaluator for a U.S. naturalization interview practice application.

Evaluate the applicant's answer to the civics question.

Return ONLY valid JSON with this exact structure:
{
  "status": "correct" | "incorrect" | "incomplete",
  "action": "advance" | "retry" | "repeat",
  "feedback": "short explanation"
}

Do not reveal the correct answer.

Judge the meaning of the applicant's answer, not exact wording.
Use the accepted answers as the reference for evaluating the applicant's response.
Accept semantically equivalent answers even when the wording is different.
If the applicant gives the key idea but the answer is missing an important part, classify it as incomplete.
If the answer is wrong or contradicts the accepted answers, classify it as incorrect.
Choose the action according to these rules:

- correct → advance
- incomplete → retry
- incorrect → repeat

Keep the feedback short and appropriate for a real interview.
`,
      input: `
Question:
${question}

Applicant's answer:
${answer}

Accepted answers:
${correctAnswer}
`,
    });

   const result = parseModelJson(response.output_text);
   await recordProviderUsage(req, { provider: "openai", model: OPENAI_TEXT_MODEL, usage: response.usage });

if (!result.action) {
  if (result.status === "correct") {
    result.action = "advance";
  } else if (result.status === "incomplete") {
    result.action = "retry";
  } else if (result.status === "incorrect") {
    result.action = "repeat";
  }
}

res.json(result);
  } catch (error) {
    if (providerAttempted) await recordProviderUsage(req, { provider: "openai", model: OPENAI_TEXT_MODEL }).catch(() => {});
    console.error(error);

    res.status(500).json({
      status: "error",
      feedback: "Unable to evaluate the answer."
    });
  }
});
app.post("/evaluate-writing", aiRateLimit, async (req, res) => {
  let providerAttempted = false;
  try {
    if (!requireOpenAI(res)) return;
    const sentence = readText(req.body?.sentence, 1_000);
    const answer = readText(req.body?.answer, 1_000);
    if (!sentence || !answer) {
      return res.status(400).json({ error: "Sentence and answer are required." });
    }

    providerAttempted = true;
    const response = await openai.responses.create({
      model: OPENAI_TEXT_MODEL,
      max_output_tokens: MAX_AI_OUTPUT_TOKENS,

      instructions: `
You are an English writing evaluator for a U.S. naturalization interview practice application.

Compare the original sentence with the applicant's written answer.

Evaluate:
- spelling
- missing words
- extra words
- changed words
- grammar
- whether the sentence has the same meaning
- overall writing accuracy

Return ONLY valid JSON with this exact structure:

{
  "score": number,
  "accuracy": "Excellent" | "Good" | "Needs Practice",
  "feedback": "short feedback"
}

The score must be from 0 to 100.

Use these guidelines:
- Excellent: 90-100
- Good: 70-89
- Needs Practice: 0-69

Do not require exact punctuation if the meaning and words are correct.

Keep feedback short, clear, and encouraging.
`,

      input: `
Original sentence:
${sentence}

Applicant's written answer:
${answer}
`,
    });

    const result = parseModelJson(response.output_text);
    await recordProviderUsage(req, { provider: "openai", model: OPENAI_TEXT_MODEL, usage: response.usage });

    res.json(result);

  } catch (error) {
    if (providerAttempted) await recordProviderUsage(req, { provider: "openai", model: OPENAI_TEXT_MODEL }).catch(() => {});
    console.error("Writing evaluation error:", error);

    res.status(500).json({
      error: "Unable to evaluate writing."
    });
  }
});
app.post("/transcribe", transcriptionRateLimit, upload.single("audio"), async (req, res) => {
  let providerAttempted = false;
  try {
    if (!requireOpenAI(res)) return;
    if (!req.file) {
      return res.status(400).json({
        error: "Audio file is required."
      });
    }

    if (!req.file.mimetype.startsWith("audio/")) {
      return res.status(415).json({
        error: "Only audio files are accepted."
      });
    }

    const audioFile = new File(
      [req.file.buffer],
      req.file.originalname || "reading.webm",
      {
        type: req.file.mimetype || "audio/webm"
      }
    );

    providerAttempted = true;
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "gpt-4o-mini-transcribe",
      language: "en"
    });

    await recordProviderUsage(req, { provider: "openai", model: "gpt-4o-mini-transcribe", usage: transcription.usage });

    res.json({
      transcript: transcription.text
    });

  } catch (error) {
    if (providerAttempted) await recordProviderUsage(req, { provider: "openai", model: "gpt-4o-mini-transcribe" }).catch(() => {});
    console.error("Reading transcription error:", error);

    res.status(500).json({
      error: "Unable to transcribe audio."
    });
  }
});
app.get("/", (req, res) => {
  res.json({
    message: "Citizenship AI server is running"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Account and AI-session accounting are introduced behind configuration. The
// current launch promotion remains available until Supabase is configured.
app.use("/account", accountRateLimit, accountRoutes);
app.use("/api/account", accountRateLimit, accountRoutes);

app.post("/evaluate-reading", aiRateLimit, async (req, res) => {
  let providerAttempted = false;
  try {
    if (!requireOpenAI(res)) return;
    const sentence = readText(req.body?.sentence, 1_000);
    const transcript = readText(req.body?.transcript, 2_000);
    if (!sentence || !transcript) {
      return res.status(400).json({ error: "Sentence and transcript are required." });
    }

    providerAttempted = true;
    const response = await openai.responses.create({
      model: OPENAI_TEXT_MODEL,
      max_output_tokens: MAX_AI_OUTPUT_TOKENS,

      instructions: `
You are an English reading evaluator for a U.S. naturalization interview practice application.

Compare the original sentence with what the applicant said.

Evaluate:
- whether the applicant read all the words
- missing words
- extra words
- changed words
- overall reading accuracy

Return ONLY valid JSON with this exact structure:

{
  "score": number,
  "accuracy": "Excellent" | "Good" | "Needs Practice",
  "feedback": "short feedback",
  "missingWords": [],
  "changedWords": []
}

The score must be from 0 to 100.

Do not evaluate accent or pronunciation from text alone.
Do not invent pronunciation problems.

Keep feedback short and encouraging.
`,

      input: `
Original sentence:
${sentence}

Applicant transcript:
${transcript}
`,
    });

    const result = parseModelJson(response.output_text);
    await recordProviderUsage(req, { provider: "openai", model: OPENAI_TEXT_MODEL, usage: response.usage });

    res.json(result);

  } catch (error) {
    if (providerAttempted) await recordProviderUsage(req, { provider: "openai", model: OPENAI_TEXT_MODEL }).catch(() => {});
    console.error("Reading evaluation error:", error);

    res.status(500).json({
      error: "Unable to evaluate reading."
    });
  }
});
app.post("/coach", aiRateLimit, async (req, res) => {
  let providerAttempted = false;
  try {
    if (!requireOpenAI(res)) return;
    const message = readText(req.body?.message, 2_000);
    const history = safeHistory(req.body?.history);
    if (!message) {
      return res.status(400).json({ error: "A message is required." });
    }

    providerAttempted = true;
    const response = await openai.responses.create({
      model: OPENAI_TEXT_MODEL,
      max_output_tokens: MAX_AI_OUTPUT_TOKENS,

      instructions: `
You are Sarah, an AI English Coach inside a U.S. citizenship preparation application.

Your job is to help the student practice natural spoken English.

Rules:
- Speak naturally and encouragingly.
- Use clear American English.
- Keep responses short and conversational.
- Ask ONE follow-up question at a time.
- Correct important grammar or vocabulary mistakes, but do not overwhelm the student.
- If the student's English is understandable but imperfect, continue the conversation naturally.
- Do not pretend to be a real USCIS officer.
- Do not provide legal advice.
- This is English practice, not a real immigration interview.

Return ONLY valid JSON:

{
  "reply": "what Sarah should say",
  "correction": "short correction or empty string",
  "encouragement": "short encouraging message"
}
`,

      input: `
      Conversation history:
${JSON.stringify(history)}

Student's latest message:
${message}
`,
    });

    const result = parseModelJson(response.output_text);
    await recordProviderUsage(req, { provider: "openai", model: OPENAI_TEXT_MODEL, usage: response.usage });

    res.json(result);

  } catch (error) {
    if (providerAttempted) await recordProviderUsage(req, { provider: "openai", model: OPENAI_TEXT_MODEL }).catch(() => {});
    console.error("Coach AI error:", error);

    res.status(500).json({
      error: "Unable to connect to AI Coach."
    });
  }
});
// D-ID is optional. Its private API key stays on this server; browsers receive
// only a short-lived client key after the server verifies their exact origin.
app.get("/avatar/status", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ provider: "d-id", configured: getDidConfiguration().configured });
});

app.post("/avatar/session", avatarSessionRateLimit, async (req, res) => {
  let providerAttempted = false;
  try {
    const config = getDidConfiguration();
    if (!config.configured) {
      return res.status(503).json({ error: "The live avatar pilot is not configured yet." });
    }

    const requestOrigin = normalizeOrigin(req.get("origin"));
    if (!requestOrigin || !DID_ALLOWED_ORIGINS.includes(requestOrigin)) {
      return res.status(403).json({ error: "This origin is not permitted to start an avatar session." });
    }

    providerAttempted = true;
    const didResponse = await fetch(
      `https://api.d-id.com/agents/${encodeURIComponent(config.agentId)}/client-keys`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(DID_API_KEY, "utf8").toString("base64")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          allowed_domains: DID_ALLOWED_ORIGINS,
          name: "citizenshipai-live-practice",
          ttl_seconds: DID_CLIENT_KEY_TTL_SECONDS,
        }),
        signal: AbortSignal.timeout(15_000),
      }
    );

    const didPayload = await didResponse.json().catch(() => ({}));
    if (!didResponse.ok || !didPayload.client_key) {
      await recordProviderUsage(req, { provider: "d-id", model: "agents-client-key" });
      console.error("D-ID client-key request failed", { status: didResponse.status });
      return res.status(502).json({ error: "The live avatar service could not start. Please continue with the standard practice interview." });
    }

    await recordProviderUsage(req, { provider: "d-id", model: "agents-client-key" });

    res.set("Cache-Control", "no-store");
    return res.json({
      provider: "d-id",
      agentId: config.agentId,
      clientKey: didPayload.client_key,
      expiresInSeconds: DID_CLIENT_KEY_TTL_SECONDS,
    });
  } catch (error) {
    if (providerAttempted) await recordProviderUsage(req, { provider: "d-id", model: "agents-client-key" }).catch(() => {});
    console.error("D-ID avatar session error", { message: error.message });
    return res.status(502).json({ error: "The live avatar service could not start. Please continue with the standard practice interview." });
  }
});

function classifyUscisFailure(error) {
  const status = Number(error?.status) || 500;
  if (status === 401 || status === 403) return "authentication";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status === 503) return "configuration";
  return status >= 500 ? "upstream_or_server" : "request";
}

function logUscisAuditEvent(event, details = {}) {
  const record = {
    timestamp: new Date().toISOString(),
    event,
    ...details,
  };
  const writer = event === "case_lookup_failed" ? console.error : console.info;
  writer("USCIS_CASE_LOOKUP_AUDIT", record);
}

app.post("/uscis-case-status", uscisRateLimit, async (req, res) => {
  const startedAt = Date.now();
  const receiptNumber = readText(req.body?.receiptNumber, 13).toUpperCase();
  let config = null;
  res.set("Cache-Control", "no-store");

  try {
    if (!/^[A-Z]{3}\d{10}$/.test(receiptNumber)) {
      return res.status(400).json({
        error: "Enter a valid 13-character USCIS receipt number."
      });
    }

    config = getUscisConfig();
    const auditContext = {
      environment: config.mode,
      sandboxTestData: config.isSandbox,
      receipt: maskReceiptNumber(receiptNumber),
    };
    logUscisAuditEvent("case_lookup_started", auditContext);

    if (!enforceUscisManualCooldown(req, res)) {
      logUscisAuditEvent("case_lookup_failed", {
        ...auditContext,
        httpStatus: 429,
        category: "rate_limited",
        durationMs: Date.now() - startedAt,
      });
      return;
    }

    const result = await fetchUscisCaseStatus(receiptNumber);
    logUscisAuditEvent("case_lookup_success", {
      ...auditContext,
      httpStatus: 200,
      durationMs: Date.now() - startedAt,
      traceId: result.tracker.traceId,
    });
    res.json(result);

  } catch (error) {
    const status = error.status || 500;
    logUscisAuditEvent("case_lookup_failed", {
      environment: config?.mode || "unconfigured",
      sandboxTestData: config?.isSandbox ?? null,
      receipt: receiptNumber ? maskReceiptNumber(receiptNumber) : "not_provided",
      httpStatus: status,
      category: classifyUscisFailure(error),
      durationMs: Date.now() - startedAt,
      traceId: error.traceId,
    });
    res.status(status).json({
      error: error.message === "USCIS_ENV must be sandbox or production."
        ? "USCIS environment is not configured correctly."
        : error.message || "We couldn't check USCIS right now. Please try again later.",
    });
  }
});

app.use((error, req, res, _next) => {
  if (error.type === "entity.too.large" || error.status === 413 || error.statusCode === 413) {
    return res.status(413).json({ error: "Request body must be 256 KB or smaller." });
  }
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Audio must be 10 MB or smaller." });
  }
  if (error.message === "Origin is not allowed by CORS.") {
    return res.status(403).json({ error: "Origin is not allowed." });
  }
  console.error("Unhandled server error:", error);
  return res.status(500).json({ error: "Unexpected server error." });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Citizenship AI server running on port ${PORT}`);
});
