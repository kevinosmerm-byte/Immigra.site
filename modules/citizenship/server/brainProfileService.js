import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { sanitizeBrainProfile } from "../shared/brainProfile.js";

const DOMAINS = { user: "user_profiles", immigration: "immigration_profiles", n400: "n400_profiles", case: "case_profiles" };
function encryptionKey(value = process.env.PROFILE_ENCRYPTION_KEY) {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]{43}=$/.test(value.trim())) return null;
  const key = Buffer.from(value.trim(), "base64");
  return key.length === 32 ? key : null;
}
export function getBrainProfileConfiguration(keyValue) { return { available: Boolean(encryptionKey(keyValue)) }; }
function requireKey(keyValue) {
  const key = encryptionKey(keyValue);
  if (!key) { const error = new Error("Secure profile storage is unavailable."); error.code = "profile_storage_unavailable"; throw error; }
  return key;
}
function databaseError(error) {
  if (!error) return;
  const wrapped = new Error("Profile storage is temporarily unavailable.");
  wrapped.code = "profile_storage_unavailable";
  throw wrapped;
}
export function encryptProfileDomain(value, userId, domain, keyValue) {
  const key = requireKey(keyValue), iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(`citizenshipai:brain:v1:${userId}:${domain}`));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return { version: 1, iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: encrypted.toString("base64") };
}
export function decryptProfileDomain(value, userId, domain, keyValue) {
  if (!value) return null;
  const key = requireKey(keyValue);
  try {
    if (value.version !== 1) throw new Error("Invalid envelope");
    const iv = Buffer.from(value.iv, "base64"), tag = Buffer.from(value.tag, "base64");
    if (iv.length !== 12 || tag.length !== 16) throw new Error("Invalid envelope");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(Buffer.from(`citizenshipai:brain:v1:${userId}:${domain}`));
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(value.ciphertext, "base64")), decipher.final()]).toString("utf8"));
  } catch {
    const error = new Error("Secure profile data could not be restored."); error.code = "profile_restore_unavailable"; throw error;
  }
}
export async function getBrainProfile(database, userId, keyValue) {
  requireKey(keyValue);
  const results = await Promise.all(Object.entries(DOMAINS).map(async ([domain, table]) => {
    const { data, error } = await database.from(table).select("private_profile, updated_at").eq("user_id", userId).maybeSingle();
    databaseError(error);
    return [domain, data];
  }));
  const rows = Object.fromEntries(results);
  const user = decryptProfileDomain(rows.user?.private_profile, userId, "user", keyValue);
  const exists = results.some(([, row]) => row?.private_profile);
  const profile = exists ? sanitizeBrainProfile({
    userProfile: user?.userProfile, preferences: user?.preferences,
    immigrationProfile: decryptProfileDomain(rows.immigration?.private_profile, userId, "immigration", keyValue),
    n400Profile: decryptProfileDomain(rows.n400?.private_profile, userId, "n400", keyValue),
    caseProfile: decryptProfileDomain(rows.case?.private_profile, userId, "case", keyValue),
  }) : null;
  return { profile, updatedAt: rows.user?.private_profile ? rows.user.updated_at : null };
}
export async function setBrainProfile(database, userId, value, keyValue) {
  requireKey(keyValue);
  const profile = sanitizeBrainProfile(value);
  const { data, error } = await database.rpc("save_brain_profile", {
    p_user_id: userId,
    p_user: encryptProfileDomain({ userProfile: profile.userProfile, preferences: profile.preferences }, userId, "user", keyValue),
    p_immigration: encryptProfileDomain(profile.immigrationProfile, userId, "immigration", keyValue),
    p_n400: encryptProfileDomain(profile.n400Profile, userId, "n400", keyValue),
    p_case: encryptProfileDomain(profile.caseProfile, userId, "case", keyValue),
  });
  databaseError(error);
  return { profile, updatedAt: data };
}
export async function deleteBrainProfile(database, userId) {
  const { error } = await database.rpc("delete_brain_profile", { p_user_id: userId });
  databaseError(error);
  return { deleted: true };
}
