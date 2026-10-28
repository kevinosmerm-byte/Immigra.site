import { externalDataCache } from "./externalDataCache.js";
import { civicAddressInput, createCivicProfile, normalizeZipCode } from "../src/civicProfile.js";
import { stateCivicsTable } from "../src/dynamicCivicsData.js";

const CENSUS_ENDPOINT = "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";
const CONGRESS_ENDPOINT = "https://api.congress.gov/v3";
const OPENSTATES_ENDPOINT = "https://v3.openstates.org/people.geo";
const DAY = 86_400_000;

function optionsFor(options) {
  return { fetchImpl: fetch, cache: externalDataCache, now: Date.now(), ...options };
}
function withCache(result) {
  return result.value == null ? null : { ...result.value, cache: { status: result.status, retrievedAt: result.retrievedAt, expiresAt: new Date(result.expiresAt).toISOString() } };
}
function readGeography(result, pattern) {
  const key = Object.keys(result?.geographies || {}).find(name => typeof pattern === "string" ? name === pattern : pattern.test(name));
  return result?.geographies?.[key]?.[0] || null;
}
function safeUrl(value) {
  try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : null; } catch { return null; }
}
function authoritativeUrl(value) {
  const url = safeUrl(value);
  if (!url) return null;
  const host = new URL(url).hostname;
  return host.endsWith(".gov") || /\.state\.[a-z]{2}\.us$/.test(host) || host === "nga.org" || host.endsWith(".nga.org") ? url : null;
}
function currentChamber(member, now) {
  const terms = Array.isArray(member.terms?.item) ? member.terms.item : [];
  const year = new Date(now).getUTCFullYear();
  const active = terms.filter(term => !term.startYear || Number(term.startYear) <= year).sort((a, b) => Number(a.startYear || 0) - Number(b.startYear || 0));
  return active.at(-1)?.chamber || member.chamber || null;
}
function memberName(member) {
  const text = member.directOrderName || member.name || "";
  if (!text.includes(",")) return text.trim();
  const [last, ...first] = text.split(",");
  return `${first.join(",").trim()} ${last.trim()}`.trim();
}
function normalizeMember(member, stateCode, now) {
  const chamber = currentChamber(member, now);
  const role = chamber === "Senate" ? "US_SENATOR" : chamber === "House of Representatives" ? "US_REPRESENTATIVE" : null;
  if (!role || member.currentMember === false || member.currentMember === "false" || !memberName(member)) return null;
  return {
    id: member.bioguideId || null, externalId: member.bioguideId || null,
    name: memberName(member), role, state: stateCode,
    district: role === "US_REPRESENTATIVE" && member.district != null ? String(Number(member.district)) : null,
    chamber, party: member.partyName || member.party || null,
    photoUrl: safeUrl(member.depiction?.imageUrl),
    officialUrl: safeUrl(member.officialUrl),
    source: "CONGRESS", sourceUrl: `${CONGRESS_ENDPOINT}/member${member.bioguideId ? `/${member.bioguideId}` : `/${stateCode}`}`,
    verifiedAt: new Date(now).toISOString(), confidence: "OFFICIAL_GOVERNMENT", active: true,
  };
}

