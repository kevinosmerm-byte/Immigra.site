export const PRO_NOTICE_INTERVAL = 7 * 24 * 60 * 60 * 1000;
export function claimProNotice(storage, userId, now = Date.now()) {
  const key = `citizenshipai.pro-notice.v2:${userId || 'guest'}`;
  const last = Number(storage.getItem(key));
  if (Number.isFinite(last) && last > 0 && now - last < PRO_NOTICE_INTERVAL) return false;
  storage.setItem(key, String(now));
  return true;
}
