export function readCivicProfile(userKey = "guest") {
  try { return JSON.parse(localStorage.getItem(`citizenshipai.civic-profile.v1:${userKey}`) || "null"); } catch { return null; }
}
export function saveCivicProfile(profile, userKey = "guest") {
  try { localStorage.setItem(`citizenshipai.civic-profile.v1:${userKey}`, JSON.stringify(profile)); } catch { /* Keep the current in-memory profile. */ }
}