async function enrichMember(record, { fetchImpl, cache, apiKey, now }) {
  if (!record.externalId || record.officialUrl) return record;
  try {
    const result = await cache.resolve({ provider: "CONGRESS", key: `member:${record.externalId}`, now, load: async () => {
      const response = await fetchImpl(`${CONGRESS_ENDPOINT}/member/${encodeURIComponent(record.externalId)}?format=json`, {
        headers: { accept: "application/json", "X-Api-Key": apiKey }, signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new Error(`Congress.gov member details returned ${response.status}.`);
      const member = (await response.json())?.member;
      if (!member || typeof member !== "object") throw new Error("Congress.gov returned unsupported member details.");
      if (member.currentMember === false || member.currentMember === "false") return { inactive: true };
      return {
        name: memberName(member) || record.name, officialUrl: safeUrl(member.officialUrl),
        party: member.partyName || member.party || record.party,
        photoUrl: safeUrl(member.depiction?.imageUrl) || record.photoUrl,
        verifiedAt: new Date(now).toISOString(),
      };
    } });
    return result.value.inactive ? null : { ...record, ...result.value };
  } catch { return record; /* The current member list remains an authoritative partial record. */ }
}

export async function geocodeCivicAddress(address, options = {}) {
  const { fetchImpl, cache, now } = optionsFor(options);
  const normalized = String(address || "").trim().replace(/\s+/g, " ");
  if (normalized.length < 8 || normalized.length > 500) throw new Error("A complete street address is required.");
  return withCache(await cache.resolve({ provider: "CENSUS", key: normalized.toLowerCase(), ttlMs: 7 * DAY, now, load: async () => {
    const url = new URL(CENSUS_ENDPOINT);
    url.searchParams.set("address", normalized);
    url.searchParams.set("benchmark", "Public_AR_Current");
    url.searchParams.set("vintage", "Current_Current");
    url.searchParams.set("format", "json");
    const response = await fetchImpl(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error(`Census Geocoder returned ${response.status}.`);
    const matches = (await response.json())?.result?.addressMatches || [];
    const match = matches.length === 1 ? matches[0] : null;
    if (!match) return null;
    const state = readGeography(match, "States");
    const district = readGeography(match, /Congressional Districts$/);
    const districtKey = Object.keys(district || {}).find(key => /^CD\d+$/.test(key));
    const upper = readGeography(match, /State Legislative Districts.*Upper/);
    const lower = readGeography(match, /State Legislative Districts.*Lower/);
    const longitude = Number(match.coordinates?.x);
    const latitude = Number(match.coordinates?.y);
    return {
      stateCode: state?.STUSAB || null,
      congressionalDistrict: district?.[districtKey] ?? district?.BASENAME ?? null,
      stateSenateDistrict: upper?.SLDU || upper?.BASENAME || null,
      stateHouseDistrict: lower?.SLDL || lower?.BASENAME || null,
      latitude: Number.isFinite(latitude) && Math.abs(latitude) <= 90 ? latitude : null,
      longitude: Number.isFinite(longitude) && Math.abs(longitude) <= 180 ? longitude : null,
      source: "CENSUS", sourceUrl: CENSUS_ENDPOINT, confidence: "OFFICIAL_GOVERNMENT", verifiedAt: new Date(now).toISOString(),
    };
  } }));
}

export function locationResolutionForZip({ zipCode, districts = [] }) {
  const unique = [...new Set(districts.filter(value => value != null && String(value).trim() !== "").map(String))];
  if (unique.length === 1) return { zipCode, status: "confirmed", district: unique[0], requiresAddress: false, allowsManualConfirmation: true };
  return { zipCode, status: unique.length > 1 ? "ambiguous" : "unknown", district: null, requiresAddress: true, allowsManualConfirmation: true };
}

export async function getCurrentMembers(stateCode, district, options = {}) {
  const { fetchImpl, cache, now } = optionsFor(options);
  const apiKey = options.apiKey ?? process.env.CONGRESS_API_KEY;
  if (!/^[A-Z]{2}$/.test(stateCode || "")) throw new Error("A two-letter state code is required.");
  if (!apiKey) { cache.markUnavailable("CONGRESS"); throw new Error("Congress.gov API access is not configured."); }
  const hasDistrict = district != null && String(district).trim() !== "";
  return withCache(await cache.resolve({ provider: "CONGRESS", key: `${stateCode}:${hasDistrict ? Number(district) : "senate"}`, now, load: async () => {
    const url = new URL(`${CONGRESS_ENDPOINT}/member/${stateCode}`);
    url.searchParams.set("currentMember", "true");
    url.searchParams.set("limit", "250");
    url.searchParams.set("format", "json");
    const response = await fetchImpl(url, { headers: { accept: "application/json", "X-Api-Key": apiKey }, signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error(`Congress.gov API returned ${response.status}.`);
    const records = (await response.json())?.members;
    if (!Array.isArray(records)) throw new Error("Congress.gov returned an unsupported response.");
    const normalized = records.map(member => normalizeMember(member, stateCode, now)).filter(Boolean).filter((member, index, all) => all.findIndex(other => other.externalId && member.externalId ? other.externalId === member.externalId : other.name === member.name) === index);
    const candidates = normalized.filter(member => member.role === "US_SENATOR").slice(0, 2);
    const representative = hasDistrict ? normalized.find(member => member.role === "US_REPRESENTATIVE" && Number(member.district) === Number(district)) || null : null;
    const enriched = await Promise.all([...candidates, representative].filter(Boolean).map(record => enrichMember(record, { fetchImpl, cache, apiKey, now })));
    const usSenators = enriched.filter(member => member?.role === "US_SENATOR");
    const usRepresentative = enriched.find(member => member?.role === "US_REPRESENTATIVE") || null;
    return { senators: usSenators.map(member => member.name), representative: usRepresentative?.name || null, usSenators, usRepresentative,
      source: "CONGRESS", sourceUrl: `${CONGRESS_ENDPOINT}/member/${stateCode}`, verifiedAt: new Date(now).toISOString() };
  } }));
}

export async function getStateLegislators(location, options = {}) {
  const { fetchImpl, cache, now } = optionsFor(options);
  const apiKey = options.apiKey ?? process.env.OPENSTATES_API_KEY;
  if (!apiKey) { cache.markUnavailable("OPENSTATES"); throw new Error("State legislator lookup is not configured."); }
  if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) throw new Error("Verified coordinates are required.");
  return withCache(await cache.resolve({ provider: "OPENSTATES", key: `${location.latitude}:${location.longitude}`, now, load: async () => {
    const url = new URL(OPENSTATES_ENDPOINT);
    url.searchParams.set("lat", location.latitude);
    url.searchParams.set("lng", location.longitude);
    url.searchParams.append("include", "links");
    url.searchParams.append("include", "sources");
    const response = await fetchImpl(url, { headers: { accept: "application/json", "X-API-KEY": apiKey }, signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error(`State legislator provider returned ${response.status}.`);
    const results = (await response.json())?.results;
    if (!Array.isArray(results)) throw new Error("State legislator provider returned an unsupported response.");
    const officials = results.filter(person => person.current_role && ["upper", "lower", "legislature"].includes(person.current_role.org_classification)
      && person.jurisdiction?.classification !== "country" && person.jurisdiction?.id !== "ocd-jurisdiction/country:us/government"
      && (!person.jurisdiction?.id?.includes("/state:") || person.jurisdiction.id.includes(`/state:${location.stateCode.toLowerCase()}/`)))
      .filter(person => typeof person.name === "string" && person.name.trim()).map(person => ({
        id: person.id || null, externalId: person.id || null, name: person.name.trim(),
        role: person.current_role.org_classification === "lower" ? "STATE_REPRESENTATIVE" : "STATE_SENATOR",
        state: location.stateCode, district: person.current_role.district || null, chamber: person.current_role.org_classification,
        party: person.party || null, photoUrl: safeUrl(person.image),
        officialUrl: (person.links || []).map(link => authoritativeUrl(link.url)).find(Boolean) || null,
        source: "OPENSTATES", sourceUrl: OPENSTATES_ENDPOINT, sourceUrls: (person.sources || []).map(source => safeUrl(source.url)).filter(Boolean),
        verifiedAt: new Date(now).toISOString(), confidence: "VERIFIED_PROVIDER", active: true,
      }));
    return { stateSenator: officials.find(person => person.role === "STATE_SENATOR") || null,
      stateRepresentative: officials.find(person => person.role === "STATE_REPRESENTATIVE") || null, sourceUrl: OPENSTATES_ENDPOINT, verifiedAt: new Date(now).toISOString() };
  } }));
}

/** Supported feed adapter: no guessed endpoint, scraped title or generated official. */
export async function getCurrentGovernor(stateCode, options = {}) {
  const { fetchImpl, cache, now } = optionsFor(options);
  const feedUrl = options.feedUrl ?? process.env.GOVERNOR_DATA_URL;
  if (!feedUrl) { cache.markUnavailable("GOVERNOR"); throw new Error("A verified governor data feed is not configured."); }
  if (!authoritativeUrl(feedUrl)) throw new Error("Governor feed must use an authoritative HTTPS government source.");
  return withCache(await cache.resolve({ provider: "GOVERNOR", key: `${feedUrl}:${stateCode}`, now, load: async () => {
    const response = await fetchImpl(feedUrl, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8_000), redirect: "error" });
    if (!response.ok) throw new Error(`Governor source returned ${response.status}.`);
    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : payload.officials || [];
    const record = rows.find(item => item.state === stateCode && item.role === "GOVERNOR" && item.active === true);
    const date = Date.parse(record?.verifiedAt);
    if (!record?.name?.trim() || !authoritativeUrl(record.sourceUrl) || !Number.isFinite(date) || date > now) throw new Error("The governor source has no verified current record for this state.");
    const governorOfficial = { id: record.id || null, externalId: record.externalId || null, name: record.name.trim(), role: "GOVERNOR", state: stateCode,
      district: null, chamber: null, party: record.party || null, photoUrl: safeUrl(record.photoUrl), officialUrl: authoritativeUrl(record.officialUrl),
      source: "GOVERNOR", sourceUrl: authoritativeUrl(record.sourceUrl), verifiedAt: record.verifiedAt,
      confidence: /\.gov$|\.state\.[a-z]{2}\.us$/.test(new URL(record.sourceUrl).hostname) ? "OFFICIAL_GOVERNMENT" : "VERIFIED_PROVIDER", active: true };
    return { governor: governorOfficial.name, governorOfficial, sourceUrl: governorOfficial.sourceUrl, verifiedAt: governorOfficial.verifiedAt };
  } }));
}

export function getCivicProviderHealth(cache = externalDataCache) { return cache.getProviderHealth(); }

export function createCivicLocationProvider(options = {}) {
  return { resolve: address => geocodeCivicAddress(address, options) };
}

export async function resolveCivicProfile({ zipCode, address, previousProfile = null, addressUpdatedAt = null } = {}, options = {}) {
  const { fetchImpl, cache, now } = optionsFor(options);
  const environment = options.environment || process.env;
  const zip = normalizeZipCode(zipCode);
  if (!zip || !String(address || "").trim()) throw new Error("ZIP code and complete address are required.");
  const input = civicAddressInput(address, zip);
  const location = await createCivicLocationProvider({ fetchImpl, cache, now }).resolve(input);
  if (!location?.stateCode || location.congressionalDistrict == null) return null;
  const state = stateCivicsTable.find(item => item.stateCode === location.stateCode);
  const sameState = previousProfile?.state?.code === location.stateCode;
  const sameDistrict = sameState && previousProfile?.district != null && Number(previousProfile.district) === Number(location.congressionalDistrict);
  const retained = sameState ? previousProfile || {} : {};
  const sameStateDistricts = sameState && retained.stateSenateDistrict != null && retained.stateHouseDistrict != null
    && retained.stateSenateDistrict === location.stateSenateDistrict && retained.stateHouseDistrict === location.stateHouseDistrict;
  const inputs = { fetchImpl, cache, now };
  const outcomes = await Promise.allSettled([
    getCurrentMembers(location.stateCode, location.congressionalDistrict, { ...inputs, apiKey: environment.CONGRESS_API_KEY || "" }),
    getStateLegislators(location, { ...inputs, apiKey: environment.OPENSTATES_API_KEY || "" }),
    getCurrentGovernor(location.stateCode, { ...inputs, feedUrl: environment.GOVERNOR_DATA_URL || "" }),
  ]);
  const [members, legislators, governor] = outcomes.map(result => result.status === "fulfilled" ? result.value : null);
  const fallbackGovernor = retained.governorOfficial || (state?.governor ? { name: state.governor, role: "GOVERNOR", state: location.stateCode, source: "NGA_DATED_FALLBACK", sourceUrl: state.governorSource, verifiedAt: state.governorVerifiedAt, confidence: "VERIFIED_PROVIDER", active: true } : null);
  const governorOfficial = governor?.governorOfficial || fallbackGovernor;
  const profile = createCivicProfile({ zipCode: zip, state: { code: location.stateCode, capital: state?.capital || null }, districts: [location.congressionalDistrict], location,
    officials: { ...retained, ...members, ...legislators, governor: governorOfficial?.name || retained.governor || null, governorOfficial,
      senators: members?.senators || retained.senators || [], representative: members ? members.representative : sameDistrict ? retained.representative || null : null,
      usSenators: members?.usSenators || retained.usSenators || [], usRepresentative: members ? members.usRepresentative : sameDistrict ? retained.usRepresentative || null : null,
      stateSenator: legislators ? legislators.stateSenator : sameStateDistricts ? retained.stateSenator || null : null,
      stateRepresentative: legislators ? legislators.stateRepresentative : sameStateDistricts ? retained.stateRepresentative || null : null,
      legacyVerification: {
        stateSenators: members ? { verifiedAt: members.verifiedAt, sourceUrl: members.sourceUrl } : retained.legacyVerification?.stateSenators || { verifiedAt: retained.verifiedAt, sourceUrl: retained.source },
        representative: members ? { verifiedAt: members.verifiedAt, sourceUrl: members.sourceUrl } : sameDistrict ? retained.legacyVerification?.representative || { verifiedAt: retained.verifiedAt, sourceUrl: retained.source } : null,
      },
      source: location.sourceUrl, verifiedAt: location.verifiedAt, refreshAfter: new Date(now + DAY).toISOString() },
    sourceMetadata: [location, members, legislators, governorOfficial ? { ...governorOfficial, cache: governor?.cache } : null,
      !members && retained.senators?.length ? { source: "LAST_VERIFIED_PROFILE", sourceUrl: retained.legacyVerification?.stateSenators?.sourceUrl || retained.source, verifiedAt: retained.legacyVerification?.stateSenators?.verifiedAt || retained.verifiedAt, cache: { status: "stale" } } : null,
    ].filter(Boolean).map(record => ({ source: record.source || (record.stateSenator ? "OPENSTATES" : "GOVERNOR"), sourceUrl: record.sourceUrl, verifiedAt: record.verifiedAt, cacheStatus: record.cache?.status || (record.source === "NGA_DATED_FALLBACK" ? "dated_fallback" : "verified") })),
    providerStatus: Object.fromEntries(["CONGRESS", "OPENSTATES", "GOVERNOR"].map((provider, i) => [provider, outcomes[i].status === "fulfilled" ? (outcomes[i].value?.cache?.status === "stale" ? "cached" : "available") : "unavailable"])),
  });
  profile.addressUpdatedAt = addressUpdatedAt;
  profile.refreshAttemptedAt = new Date(now).toISOString();
  profile.locationIdentity = cache.keyFor("LOCATION", input.toLowerCase().replace(/\s+/g, " ").trim());
  return profile;
}
