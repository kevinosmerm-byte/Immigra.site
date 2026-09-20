import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY?.trim();

const supabase = supabaseUrl && supabaseSecretKey
  ? createClient(supabaseUrl, supabaseSecretKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })
  : null;
const STALE_AI_SESSION_HOURS = Math.max(1, Number(process.env.AI_SESSION_STALE_HOURS) || 6);

export function getAccountConfiguration() {
  return {
    provider: "supabase",
    configured: Boolean(supabase),
  };
}

export function getPublicAccountConfiguration() {
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  return {
    provider: "supabase",
    configured: Boolean(supabaseUrl && publishableKey),
    url: supabaseUrl || "",
    publishableKey: publishableKey || "",
  };
}

function bearerToken(req) {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

export async function requireAccount(req, res, next) {
  if (!supabase) {
    return res.status(503).json({ error: "Account service is not configured yet.", code: "account_unavailable" });
  }

  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Sign in is required.", code: "authentication_required" });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) {
    return res.status(401).json({ error: "Your session is invalid or expired.", code: "invalid_session" });
  }

  req.account = { userId: data.user.id };
  next();
}

export async function attachOptionalAiSession(req, res, next) {
  const sessionId = (req.get("x-citizenship-ai-session") || "").trim();
  if (!sessionId) return next();
  if (!/^[0-9a-f-]{36}$/i.test(sessionId) || !supabase) {
    return res.status(401).json({ error: "The AI session is invalid.", code: "invalid_ai_session" });
  }

  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Sign in is required for this AI session.", code: "authentication_required" });
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user?.id) {
    return res.status(401).json({ error: "Your session is invalid or expired.", code: "invalid_session" });
  }

  const { data: aiSession, error } = await supabase
    .from("ai_sessions")
    .select("id, feature, status")
    .eq("id", sessionId)
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (error || !aiSession || !["reserved", "started"].includes(aiSession.status)) {
    return res.status(403).json({ error: "The AI session is not active.", code: "inactive_ai_session" });
  }

  const requestedFeature = (req.get("x-citizenship-ai-feature") || "").trim();
  if (requestedFeature && requestedFeature !== aiSession.feature) {
    return res.status(403).json({ error: "The AI session does not match this feature.", code: "ai_session_feature_mismatch" });
  }

  req.aiSession = { id: aiSession.id, feature: aiSession.feature, userId: authData.user.id };
  res.set("X-Citizenship-AI-Session-Verified", "true");
  return next();
}

function throwDatabaseError(error, fallback) {
  if (!error) return;
  const wrapped = new Error(fallback);
  wrapped.cause = error;
  throw wrapped;
}

export async function getUsageSnapshot(userId) {
  const { data, error } = await supabase.rpc("get_ai_usage_snapshot", { p_user_id: userId });
  throwDatabaseError(error, "Unable to read AI usage.");
  return data;
}

export async function exportAccountData(userId) {
  const [profileResult, entitlementResult, sessionsResult, rewardsResult] = await Promise.all([
    supabase.from("user_profiles").select("created_at, updated_at").eq("user_id", userId).maybeSingle(),
    supabase.from("entitlements").select("tier, status, provider, period_start, period_end, updated_at").eq("user_id", userId).maybeSingle(),
    supabase.from("ai_sessions")
      .select("id, feature, source, status, started_at, completed_at, failed_at, request_count, input_tokens, output_tokens, transcription_seconds, provider, model")
      .eq("user_id", userId).order("started_at", { ascending: false }).limit(1000),
    supabase.from("reward_credits")
      .select("feature, source, credits_granted, credits_remaining, created_at, expires_at, consumed_at")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(1000),
  ]);

  throwDatabaseError(profileResult.error, "Unable to export account profile.");
  throwDatabaseError(entitlementResult.error, "Unable to export account entitlement.");
  throwDatabaseError(sessionsResult.error, "Unable to export AI sessions.");
  throwDatabaseError(rewardsResult.error, "Unable to export reward credits.");

  return {
    exportedAt: new Date().toISOString(),
    accountId: userId,
    profile: profileResult.data || null,
    entitlement: entitlementResult.data || null,
    aiSessions: sessionsResult.data || [],
    rewardCredits: rewardsResult.data || [],
    privacyNote: "This export contains account and technical usage records only. Citizenship AI does not include conversation, recording, or transcript content in its usage ledger.",
  };
}

