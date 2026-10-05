const SANDBOX_DEFAULTS = {
  tokenUrl: "https://api-int.uscis.gov/oauth/accesstoken",
  apiUrl: "https://api-int.uscis.gov/case-status",
};
const USCIS_REQUEST_TIMEOUT_MS = 15_000;
export const USCIS_PUBLIC_CASE_STATUS_URL = "https://egov.uscis.gov/";

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
    signal: AbortSignal.timeout(USCIS_REQUEST_TIMEOUT_MS),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !asText(payload.access_token)) {
    const error = new Error("USCIS authentication failed.");
    error.status = response.status || 502;
    error.source = "authentication";
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
    error.source = "configuration";
    throw error;
  }

  const token = await requestAccessToken(config, fetchImpl);
  const response = await fetchImpl(`${config.apiUrl.replace(/\/$/, "")}/${encodeURIComponent(receiptNumber)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(USCIS_REQUEST_TIMEOUT_MS),
  });
  const payload = await response.json().catch(() => ({}));
  const traceId = response.headers?.get?.("x-trace-id") || response.headers?.get?.("trace-id") || "";

  if (!response.ok) {
    const error = new Error(response.status === 404
      ? (config.isSandbox ? "We couldn't find information for this Sandbox receipt number." : "We couldn't find information for this receipt number.")
      : "We couldn't check USCIS right now. Please try again later.");
    error.status = response.status || 502;
    error.traceId = traceId;
    error.source = "uscis";
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

/**
 * CaseStatusProvider contract: getStatus(input). Manual mode performs no lookup;
 * official-api mode reuses the existing authorized OAuth implementation only.
 */
export function createCaseStatusProvider({ mode = "manual", fetchStatus = fetchUscisCaseStatus, environment = process.env, fetchImpl = fetch } = {}) {
  if (!["manual", "official-api"].includes(mode)) throw new Error("Case status provider mode must be manual or official-api.");
  return {
    async getStatus(input = {}) {
      if (mode === "manual") return {
        provider: "USCIS_MANUAL", statusCode: null, title: null, description: null, statusDate: null,
        source: "USCIS", sourceUrl: USCIS_PUBLIC_CASE_STATUS_URL,
        retrievedAt: null, lastCheckedAt: null, official: false, isTestData: false,
        confidence: "UNVERIFIED", requiresUserAction: true, canUpdateCaseProfile: false,
      };
      const receiptNumber = asText(typeof input === "string" ? input : input.receiptNumber).toUpperCase();
      if (!/^[A-Z]{3}\d{10}$/.test(receiptNumber)) {
        const error = new Error("Enter a valid 13-character USCIS receipt number.");
        error.status = 400;
        error.source = "request";
        throw error;
      }
      const raw = await fetchStatus(receiptNumber, { environment, fetchImpl });
      const tracker = raw?.tracker || {};
      const status = raw?.case_status || {};
      // Unknown environments cannot silently become real production case data.
      const isTestData = tracker.environment !== "production" || tracker.isTestData !== false;
      const title = asText(status.current_case_status_text_en) || null;
      const checkedAt = asText(tracker.checkedAt);
      const retrievedAt = checkedAt && Number.isFinite(Date.parse(checkedAt)) ? checkedAt : null;
      const reportedDate = asText(status.modifiedDate);
      const statusDate = reportedDate && Number.isFinite(Date.parse(reportedDate)) ? reportedDate : null;
      const official = !isTestData && Boolean(title && retrievedAt);
      const result = {
        provider: "USCIS_OFFICIAL_API", statusCode: asText(status.statusCode) || null,
        title, description: asText(status.current_case_status_desc_en) || null, statusDate,
        source: "USCIS", sourceUrl: USCIS_PUBLIC_CASE_STATUS_URL,
        retrievedAt, lastCheckedAt: retrievedAt, official, isTestData,
        confidence: isTestData ? "SANDBOX_TEST_DATA" : official ? "OFFICIAL_USCIS" : "UNVERIFIED",
        requiresUserAction: !title, canUpdateCaseProfile: official,
      };
      // Compatibility payload is server-only: JSON.stringify(result) cannot
      // accidentally expose the raw receipt number or an upstream response.
      Object.defineProperty(result, "raw", { value: raw, enumerable: false });
      return result;
    },
  };
}
