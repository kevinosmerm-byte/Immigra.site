export function normalizeZipCode(value) {
  const match = String(value || "").trim().match(/^(\d{5})(?:-\d{4})?$/);
  return match ? match[1] : null;
}

/**
 * Creates a display-safe civic profile from authoritative, caller-provided data.
 * A ZIP may span districts, so representative is omitted until a unique district
 * is supplied or the user confirms an exact address through an authoritative API.
 */
export function createCivicProfile({ zipCode, state = null, districts = [], officials = {}, location = {}, sourceMetadata = [], providerStatus = {} } = {}) {
  const zip = normalizeZipCode(zipCode);
  const uniqueDistricts = [...new Set(districts.filter(value => value != null && String(value).trim() !== "").map(String))];
  const district = uniqueDistricts.length === 1 ? uniqueDistricts[0] : null;
  return {
    zipCode: zip,
    state: state ? { code: state.code || null, name: state.name || null, capital: state.capital || null } : null,
    district,
    districtStatus: uniqueDistricts.length > 1 ? "ambiguous" : district ? "confirmed" : "unknown",
    governor: officials.governor || null,
    senators: Array.isArray(officials.senators) ? officials.senators.slice(0, 2) : [],
    representative: district ? officials.representative || null : null,
    source: officials.source || null,
    verifiedAt: officials.verifiedAt || null,
    congressionalDistrict: district,
    stateSenateDistrict: location.stateSenateDistrict || null,
    stateHouseDistrict: location.stateHouseDistrict || null,
    usRepresentative: district ? officials.usRepresentative || null : null,
    usSenators: Array.isArray(officials.usSenators) ? officials.usSenators.slice(0, 2) : [],
    governorOfficial: officials.governorOfficial || null,
    stateSenator: officials.stateSenator || null,
    stateRepresentative: officials.stateRepresentative || null,
    sourceMetadata,
    providerStatus,
    refreshAfter: officials.refreshAfter || null,
    legacyVerification: officials.legacyVerification || {},
  };
}

export function knownCivicAddress({ userProfile = {}, n400Profile = {} } = {}) {
  const answers = n400Profile.answers || {};
  const stored = userProfile.streetAddress || userProfile.address;
  const state = typeof userProfile.state === "object" ? userProfile.state?.code || userProfile.state?.name : userProfile.state;
  if (typeof stored === "string" && stored.trim()) return [stored, userProfile.city, state, userProfile.zipCode].filter(value => typeof value === "string" && value.trim()).join(", ").trim();
  const answer = answers.P_ADDRESS_CURRENT || answers.current_address || answers.CURRENT_ADDRESS || answers.address;
  return typeof answer === "string" ? answer.trim() : "";
}

export function knownCivicZipCode({ userProfile = {}, n400Profile = {}, civicProfile } = {}) {
  const address = knownCivicAddress({ userProfile, n400Profile });
  return normalizeZipCode(userProfile.zipCode) || normalizeZipCode(address.match(/(?:,\s*|\s)(\d{5})(?:-\d{4})?\s*$/)?.[1]) || normalizeZipCode(civicProfile?.zipCode);
}

const STATE_NAMES = { Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY", "District of Columbia": "DC", "Puerto Rico": "PR" };

function suppliedStateCode(value) {
  const text = String(typeof value === "object" ? value?.code || value?.name || "" : value || "").trim();
  if (Object.values(STATE_NAMES).includes(text.toUpperCase())) return text.toUpperCase();
  return Object.entries(STATE_NAMES).find(([name]) => name.toLowerCase() === text.toLowerCase())?.[1] || null;
}

/** Gate cached answers synchronously when their location no longer matches. Age alone never removes facts. */
export function getCivicProfileForLocation(profile, { userProfile = {}, n400Profile = {}, locationIdentity, identityPending = false } = {}) {
  if (!profile) return null;
  const address = knownCivicAddress({ userProfile, n400Profile });
  const stateCode = suppliedStateCode(userProfile.state) || suppliedStateCode(address.match(/(?:,\s*|\s)([A-Z]{2})\s+\d{5}(?:-\d{4})?\s*$/i)?.[1]);
  const zipCode = knownCivicZipCode({ userProfile, n400Profile, civicProfile: profile });
  const zipChanged = Boolean(zipCode && profile.zipCode && zipCode !== profile.zipCode);
  const stateChanged = Boolean(stateCode && stateCode !== profile.state?.code);
  const addressChanged = Boolean(locationIdentity ? locationIdentity !== profile.locationIdentity
    : userProfile.addressUpdatedAt && userProfile.addressUpdatedAt !== profile.addressUpdatedAt);
  if (!stateChanged && !zipChanged && !addressChanged && !identityPending) return profile;
  const retainState = !stateChanged && ((!zipChanged && !addressChanged && !identityPending) || stateCode === profile.state?.code);
  return {
    ...profile, zipCode, locationStatus: stateChanged || zipChanged || addressChanged ? "changed" : "checking",
    district: null, congressionalDistrict: null, districtStatus: "unknown", representative: null, usRepresentative: null,
    stateSenateDistrict: null, stateHouseDistrict: null, stateSenator: null, stateRepresentative: null,
    ...(retainState ? {} : { state: null, governor: null, governorOfficial: null, senators: [], usSenators: [], source: null, sourceMetadata: [], verifiedAt: null, legacyVerification: {} }),
  };
}

export function civicAddressInput(address, zipCode) {
  const normalized = String(address || "").trim().replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ");
  const zip = normalizeZipCode(zipCode);
  if (!zip) return normalized;
  return new RegExp(`(?:^|[ ,])${zip}(?:-\\d{4})?$`).test(normalized) ? normalized : `${normalized}, ${zip}`;
}

export async function civicAddressIdentity(address, zipCode) {
  if (!globalThis.crypto?.subtle) return null;
  const input = civicAddressInput(address, zipCode);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(`LOCATION:${input.toLowerCase().replace(/\s+/g, " ").trim()}`));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export function civicProfileNeedsRefresh(profile, { address, zipCode, addressUpdatedAt, locationIdentity, now = Date.now() } = {}) {
  if (!address || !normalizeZipCode(zipCode)) return false;
  if (!profile?.verifiedAt || profile.zipCode !== normalizeZipCode(zipCode)) return true;
  if (addressUpdatedAt && addressUpdatedAt !== profile.addressUpdatedAt && (!locationIdentity || locationIdentity !== profile.locationIdentity)) return true;
  if (locationIdentity && profile.locationIdentity !== locationIdentity) return true;
  if (profile.refreshAttemptedAt && now - Date.parse(profile.refreshAttemptedAt) < 10 * 60_000) return false;
  const refreshAt = Date.parse(profile.refreshAfter || profile.verifiedAt);
  if (Number.isFinite(refreshAt) && now >= refreshAt + (profile.refreshAfter ? 0 : 86_400_000)) return true;
  return profile.districtStatus !== "confirmed" || !profile.representative || !profile.senators?.length;
}
