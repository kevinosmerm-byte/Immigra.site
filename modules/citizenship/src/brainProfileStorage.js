import { mergeBrainProfile, sanitizeBrainProfile } from "../shared/brainProfile.js";

const key = userKey => `citizenshipai.brain-profile.v1:${userKey || "guest"}`;
const sessionOnlyProfiles = new WeakSet();
export function isBrainProfileSessionOnly(profile) { return profile && sessionOnlyProfiles.has(profile); }
function getStorage(storage) { try { return storage || globalThis.localStorage; } catch { return null; } }
export function readBrainProfile(userKey = "guest", storage) {
  try { return sanitizeBrainProfile(JSON.parse(getStorage(storage)?.getItem(key(userKey)) || "{}")); }
  catch { return sanitizeBrainProfile(); }
}
export function saveBrainProfile(profile, userKey = "guest", storage) {
  const safe = sanitizeBrainProfile(profile);
  try {
    const target = getStorage(storage);
    if (!target) sessionOnlyProfiles.add(safe);
    else target.setItem(key(userKey), JSON.stringify(safe));
  }
  catch { sessionOnlyProfiles.add(safe); }
  return safe;
}
export function updateBrainProfile(patch, userKey = "guest", storage) {
  return saveBrainProfile(mergeBrainProfile(readBrainProfile(userKey, storage), patch), userKey, storage);
}
export function clearBrainProfile(userKey = "guest", storage) {
  const empty = sanitizeBrainProfile();
  try {
    const target = getStorage(storage);
    if (!target) sessionOnlyProfiles.add(empty);
    else target.removeItem(key(userKey));
  } catch { sessionOnlyProfiles.add(empty); }
  return empty;
}
