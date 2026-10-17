import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { isVerifiedPracticeAccess, TRIAL_POLICY_VERSION } from "../shared/trialPolicy.js";
import { AI_FEATURE_ACCESS, getAiFeatureConfig } from "../shared/featureAccessConfig.js";
import { getBrainProfile, setBrainProfile, deleteBrainProfile, getBrainProfileConfiguration } from "./brainProfileService.js";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY?.trim();

const supabase = supabaseUrl && supabaseSecretKey
  ? createClient(supabaseUrl, supabaseSecretKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })
  : null;
const STALE_AI_SESSION_HOURS = Math.max(1, Number(process.env.AI_SESSION_STALE_HOURS) || 6);
const FEATURE_AVAILABILITY_CACHE_MS = 30_000;
const featureAvailabilityCache = new Map();
const disabledAiFeatures = new Set((process.env.DISABLED_AI_FEATURES || "").split(",").map((item) => item.trim()).filter(Boolean));


export function getAccountConfiguration() {
  return {
    provider: "supabase",
    configured: Boolean(supabase),
  };
}

export function getPrivateProfileConfiguration() { return getBrainProfileConfiguration(); }
export async function getAccountBrainProfile(userId) { return getBrainProfile(supabase, userId); }
export async function setAccountBrainProfile(userId, profile) { return setBrainProfile(supabase, userId, profile); }
export async function deleteAccountBrainProfile(userId) { return deleteBrainProfile(supabase, userId); }

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

export async function isAiFeatureEnabled(feature) {
  if (!getAiFeatureConfig(feature) || disabledAiFeatures.has(feature)) return false;
  if (!supabase) return true;
  const cached = featureAvailabilityCache.get(feature);
  if (cached && cached.expiresAt > Date.now()) return cached.enabled;
  const { data, error } = await supabase
    .from("ai_feature_config")
    .select("enabled")
    .eq("feature", feature)
    .maybeSingle();
  if (error) {
    console.error("Remote AI feature configuration unavailable; using the local enabled state", {
      feature,
      code: error.code || "",
    });
    return true;
  }
  const enabled = data?.enabled !== false;
  featureAvailabilityCache.set(feature, { enabled, expiresAt: Date.now() + FEATURE_AVAILABILITY_CACHE_MS });
  return enabled;
}

export async function isPromotionalAiAccessAllowed() { return false; }

export async function getPracticeAccess(userId) {
  const { data, error } = await supabase.rpc("get_practice_access", { p_user_id: userId });
  throwDatabaseError(error, "Unable to verify practice access.");
  return data;
}

export async function isPracticePolicyReady() {
  if (!supabase) return false;
  try { return (await getPracticeAccess(null))?.policyVersion === TRIAL_POLICY_VERSION; }
  catch { return false; }
}

export async function getPublicAiFeatureAvailability() {
  const entries = await Promise.all(
    Object.keys(AI_FEATURE_ACCESS).map(async (feature) => [feature, await isAiFeatureEnabled(feature)])
  );
  return Object.fromEntries(entries);
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

  req.account = { userId: data.user.id, email: data.user.email || "" };
  next();
}

