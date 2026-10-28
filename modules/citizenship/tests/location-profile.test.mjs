import test from "node:test";
import assert from "node:assert/strict";
import { geocodeCivicAddress, getCurrentMembers, locationResolutionForZip } from "../server/civicLocationService.js";
test("a unique ZIP district is resolved without inventing an ambiguous match", () => {
  assert.equal(locationResolutionForZip({ zipCode: "12345", districts: ["1", "1"] }).district, "1");
  assert.equal(locationResolutionForZip({ zipCode: "12345", districts: [] }).district, null);
});
test("Census failures propagate and successful profiles omit street addresses", async () => {
  const location = await geocodeCivicAddress("123 Example Street, City", { fetchImpl: async () => ({ ok: true, json: async () => ({ result: { addressMatches: [{ matchedAddress: "private street address", geographies: { States: [{ STUSAB: "AK" }], "119th Congressional Districts": [{ CD119: "00" }] } }] } }) }) });
  assert.equal(location.stateCode, "AK");
  assert.equal(location.congressionalDistrict, "00");
  assert.equal(JSON.stringify(location).includes("private street address"), false);
  await assert.rejects(geocodeCivicAddress("123 Example Street", { fetchImpl: async () => ({ ok: false, status: 503 }) }));
});
test("at-large districts normalize leading zeros when resolving members", async () => {
  const result = await getCurrentMembers("AK", "00", { apiKey: "test-fixture", fetchImpl: async () => ({ ok: true, json: async () => ({ members: [{ name: "Example Member", district: 0, terms: { item: [{ chamber: "House of Representatives" }] } }] }) }) });
  assert.equal(result.representative, "Example Member");
});
test("multiple Census address matches cannot silently select the first district", async () => {
  const result = await geocodeCivicAddress("123 Ambiguous Street", { fetchImpl: async () => ({ ok: true, json: async () => ({ result: { addressMatches: [{ geographies: {} }, { geographies: {} }] } }) }) });
  assert.equal(result, null);
});