export async function startAiSession({ userId, feature, idempotencyKey }) {
  await reconcileStaleAiSessions(userId);
  const { data, error } = await supabase.rpc("start_ai_session", {
    p_user_id: userId,
    p_feature: feature,
    p_idempotency_key: idempotencyKey,
  });
  throwDatabaseError(error, "Unable to start AI session.");
  return data;
}

export async function reconcileStaleAiSessions(userId) {
  const staleBefore = new Date(Date.now() - STALE_AI_SESSION_HOURS * 60 * 60 * 1000).toISOString();
  const { data: sessions, error } = await supabase
    .from("ai_sessions")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["reserved", "started"])
    .lt("started_at", staleBefore)
    .limit(20);
  throwDatabaseError(error, "Unable to reconcile abandoned AI sessions.");

  for (const session of sessions || []) {
    const { count, error: countError } = await supabase
      .from("usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("session_id", session.id)
      .eq("event_name", "ai_provider_request");
    throwDatabaseError(countError, "Unable to inspect abandoned AI session usage.");
    await finishAiSession({
      userId,
      sessionId: session.id,
      outcome: count > 0 ? "completed" : "refunded",
    });
  }
}

export async function finishAiSession({ userId, sessionId, outcome }) {
  const { data: events, error: eventsError } = await supabase
    .from("usage_events")
    .select("metadata")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .eq("event_name", "ai_provider_request");
  throwDatabaseError(eventsError, "Unable to summarize AI usage.");
  const telemetry = (events || []).reduce((total, event) => {
    const metadata = event?.metadata || {};
    total.requestCount += Math.max(0, Number(metadata.requestCount) || 0);
    total.inputTokens += Math.max(0, Number(metadata.inputTokens) || 0);
    total.outputTokens += Math.max(0, Number(metadata.outputTokens) || 0);
    total.transcriptionSeconds += Math.max(0, Number(metadata.transcriptionSeconds) || 0);
    if (!total.provider && metadata.provider) total.provider = String(metadata.provider).slice(0, 40);
    if (!total.model && metadata.model) total.model = String(metadata.model).slice(0, 80);
    return total;
  }, { provider: "", model: "", requestCount: 0, inputTokens: 0, outputTokens: 0, transcriptionSeconds: 0 });
  const { data, error } = await supabase.rpc("finish_ai_session", {
    p_user_id: userId,
    p_session_id: sessionId,
    p_outcome: outcome,
    p_telemetry: telemetry,
  });
  throwDatabaseError(error, "Unable to finish AI session.");
  return data;
}

export async function recordAiUsageEvent({ aiSession, provider, model, usage = {} }) {
  if (!supabase || !aiSession?.id || !aiSession?.userId) return;
  const metadata = {
    provider: String(provider || "").slice(0, 40),
    model: String(model || "").slice(0, 80),
    requestCount: 1,
    inputTokens: Math.max(0, Number(usage.inputTokens) || 0),
    outputTokens: Math.max(0, Number(usage.outputTokens) || 0),
    transcriptionSeconds: Math.max(0, Number(usage.transcriptionSeconds) || 0),
  };
  const { error } = await supabase.from("usage_events").insert({
    user_id: aiSession.userId,
    session_id: aiSession.id,
    event_name: "ai_provider_request",
    feature: aiSession.feature,
    metadata,
  });
  throwDatabaseError(error, "Unable to record AI provider usage.");
}
