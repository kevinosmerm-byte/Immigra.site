// Never log SDK messages, request bodies, headers or raw provider error objects:
// they can contain credentials, transcripts or other personal information.
export function providerFailureDiagnostic(error, operation) {
  const status = Number(error?.status);
  const code = error?.code;
  const categories = {
    invalid_api_key: "authentication",
    insufficient_quota: "quota",
    rate_limit_exceeded: "rate_limit",
    model_not_found: "model_access",
    ETIMEDOUT: "connection",
    ECONNRESET: "connection",
    ECONNREFUSED: "connection",
  };
  const category = Object.hasOwn(categories, code) ? categories[code]
    : status === 401 ? "authentication"
      : status === 403 ? "permission"
        : status === 429 ? "rate_limit_or_quota"
          : status >= 500 && status <= 599 ? "provider_unavailable"
            : "unknown";
  return {
    event: "ai_provider_failure",
    provider: "openai",
    operation: ["coach", "transcribe", "reading", "writing"].includes(operation) ? operation : "unknown",
    status: Number.isInteger(status) && status >= 400 && status <= 599 ? status : null,
    category,
  };
}

export function logProviderFailure(error, operation) {
  const diagnostic = providerFailureDiagnostic(error, operation);
  console.error(JSON.stringify(diagnostic));
  return diagnostic;
}
