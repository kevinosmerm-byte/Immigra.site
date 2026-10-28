import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { apiJson } from "./api.js";
import { civicAddressIdentity, civicProfileNeedsRefresh, getCivicProfileForLocation, knownCivicAddress, knownCivicZipCode } from "./civicProfile.js";
import { readCivicProfile, saveCivicProfile, subscribeCivicProfile } from "./civicProfileStorage.js";
import { cancelCivicProfileRefresh, captureCivicRefreshToken, isCivicRefreshTokenCurrent, refreshCivicProfile } from "./civicProfileSync.js";

/** One civic store and refresh for the entire app, before any question is resolved. */
export function useCivicProfile(userKey = "guest", { userProfile = {}, n400Profile = {} } = {}) {
  const subscribe = useCallback(listener => subscribeCivicProfile(listener, userKey), [userKey]);
  const snapshot = useCallback(() => readCivicProfile(userKey), [userKey]);
  const storedProfile = useSyncExternalStore(subscribe, snapshot, snapshot);
  const address = knownCivicAddress({ userProfile, n400Profile });
  const zipCode = knownCivicZipCode({ userProfile, n400Profile, civicProfile: storedProfile });
  const [identity, setIdentity] = useState(null);
  const [refreshStatus, setRefreshStatus] = useState("idle");
  const currentLocation = useRef(null);
  const computedIdentity = identity?.userKey === userKey && identity.address === address && identity.zipCode === zipCode ? identity.value : null;
  const safeProfile = getCivicProfileForLocation(storedProfile, {
    userProfile, n400Profile, locationIdentity: computedIdentity, identityPending: Boolean(address && !computedIdentity),
  });

  useEffect(() => {
    currentLocation.current = { userKey, address, zipCode };
    return () => { currentLocation.current = null; };
  }, [userKey, address, zipCode]);
  useEffect(() => () => { cancelCivicProfileRefresh(userKey); }, [userKey]);

  useEffect(() => {
    let active = true;
    async function synchronize() {
      if (!address || !zipCode) return;
      const requestToken = captureCivicRefreshToken(userKey, { isCurrent: () => {
        const current = currentLocation.current;
        return current?.userKey === userKey && current.address === address && current.zipCode === zipCode;
      } });
      const locationIdentity = await civicAddressIdentity(address, zipCode);
      if (!active || !isCivicRefreshTokenCurrent(requestToken)) return;
      setIdentity({ userKey, address, zipCode, value: locationIdentity });
      if (civicProfileNeedsRefresh(storedProfile, { address, zipCode, addressUpdatedAt: userProfile.addressUpdatedAt, locationIdentity }) || safeProfile?.locationStatus === "changed") {
        setRefreshStatus("updating");
        const result = await refreshCivicProfile({ userKey, address, zipCode, locationIdentity, addressUpdatedAt: userProfile.addressUpdatedAt }, {
          requestToken,
          fetchProfile: input => apiJson("/civic-location/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }),
        });
        const current = currentLocation.current;
        if (current?.userKey === userKey && current.address === address && current.zipCode === zipCode) setRefreshStatus(result.status);
      }
    }
    synchronize();
    const cancel = () => { cancelCivicProfileRefresh(userKey); };
    globalThis.addEventListener?.("citizenshipai:local-data-cleared", cancel);
    return () => { active = false; globalThis.removeEventListener?.("citizenshipai:local-data-cleared", cancel); };
  }, [userKey, address, zipCode, userProfile.addressUpdatedAt, storedProfile, safeProfile?.locationStatus]);

  const saveProfile = useCallback(profile => saveCivicProfile(profile, userKey), [userKey]);
  return { civicProfile: safeProfile, storedProfile, saveProfile, refreshStatus };
}
