export const STUDY_KEY = 'immigra.asylum-study.v1';
export function eligibleIds(bank, country) {
  return [...new Set(bank.filter(q => !q.country || q.country === country).map(q => q.id))];
}
export function newSession(bank, country, random = Math.random) {
  const order = eligibleIds(bank, country);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {version: 1, country, order, index: 0};
}
export function restoreSession(storage, bank, countries) {
  try {
    const s = JSON.parse(storage.getItem(STUDY_KEY));
    if (!s || s.version !== 1 || !countries.includes(s.country)) return null;
    const ids = eligibleIds(bank, s.country);
    if (!Array.isArray(s.order) || s.order.length !== ids.length || new Set(s.order).size !== ids.length || !s.order.every(id => ids.includes(id)) || !Number.isInteger(s.index) || s.index < 0 || s.index >= ids.length) return null;
    return s;
  } catch { return null; }
}
export function saveSession(storage, session) {
  try { if (session) storage.setItem(STUDY_KEY, JSON.stringify(session)); else storage.removeItem(STUDY_KEY); } catch { /* Storage can be unavailable; study still works in memory. */ }
}
export function advanceSession(session, delta) {
  return {...session, index: Math.max(0, Math.min(session.order.length - 1, session.index + delta))};
}
