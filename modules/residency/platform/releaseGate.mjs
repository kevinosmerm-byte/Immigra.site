export const REQUIRED_CHECKS=Object.freeze(['auth','rls','rate_limits','billing_webhooks','consent','deletion','pdf_security','audio_e2e','ios','android','accessibility','cross_engine_regression']);
export function releaseGate(results={}){const missing=REQUIRED_CHECKS.filter(k=>results[k]!==true);return {ready:missing.length===0,missing}}