export async function getBillingIdentity(userId) {
  if (!supabase) throw new Error("Account service is not configured.");
  const { data, error } = await supabase
    .from("entitlements")
    .select("tier, status, provider, provider_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  throwDatabaseError(error, "Unable to read subscription identity.");
  return data ? {
    tier: data.tier,
    status: data.status,
    provider: data.provider,
    providerCustomerId: data.provider_customer_id,
  } : null;
}

export async function attachOptionalAiSession(req, res, next) {
  // Only the platform's signed-cookie middleware can attach this server-side marker.
  if (req.demoVerified && req.aiSession?.source === 'guest_demo') return next();
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
    .select("id, feature, status, source")
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

  let access;
  try { access = await getPracticeAccess(authData.user.id); }
  catch { return res.status(503).json({ error: "Practice access could not be verified.", code: "access_check_unavailable" }); }
  if (!isVerifiedPracticeAccess(access)) return res.status(403).json({ error: "Your trial has ended. A subscription is required.", code: "trial_expired" });

  req.aiSession = { id: aiSession.id, feature: aiSession.feature, userId: authData.user.id, source: aiSession.source };
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
  if (data?.access?.policyVersion !== TRIAL_POLICY_VERSION) throw new Error("The seven-day access policy is not installed.");
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
  const savedQuestions = await getSavedQuestions(userId).catch(() => null);
  const brainProfile = await getAccountBrainProfile(userId).catch(() => null);

  return {
    exportedAt: new Date().toISOString(),
    accountId: userId,
    profile: profileResult.data || null,
    entitlement: entitlementResult.data || null,
    aiSessions: sessionsResult.data || [],
    rewardCredits: rewardsResult.data || [],
    savedQuestions,
    savedQuestionsExportAvailable: savedQuestions !== null,
    brainProfile: brainProfile?.profile || null,
    brainProfileUpdatedAt: brainProfile?.updatedAt || null,
    brainProfileExportAvailable: brainProfile !== null,
    privacyNote: "This export includes account and technical usage records plus your explicitly saved encrypted profile, when secure profile storage is available. The usage ledger contains no conversations, recordings, transcripts or personal practice answers. On-device profiles and learning progress remain on your device.",
  };
}

export async function deleteAccount(userId) {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  throwDatabaseError(error, "Unable to delete account.");
  return { deleted: true };
}

export async function consumeDistributedRateLimit({ bucket, subjectHash, limit, windowSeconds }) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("consume_api_rate_limit", {
    p_bucket: bucket,
    p_subject_hash: subjectHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  throwDatabaseError(error, "Unable to consume shared rate limit.");
  if (!data) {
    const missingResult = new Error("Unable to consume shared rate limit.");
    missingResult.cause = { code: "empty_rate_limit_result", message: "Supabase returned no rate-limit result." };
    throw missingResult;
  }
  return data;
}

export async function startAiSession({ userId, feature, idempotencyKey }) {
  if (!await isAiFeatureEnabled(feature)) return { allowed: false, reason: "feature_unavailable" };
  await reconcileStaleAiSessions(userId);
  const { data, error } = await supabase.rpc("start_ai_session", {
    p_user_id: userId,
    p_feature: feature,
    p_idempotency_key: idempotencyKey,
  });
  throwDatabaseError(error, "Unable to start AI session.");
  if (data?.allowed && !isVerifiedPracticeAccess(data.access)) throw new Error("The seven-day access policy is not installed.");
  return data;
}

export async function reserveGuestDemo(subjectHash, requestId, feature) {
  if (!supabase) throw new Error('Account service unavailable.');
  const {data,error}=await supabase.rpc('reserve_guest_demo',{p_subject_hash:subjectHash,p_request_id:requestId,p_feature:feature});
  throwDatabaseError(error,'Unable to reserve demo.');
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
  const resolvedOutcome = outcome === "auto"
    ? (telemetry.requestCount > 0 ? "completed" : "refunded")
    : outcome;
  const { data, error } = await supabase.rpc("finish_ai_session", {
    p_user_id: userId,
    p_session_id: sessionId,
    p_outcome: resolvedOutcome,
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

const PRODUCT_EVENT_NAMES = new Set([
  "practice_started", "practice_completed", "practice_abandoned", "progress_70_reached",
  "pro_selected", "interview_started", "interview_completed", "question_saved", "mistake_practiced",
  "paywall_viewed",
  "upgrade_started",
  "rewarded_ad_offered",
  "rewarded_ad_started",
  "rewarded_ad_completed",
  "subscription_activated",
]);

export async function recordProductEvent({ userId, eventName, feature }) {
  if (!supabase || !userId || !PRODUCT_EVENT_NAMES.has(eventName)) {
    throw new Error("Unsupported product event.");
  }
  const normalizedFeature = getAiFeatureConfig(feature) || ["civics", "quiz", "vocabulary", "choose", "connect", "reading", "interview"].includes(feature) ? feature : null;
  const { error } = await supabase.from("usage_events").insert({
    user_id: userId,
    event_name: eventName,
    feature: normalizedFeature,
    metadata: {},
  });
  throwDatabaseError(error, "Unable to record product event.");
}

export async function getSavedQuestions(userId) {
  if (!supabase) throw new Error("Account service is unavailable.");
  const { data, error } = await supabase.from("saved_questions").select("question_id, test_version, saved").eq("user_id", userId).limit(1000);
  throwDatabaseError(error, "Unable to read saved questions.");
  return data || [];
}

export async function setSavedQuestion(userId, questionId, testVersion, saved) {
  if (!supabase) throw new Error("Account service is unavailable.");
  const { error } = await supabase.from("saved_questions").upsert({ user_id: userId, question_id: questionId, test_version: testVersion, saved, updated_at: new Date().toISOString() });
  throwDatabaseError(error, "Unable to save question.");
}

// This is intentionally not exposed by an account route. A future AdMob SSV
// verifier may call it only after validating the provider-signed callback.
export async function grantVerifiedRewardCredit({ userId, feature, verificationId, provider }) {
  if (!supabase) throw new Error("Account service is not configured.");
  const { data, error } = await supabase.rpc("grant_verified_reward_credit", {
    p_user_id: userId,
    p_feature: feature,
    p_verification_id: verificationId,
    p_provider: provider,
  });
  throwDatabaseError(error, "Unable to grant verified reward credit.");
  return data;
}

// Payment SDKs never set entitlements directly. A future verified provider
// webhook adapter translates its event into this provider-neutral contract.
export async function applyVerifiedEntitlementEvent(event) {
  if (!supabase) throw new Error("Account service is not configured.");
  const { data, error } = await supabase.rpc("apply_verified_entitlement_event", {
    p_provider: event.provider,
    p_provider_event_id: event.providerEventId,
    p_user_id: event.userId,
    p_event_type: event.eventType,
    p_tier: event.tier,
    p_status: event.status,
    p_provider_customer_id: event.providerCustomerId || null,
    p_provider_entitlement_id: event.providerEntitlementId || null,
    p_period_start: event.periodStart || null,
    p_period_end: event.periodEnd || null,
    p_occurred_at: event.occurredAt,
  });
  throwDatabaseError(error, "Unable to apply verified entitlement event.");
  return data;
}
