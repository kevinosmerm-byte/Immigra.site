import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY?.trim();

const supabase = supabaseUrl && supabaseSecretKey
  ? createClient(supabaseUrl, supabaseSecretKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })
  : null;

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

export async function startAiSession({ userId, feature, idempotencyKey }) {
  const { data, error } = await supabase.rpc("start_ai_session", {
    p_user_id: userId,
    p_feature: feature,
    p_idempotency_key: idempotencyKey,
  });
  throwDatabaseError(error, "Unable to start AI session.");
  return data;
}

export async function finishAiSession({ userId, sessionId, outcome, telemetry }) {
  const { data, error } = await supabase.rpc("finish_ai_session", {
    p_user_id: userId,
    p_session_id: sessionId,
    p_outcome: outcome,
    p_telemetry: telemetry || {},
  });
  throwDatabaseError(error, "Unable to finish AI session.");
  return data;
}
