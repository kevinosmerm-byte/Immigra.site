import { sanitizeBrainProfile } from "../shared/brainProfile.js";
import { readBrainProfile } from "./brainProfileStorage.js";

/** The account snapshot cache used by the profile hook, with a global privacy wipe. */
export function createBrainProfileStore(read = readBrainProfile) {
  const accounts = new Map();
  const publish = (store, patch) => {
    store.snapshot = { ...store.snapshot, ...patch };
    for (const listener of store.listeners) listener();
  };
  return {
    get(userKey) {
      if (!accounts.has(userKey)) accounts.set(userKey, {
        snapshot: { profile: read(userKey), cloudStatus: "local" },
        listeners: new Set(), revision: 0, requestId: 0,
      });
      return accounts.get(userKey);
    },
    publish,
    clearAll() {
      for (const store of accounts.values()) {
        store.revision += 1;
        store.requestId += 1;
        publish(store, { profile: sanitizeBrainProfile(), cloudStatus: "local" });
      }
    },
  };
}
