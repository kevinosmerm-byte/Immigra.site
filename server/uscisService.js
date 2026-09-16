const SANDBOX_DEFAULTS = {
  tokenUrl: "https://api-int.uscis.gov/oauth/accesstoken",
  apiUrl: "https://api-int.uscis.gov/case-status",
};

let cachedToken = null;

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function firstText(source, keys) {
  for (const key of keys) {
    const value = asText(source?.[key]);
    if (value) return value;
  }
  return "";
}

export function getUscisConfig(environment = process.env) {
  const mode = (environment.USCIS_ENV || "sandbox").trim().toLowerCase();
  if (mode !== "sandbox" && mode !== "production") {
    throw new Error("USCIS_ENV must be sandbox or production.");
  }

  const isSandbox = mode === "sandbox";
  const tokenUrl = isSandbox
    ? environment.USCIS_SANDBOX_TOKEN_URL || environment.USCIS_TOKEN_URL || SANDBOX_DEFAULTS.tokenUrl
    : environment.USCIS_PRODUCTION_TOKEN_URL;
  const apiUrl = isSandbox
    ? environment.USCIS_SANDBOX_API_URL || environment.USCIS_API_URL || SANDBOX_DEFAULTS.apiUrl
    : environment.USCIS_PRODUCTION_API_URL;
  const clientId = isSandbox
    ? environment.USCIS_SANDBOX_CLIENT_ID || environment.USCIS_CLIENT_ID
    : environment.USCIS_PRODUCTION_CLIENT_ID;
  const clientSecret = isSandbox
    ? environment.USCIS_SANDBOX_CLIENT_SECRET || environment.USCIS_CLIENT_SECRET
    : environment.USCIS_PRODUCTION_CLIENT_SECRET;

  return { mode, isSandbox, tokenUrl, apiUrl, clientId, clientSecret };
}

export function maskReceiptNumber(receiptNumber) {
  const value = asText(receiptNumber);
  if (value.length < 7) return "••••";
  return `${value.slice(0, 3)}••••••${value.slice(-4)}`;
}

function normalizeCaseData(payload, receiptNumber) {
  const source = payload?.case_status || payload?.caseStatus || payload?.data || payload || {};
  return {
    current_case_status_text_en: firstText(source, ["current_case_status_text_en", "currentCaseStatusTextEn", "currentStatusTextEn", "status"]),
    current_case_status_text_es: firstText(source, ["current_case_status_text_es", "currentCaseStatusTextEs", "currentStatusTextEs"]),
    current_case_status_desc_en: firstText(source, ["current_case_status_desc_en", "currentCaseStatusDescEn", "currentStatusDescriptionEn", "description"]),
    current_case_status_desc_es: firstText(source, ["current_case_status_desc_es", "currentCaseStatusDescEs", "currentStatusDescriptionEs"]),
    receiptNumber: firstText(source, ["receiptNumber", "receipt_number"]) || receiptNumber,
    formType: firstText(source, ["formType", "form_type", "formNumber"]),
    modifiedDate: firstText(source, ["modifiedDate", "modified_date", "lastModifiedDate", "last_modified_date"]),
    receivedDate: firstText(source, ["receivedDate", "received_date", "submittedDate", "submitted_date"]),
  };
}

function getCachedToken(config) {
  const now = Date.now();
  if (
    cachedToken
    && cachedToken.mode === config.mode
    && cachedToken.token
    && cachedToken.expiresAt > now + 60_000
  ) return cachedToken.token;
  return "";
}

async function requestAccessToken(config, fetchImpl) {
  const reusableToken = getCachedToken(config);
  if (reusableToken) return reusableToken;

  const response = await fetchImpl(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !asText(payload.access_token)) {
    const error = new Error("USCIS authentication failed.");
    error.status = response.status || 502;
    throw error;
  }

  const expiresInSeconds = Number(payload.expires_in);
  cachedToken = {
    mode: config.mode,
    token: payload.access_token,
    expiresAt: Date.now() + (Number.isFinite(expiresInSeconds) ? expiresInSeconds : 300) * 1000,
  };
  return cachedToken.token;
}

export async function fetchUscisCaseStatus(receiptNumber, { environment = process.env, fetchImpl = fetch } = {}) {
  const config = getUscisConfig(environment);
  if (!config.clientId || !config.clientSecret || !config.tokenUrl || !config.apiUrl) {
    const error = new Error("USCIS case status is not configured yet.");
    error.status = 503;
    throw error;
  }

  const token = await requestAccessToken(config, fetchImpl);
  const response = await fetchImpl(`${config.apiUrl.replace(/\/$/, "")}/${encodeURIComponent(receiptNumber)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const payload = await response.json().catch(() => ({}));
  const traceId = response.headers?.get?.("x-trace-id") || response.headers?.get?.("trace-id") || "";

  if (!response.ok) {
    const error = new Error(response.status === 404 ? "We couldn't find information for this Sandbox receipt number." : "We couldn't check USCIS right now. Please try again later.");
    error.status = response.status || 502;
    error.traceId = traceId;
    throw error;
  }

  return {
    case_status: normalizeCaseData(payload, receiptNumber),
    tracker: {
      environment: config.mode,
      isTestData: config.isSandbox,
      checkedAt: new Date().toISOString(),
      maskedReceiptNumber: maskReceiptNumber(receiptNumber),
      traceId: traceId || undefined,
    },
  };
}
