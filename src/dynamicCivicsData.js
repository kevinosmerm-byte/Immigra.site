const CAPITALS = {
  AL: "Montgomery", AK: "Juneau", AZ: "Phoenix", AR: "Little Rock", CA: "Sacramento", CO: "Denver", CT: "Hartford", DE: "Dover", FL: "Tallahassee", GA: "Atlanta",
  HI: "Honolulu", ID: "Boise", IL: "Springfield", IN: "Indianapolis", IA: "Des Moines", KS: "Topeka", KY: "Frankfort", LA: "Baton Rouge", ME: "Augusta", MD: "Annapolis",
  MA: "Boston", MI: "Lansing", MN: "Saint Paul", MS: "Jackson", MO: "Jefferson City", MT: "Helena", NE: "Lincoln", NV: "Carson City", NH: "Concord", NJ: "Trenton",
  NM: "Santa Fe", NY: "Albany", NC: "Raleigh", ND: "Bismarck", OH: "Columbus", OK: "Oklahoma City", OR: "Salem", PA: "Harrisburg", RI: "Providence", SC: "Columbia",
  SD: "Pierre", TN: "Nashville", TX: "Austin", UT: "Salt Lake City", VT: "Montpelier", VA: "Richmond", WA: "Olympia", WV: "Charleston", WI: "Madison", WY: "Cheyenne",
};

export const stateCivicsTable = Object.freeze(Object.entries(CAPITALS).map(([stateCode, capital]) => Object.freeze({
  stateCode, capital, governor: null,
  sourceUrl: "https://www.usa.gov/state-capitals",
  capitalVerifiedAt: "2026-09-23", governorVerifiedAt: null,
})));

// Current officeholders are intentionally null until an administrator verifies USCIS updates.
export const nationalCivicsTable = Object.freeze({
  president: { answers: [], verifiedAt: null, sourceUrl: "https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates" },
  vicePresident: { answers: [], verifiedAt: null, sourceUrl: "https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates" },
  speakerOfTheHouse: { answers: [], verifiedAt: null, sourceUrl: "https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates" },
  chiefJustice: { answers: [], verifiedAt: null, sourceUrl: "https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates" },
});

export function currentDynamicAnswers(record, now = Date.now(), maxAgeDays = 31) {
  if (!record?.verifiedAt || !Array.isArray(record.answers)) return [];
  const age = now - Date.parse(`${record.verifiedAt}T00:00:00Z`);
  if (!Number.isFinite(age) || age < 0 || age > maxAgeDays * 86_400_000) return [];
  return record.answers;
}
