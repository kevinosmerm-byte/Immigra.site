const CENSUS_ENDPOINT = "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";
const CACHE_TTL_MS = 7 * 86_400_000;
const cache = new Map();
const memberCache = new Map();

function readGeography(result, name) {
  return result?.geographies?.[name]?.[0] || null;
}

export async function geocodeCivicAddress(address, { fetchImpl = fetch, now = Date.now() } = {}) {
  const normalized = String(address || "").trim().replace(/\s+/g, " ");
  if (normalized.length < 8) throw new Error("A complete street address is required.");
  const key = normalized.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;
  const url = new URL(CENSUS_ENDPOINT);
  url.searchParams.set("address", normalized);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("vintage", "Current_Current");
  url.searchParams.set("format", "json");
  const response = await fetchImpl(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`Census Geocoder returned ${response.status}.`);
  const match = (await response.json())?.result?.addressMatches?.[0];
  if (!match) return null;
  const state = readGeography(match, "States");
  const district = readGeography(match, "119th Congressional Districts") || readGeography(match, "Congressional Districts");
  const value = {
    stateCode: state?.STUSAB || null,
    congressionalDistrict: district?.CD119 || district?.BASENAME || null,
    matchedAddress: match.matchedAddress || null,
    sourceUrl: CENSUS_ENDPOINT,
    verifiedAt: new Date(now).toISOString(),
  };
  cache.set(key, { value, expiresAt: now + CACHE_TTL_MS });
  return value;
}

export function locationResolutionForZip({ zipCode, districts = [] }) {
  const unique = [...new Set(districts.filter(Boolean))];
  if (unique.length === 1) return { zipCode, status: "confirmed", district: unique[0], requiresAddress: false, allowsManualConfirmation: true };
  return { zipCode, status: unique.length > 1 ? "ambiguous" : "unknown", district: null, requiresAddress: true, allowsManualConfirmation: true };
}

export async function getCurrentMembers(stateCode, district, { fetchImpl = fetch, apiKey = process.env.CONGRESS_API_KEY, now = Date.now() } = {}) {
  if (!/^[A-Z]{2}$/.test(stateCode || "")) throw new Error("A two-letter state code is required.");
  if (!apiKey) throw new Error("Congress.gov API access is not configured.");
  const key = `${stateCode}:${district || "senate"}`;
  const cached = memberCache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;
  const url = new URL(`https://api.congress.gov/v3/member/${stateCode}`);
  url.searchParams.set("currentMember", "true");
  url.searchParams.set("limit", "250");
  url.searchParams.set("format", "json");
  url.searchParams.set("api_key", apiKey);
  const response = await fetchImpl(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`Congress.gov API returned ${response.status}.`);
  const members = (await response.json())?.members || [];
  const latestTerm = (member) => {
    const terms = Array.isArray(member.terms?.item) ? member.terms.item : [];
    return terms.at(-1) || null;
  };
  const senators = members.filter((member) => latestTerm(member)?.chamber === "Senate").map((member) => member.name).filter(Boolean).slice(0, 2);
  const representative = members.find((member) => latestTerm(member)?.chamber === "House of Representatives" && String(member.district ?? latestTerm(member)?.district) === String(district))?.name || null;
  const value = { senators, representative: district ? representative : null, sourceUrl: "https://api.congress.gov/", verifiedAt: new Date(now).toISOString() };
  memberCache.set(key, { value, expiresAt: now + 86_400_000 });
  return value;
}
