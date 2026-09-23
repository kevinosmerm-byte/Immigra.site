export function normalizeZipCode(value) {
  const match = String(value || "").trim().match(/^(\d{5})(?:-\d{4})?$/);
  return match ? match[1] : null;
}

/**
 * Creates a display-safe civic profile from authoritative, caller-provided data.
 * A ZIP may span districts, so representative is omitted until a unique district
 * is supplied or the user confirms an exact address through an authoritative API.
 */
export function createCivicProfile({ zipCode, state = null, districts = [], officials = {} } = {}) {
  const zip = normalizeZipCode(zipCode);
  const uniqueDistricts = [...new Set(districts.filter(Boolean))];
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
  };
}
