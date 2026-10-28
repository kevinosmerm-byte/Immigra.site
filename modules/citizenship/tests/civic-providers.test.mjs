import test from "node:test";
import assert from "node:assert/strict";
import { ExternalDataCache } from "../server/externalDataCache.js";
import { getCurrentGovernor, getCurrentMembers, getStateLegislators, resolveCivicProfile } from "../server/civicLocationService.js";
import { civicAddressIdentity, civicProfileNeedsRefresh, createCivicProfile, knownCivicAddress } from "../src/civicProfile.js";
import { getCivicsQuestion } from "../src/civicsQuestionBank.js";
import { resolveCivicsQuestion } from "../src/dynamicCivicsData.js";

const now = Date.parse("2026-10-05T12:00:00Z");
const response = payload => ({ ok: true, json: async () => payload });
const census = stateCode => ({ result: { addressMatches: [{ matchedAddress: "PRIVATE ADDRESS MUST NEVER LEAVE PROVIDER", coordinates: { x: -70, y: 40 }, geographies: { States: [{ STUSAB: stateCode }], "119th Congressional Districts": [{ CD119: "00" }], "2024 State Legislative Districts - Upper": [{ SLDU: "2" }], "2024 State Legislative Districts - Lower": [{ SLDL: "4" }] } }] } });

test("bounded server cache hashes private keys, shares requests, preserves dated fallback and tracks health", async () => {
  const cache = new ExternalDataCache({ maxEntries: 2 });
  let calls = 0;
  const run = () => cache.resolve({ provider: "CENSUS", key: "123 Private Street", now, ttlMs: 10, load: async () => { calls += 1; return { publicFact: "district" }; } });
  const [first, second] = await Promise.all([run(), run()]);
  assert.equal(calls, 1);
  assert.deepEqual(first.value, second.value);
  assert.equal([...cache.entries.keys()].join().includes("Private"), false);
  assert.match([...cache.entries.keys()][0], /^[a-f0-9]{64}$/);
  const stale = await cache.resolve({ provider: "CENSUS", key: "123 Private Street", now: now + 100, load: async () => { throw new Error("unavailable"); } });
  assert.equal(stale.status, "stale");
  assert.equal(stale.retrievedAt, first.retrievedAt);
  assert.equal(cache.getProviderHealth().CENSUS.consecutiveFailures, 1);
  assert.equal(cache.getProviderHealth().CENSUS.status, "unavailable");
  for (const key of ["2", "3"]) await cache.resolve({ provider: "TEST", key, now, load: async () => ({ key }) });
  assert.equal(cache.entries.size, 2);
});

test("Congress supports numeric zero, normalizes real metadata and ignores former membership", async () => {
  let request;
  const result = await getCurrentMembers("AK", 0, { cache: new ExternalDataCache(), apiKey: "fixture-secret", now, fetchImpl: async (url, options) => {
    request ||= { url: String(url), options };
    return response({ members: [
      { name: "House, Example", district: 0, bioguideId: "H000001", partyName: "Independent", depiction: { imageUrl: "https://www.congress.gov/portrait.jpg" }, terms: { item: [{ chamber: "House of Representatives", startYear: 2025 }] } },
      { name: "Senator, Current", bioguideId: "S000001", terms: { item: [{ chamber: "House of Representatives", startYear: 2015 }, { chamber: "Senate", startYear: 2025 }] } },
      { name: "Former Member", currentMember: false, terms: { item: [{ chamber: "Senate" }] } },
    ] });
  } });
  assert.equal(result.representative, "Example House");
  assert.equal(result.usRepresentative.externalId, "H000001");
  assert.equal(result.usRepresentative.district, "0");
  assert.equal(result.usRepresentative.party, "Independent");
  assert.deepEqual(result.senators, ["Current Senator"]);
  assert.equal(request.url.includes("fixture-secret"), false);
  assert.equal(request.options.headers["X-Api-Key"], "fixture-secret");
  assert.match(request.url, /currentMember=true/);
});

test("Open States separates state legislators from federal members and sends secret only in header", async () => {
  let request;
  const result = await getStateLegislators({ stateCode: "AK", latitude: 40, longitude: -70 }, { cache: new ExternalDataCache(), apiKey: "fixture-secret", now, fetchImpl: async (url, options) => {
    request = { url: String(url), options };
    return response({ results: [
      { id: "upper-1", name: "State Upper", current_role: { org_classification: "upper", district: "2" }, jurisdiction: { id: "ocd-jurisdiction/country:us/state:ak/government", classification: "state" }, sources: [{ url: "https://legis.state.ak.us/source" }], links: [{ url: "https://legis.state.ak.us/member" }] },
      { id: "lower-1", name: "State Lower", current_role: { org_classification: "lower", district: "4" }, jurisdiction: { id: "ocd-jurisdiction/country:us/state:ak/government", classification: "state" } },
      { name: "Federal Senator", current_role: { org_classification: "upper" }, jurisdiction: { id: "ocd-jurisdiction/country:us/government", classification: "country" } },
      { name: "Other State", current_role: { org_classification: "upper" }, jurisdiction: { id: "ocd-jurisdiction/country:us/state:tx/government" } },
      { name: "Old Member", jurisdiction: { classification: "state" } },
    ] });
  } });
  assert.equal(result.stateSenator.name, "State Upper");
  assert.equal(result.stateRepresentative.name, "State Lower");
  assert.equal(result.stateSenator.role, "STATE_SENATOR");
  assert.equal(result.stateSenator.officialUrl, "https://legis.state.ak.us/member");
  assert.equal(request.url.includes("fixture-secret"), false);
  assert.equal(request.options.headers["X-API-KEY"], "fixture-secret");
  assert.equal(result.governor, undefined);
});

