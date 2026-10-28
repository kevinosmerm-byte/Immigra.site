import { readCivicProfile, saveCivicProfile } from "./civicProfileStorage.js";

const attempts = new Map();
const generations = new Map();
const RETRY_COOLDOWN_MS = 10 * 60_000;

export function captureCivicRefreshToken(userKey = "guest", { isCurrent } = {}) {
  if (!generations.has(userKey)) generations.set(userKey, { valid: true });
  while (generations.size > 100) {
    const oldest = generations.keys().next().value;
    generations.get(oldest).valid = false;
    generations.delete(oldest);
    attempts.delete(oldest);
  }
  return { userKey, generation: generations.get(userKey), valid: true, isCurrent };
}

export function isCivicRefreshTokenCurrent(token) {
  return Boolean(token?.valid && token.generation?.valid && generations.get(token.userKey) === token.generation
    && (typeof token.isCurrent !== "function" || token.isCurrent()));
}

export function cancelCivicRefreshToken(token) {
  if (!token) return;
  token.valid = false;
  if (attempts.get(token.userKey)?.requestToken === token) attempts.delete(token.userKey);
}

export function cancelCivicProfileRefresh(userKey) {
  attempts.delete(userKey);
  const generation = generations.get(userKey);
  if (generation) generation.valid = false;
  generations.delete(userKey);
}

/** A location change supersedes an old request; opening another question does not. */
export async function refreshCivicProfile({ userKey = "guest", address, zipCode, locationIdentity, addressUpdatedAt = null }, {
  fetchProfile, readProfile = readCivicProfile, saveProfile = saveCivicProfile, now = Date.now(), force = false, requestToken,
} = {}) {
  const token = requestToken || captureCivicRefreshToken(userKey);
  if (token.userKey !== userKey || !isCivicRefreshTokenCurrent(token)) return { status: "cancelled", profile: readProfile(userKey) };
  const last = attempts.get(userKey);
  const identity = locationIdentity || `${addressUpdatedAt || "unknown"}:${zipCode}`;
  if (last?.identity === identity && last.pending && isCivicRefreshTokenCurrent(last.requestToken)) return last.pending;
  if (!force && last?.identity === identity && now - last.at < RETRY_COOLDOWN_MS) return { status: "cooldown", profile: readProfile(userKey) };
  if (typeof fetchProfile !== "function") throw new Error("A civic profile fetch adapter is required.");
  const attempt = { identity, at: now, pending: null, requestToken: token };
  attempts.set(userKey, attempt);
  while (attempts.size > 100) attempts.delete(attempts.keys().next().value);
  const pending = (async () => {
    try {
      const profile = await fetchProfile({ address, zipCode, addressUpdatedAt, previousProfile: readProfile(userKey) });
      if (!isCivicRefreshTokenCurrent(token)) return { status: "cancelled", profile: readProfile(userKey) };
      if (attempts.get(userKey) !== attempt) return { status: "superseded", profile: readProfile(userKey) };
      if (!profile || typeof profile !== "object") throw new Error("Civic lookup returned no profile.");
      saveProfile(profile, userKey);
      return { status: "updated", profile };
    } catch {
      return { status: "unavailable", profile: readProfile(userKey) };
    } finally { attempt.pending = null; }
  })();
  attempt.pending = pending;
  return pending;
}
