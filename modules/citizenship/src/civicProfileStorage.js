const snapshots = new Map();
const listeners = new Map();
let subscriptions = 0;

function readStoredProfile(userKey) {
  try { return JSON.parse(localStorage.getItem(`citizenshipai.civic-profile.v1:${userKey}`) || "null"); } catch { return null; }
}

export function readCivicProfile(userKey = "guest") {
  if (!snapshots.has(userKey)) snapshots.set(userKey, readStoredProfile(userKey));
  return snapshots.get(userKey);
}

export function saveCivicProfile(profile, userKey = "guest") {
  try { localStorage.setItem(`citizenshipai.civic-profile.v1:${userKey}`, JSON.stringify(profile)); } catch { /* Keep the current in-memory profile. */ }
  snapshots.set(userKey, profile);
  for (const listener of listeners.get(userKey) || []) listener();
}

function reloadProfiles(event) {
  const prefix = "citizenshipai.civic-profile.v1:";
  if (event?.key && !event.key.startsWith(prefix)) return;
  const changedKey = event?.key ? event.key.slice(prefix.length) : null;
  if (changedKey) snapshots.delete(changedKey);
  else snapshots.clear();
  for (const [userKey, subscribers] of listeners) {
    if (changedKey && changedKey !== userKey) continue;
    snapshots.set(userKey, readStoredProfile(userKey));
    for (const subscriber of subscribers) subscriber();
  }
}

export function subscribeCivicProfile(listener, userKey = "guest") {
  if (!listeners.has(userKey)) listeners.set(userKey, new Set());
  listeners.get(userKey).add(listener);
  if (subscriptions++ === 0) {
    globalThis.addEventListener?.("storage", reloadProfiles);
    globalThis.addEventListener?.("citizenshipai:local-data-cleared", reloadProfiles);
  }
  return () => {
    listeners.get(userKey)?.delete(listener);
    if (--subscriptions === 0) {
      globalThis.removeEventListener?.("storage", reloadProfiles);
      globalThis.removeEventListener?.("citizenshipai:local-data-cleared", reloadProfiles);
    }
  };
}