test("governor adapter requires authoritative URLs and an explicit verified active state record", async () => {
  await assert.rejects(getCurrentGovernor("AK", { feedUrl: "https://example.com/feed", now }), /authoritative/);
  const result = await getCurrentGovernor("AK", { cache: new ExternalDataCache(), now, feedUrl: "https://state.ak.gov/governor-feed", fetchImpl: async () => response({ officials: [{ state: "AK", role: "GOVERNOR", name: "Verified Example", active: true, verifiedAt: "2026-10-01", sourceUrl: "https://gov.alaska.gov/" }] }) });
  assert.equal(result.governorOfficial.confidence, "OFFICIAL_GOVERNMENT");
  assert.equal(result.governorOfficial.verifiedAt, "2026-10-01");
  await assert.rejects(getCurrentGovernor("AK", { cache: new ExternalDataCache(), now, feedUrl: "https://state.ak.gov/feed", fetchImpl: async () => response([{ state: "AK", role: "GOVERNOR", name: "Invented", active: true }]) }), /verified current record/);
});

test("civic profile returns partial verified geography without leaking private addresses or inventing officials", async () => {
  const profile = await resolveCivicProfile({ address: "123 Example Street, Example City", zipCode: "99501" }, { cache: new ExternalDataCache(), environment: {}, now, fetchImpl: async () => response(census("AK")) });
  assert.equal(profile.district, "00");
  assert.equal(profile.stateSenateDistrict, "2");
  assert.equal(profile.representative, null);
  assert.deepEqual(profile.senators, []);
  assert.equal(profile.providerStatus.CONGRESS, "unavailable");
  assert.equal(profile.governorOfficial.source, "NGA_DATED_FALLBACK");
  assert.equal(profile.governorOfficial.verifiedAt, "2026-09-30");
  assert.equal(JSON.stringify(profile).includes("PRIVATE ADDRESS"), false);
  assert.equal(JSON.stringify(profile).includes("123 Example"), false);
});

test("a district change cannot retain the old representative, while same-state senators remain available", async () => {
  const previousProfile = { state: { code: "AK" }, district: "1", districtStatus: "confirmed", senators: ["Verified Senator"], representative: "Old District Member", verifiedAt: "2026-01-01" };
  const profile = await resolveCivicProfile({ address: "123 Example Street", zipCode: "99501", previousProfile }, { cache: new ExternalDataCache(), environment: {}, now, fetchImpl: async () => response(census("AK")) });
  assert.equal(profile.representative, null);
  assert.deepEqual(profile.senators, ["Verified Senator"]);
  assert.equal(profile.verifiedAt, new Date(now).toISOString());
  assert.equal(resolveCivicsQuestion(getCivicsQuestion(23), { profile, now }).lastVerified, "2026-01-01");
});

test("verified profile officeholders override dated fallback in both display and deterministic grading", () => {
  const profile = createCivicProfile({ state: { code: "NJ" }, districts: [0], officials: { governorOfficial: { name: "Verified Successor", sourceUrl: "https://nj.gov/governor/", verifiedAt: "2026-10-01", active: true } } });
  const question = resolveCivicsQuestion(getCivicsQuestion(61), { profile, now });
  assert.deepEqual(question.acceptedAnswers, ["Verified Successor"]);
  assert.equal(question.officialSource, "https://nj.gov/governor/");
  assert.equal(question.lastVerified, "2026-10-01");
  assert.equal(profile.districtStatus, "confirmed");
  assert.deepEqual(resolveCivicsQuestion(getCivicsQuestion(61), { profile, now: now + 200 * 86_400_000 }).acceptedAnswers, ["Verified Successor"]);
});

test("saved user/N400 address is reused and refresh follows address changes with a retry cooldown", async () => {
  assert.equal(knownCivicAddress({ userProfile: { streetAddress: "123 Main", city: "City", state: { code: "AK" }, zipCode: "99501" } }), "123 Main, City, AK, 99501");
  assert.equal(knownCivicAddress({ n400Profile: { answers: { P_ADDRESS_CURRENT: "456 Known Street, City, AK" } } }), "456 Known Street, City, AK");
  const profile = { zipCode: "99501", verifiedAt: new Date(now).toISOString(), districtStatus: "confirmed", senators: ["S"], representative: "R", addressUpdatedAt: "old", refreshAfter: new Date(now + 86400000).toISOString() };
  assert.equal(civicProfileNeedsRefresh(profile, { address: "123 Main", zipCode: "99501", addressUpdatedAt: "new", now }), true);
  assert.equal(civicProfileNeedsRefresh(profile, { address: "123 Main", zipCode: "99501", addressUpdatedAt: "old", now }), false);
  assert.equal(civicProfileNeedsRefresh({ ...profile, senators: [], refreshAttemptedAt: new Date(now).toISOString() }, { address: "123 Main", zipCode: "99501", now }), false);
  const cache = new ExternalDataCache();
  assert.equal(await civicAddressIdentity("123 Main, AK", "99501"), cache.keyFor("LOCATION", "123 main, ak, 99501"));
  assert.equal(civicProfileNeedsRefresh({ ...profile, locationIdentity: "old" }, { address: "123 Main", zipCode: "99501", locationIdentity: "changed", now }), true);
});
