/** Explicit consent is required for sending microphone audio to third-party services. */
export const CONSENT_VERSION='2026-10-08-v1';
export function consentRecord({audioProcessing=false,transcriptExport=false,locale='es'}={}){
 return {version:CONSENT_VERSION,audioProcessing:audioProcessing===true,transcriptExport:transcriptExport===true,locale};
}
export function mayStartRealtime(consent){return consent?.version===CONSENT_VERSION&&consent.audioProcessing===true}
export function redactSensitive(text){return String(text??'').replace(/\b\d{3}-\d{2}-\d{4}\b/g,'[REDACTED SSN]').replace(/\bA\s?\d{8,9}\b/gi,'[REDACTED A-NUMBER]').replace(/\b(?:\d[ -]*?){13,19}\b/g,'[REDACTED NUMBER]')}
export function privacyChecklist(){return ['Explicit third-party audio consent','Authenticated session and ownership check','Server-side entitlement and quota','Deletion/retention policy','No API key in browser','Provider data-processing review','Encryption and incident response','No transcript logging by default']}
