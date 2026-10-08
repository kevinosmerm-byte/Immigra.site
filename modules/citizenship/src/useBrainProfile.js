import { useCallback, useSyncExternalStore } from "react";
import { apiFetch } from "./api.js";
import { clearBrainProfile, saveBrainProfile, isBrainProfileSessionOnly } from "./brainProfileStorage.js";
import { mergeBrainProfile } from "../shared/brainProfile.js";
import { createBrainProfileStore } from "./brainProfileStore.js";

// Each account owns a stable external-store snapshot. Account changes cannot
// render the previous account's private data, even before effects would run.
const profiles = createBrainProfileStore();
const storeFor = userKey => profiles.get(userKey);
const publish = profiles.publish;
const clearAllProfiles = () => profiles.clearAll();
let subscriptions = 0;
export function useBrainProfile(userKey = "guest", session) {
  const subscribe = useCallback(listener => {
    const store = storeFor(userKey);
    store.listeners.add(listener);
    if (subscriptions++ === 0) globalThis.addEventListener?.("citizenshipai:local-data-cleared", clearAllProfiles);
    return () => {
      store.listeners.delete(listener);
      if (--subscriptions === 0) globalThis.removeEventListener?.("citizenshipai:local-data-cleared", clearAllProfiles);
    };
  }, [userKey]);
  const getSnapshot = useCallback(() => storeFor(userKey).snapshot, [userKey]);
  const { profile, cloudStatus } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const store = storeFor(userKey);
  const setStatus = status => publish(store, { cloudStatus: status });
  function updateProfile(patch) {
    store.revision += 1;
    const next = saveBrainProfile(mergeBrainProfile(store.snapshot.profile, patch), userKey);
    publish(store, { profile: next, cloudStatus: isBrainProfileSessionOnly(next) ? "session_only" : "local" });
    return next;
  }
  function resetProfile() {
    store.revision += 1;
    publish(store, { profile: clearBrainProfile(userKey), cloudStatus: "local" });
  }
  async function request(method, body) {
    if (!session?.access_token || session.user?.id !== userKey) { setStatus("sign_in_required"); return null; }
    if (method === "PUT") {
      const statusResponse = await apiFetch("/account/brain-profile/status", {
        cache: "no-store", signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const status = await statusResponse.json().catch(() => ({}));
      if (!statusResponse.ok || status.available !== true) {
        const error = new Error("Secure cloud storage is unavailable"); error.code = "profile_storage_unavailable"; throw error;
      }
    }
    const response = await apiFetch("/account/brain-profile", {
      method, cache: "no-store", signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error("Cloud profile unavailable"); error.code = payload.code; throw error; }
    return payload;
  }
  async function saveToCloud() {
    const requestId = ++store.requestId, revision = store.revision;
    setStatus("saving");
    try {
      const result = await request("PUT", { profile: store.snapshot.profile, consent: true });
      if (result && store.requestId === requestId) setStatus(store.revision === revision ? "saved" : "local");
      return result;
    } catch (error) { if (store.requestId === requestId) setStatus(error.code === "profile_storage_unavailable" ? "unavailable" : "error"); return null; }
  }
  async function restoreFromCloud() {
    const requestId = ++store.requestId, revision = store.revision;
    setStatus("restoring");
    try {
      const result = await request("GET");
      if (!result || store.requestId !== requestId) return null;
      if (store.revision !== revision) { setStatus("conflict"); return null; }
      if (!result.profile) { setStatus("empty"); return null; }
      const next = saveBrainProfile(result.profile, userKey);
      store.revision += 1;
      publish(store, { profile: next, cloudStatus: "restored" });
      return next;
    } catch (error) { if (store.requestId === requestId) setStatus(error.code === "profile_storage_unavailable" ? "unavailable" : "error"); return null; }
  }
  async function deleteFromCloud() {
    const requestId = ++store.requestId;
    setStatus("deleting");
    try {
      const result = await request("DELETE", { confirmation: "DELETE_PROFILE" });
      if (result && store.requestId === requestId) setStatus("deleted");
      return result;
    } catch { if (store.requestId === requestId) setStatus("error"); return null; }
  }
  return { profile, updateProfile, resetProfile, cloudStatus, saveToCloud, restoreFromCloud, deleteFromCloud };
}
