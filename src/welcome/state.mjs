export const NOTICE_VERSION = '2026-10';
export const WELCOME_KEY = 'immigra:welcome:v1';
export const LANGUAGE_KEY = 'citizenshipai.language';
export function initialLanguage(storage, browserLanguage = 'es') {
  try { const value = storage.getItem(LANGUAGE_KEY); if (['es', 'en'].includes(value)) return value; } catch {}
  return browserLanguage.toLowerCase().startsWith('es') ? 'es' : 'en';
}
export function readAcceptance(storage) {
  try { return JSON.parse(storage.getItem(WELCOME_KEY)); } catch { return null; }
}
export function accepted(record) {
  return record?.disclaimerVersion === NOTICE_VERSION && ['es','en'].includes(record.language) && Number.isFinite(Date.parse(record.acceptedAt));
}
export function saveAcceptance(storage, language, now = new Date()) {
  const record = {language, disclaimerVersion: NOTICE_VERSION, acceptedAt: now.toISOString()};
  try { storage.setItem(LANGUAGE_KEY, language); storage.setItem(WELCOME_KEY, JSON.stringify(record)); } catch {}
  return record;
}
export function requiresWelcome(page) { return ['', 'citizenship','asylum','residency','preparation'].includes(page); }
