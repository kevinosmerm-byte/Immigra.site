const CAPITALS = {
  AL: "Montgomery", AK: "Juneau", AZ: "Phoenix", AR: "Little Rock", CA: "Sacramento", CO: "Denver", CT: "Hartford", DE: "Dover", FL: "Tallahassee", GA: "Atlanta",
  HI: "Honolulu", ID: "Boise", IL: "Springfield", IN: "Indianapolis", IA: "Des Moines", KS: "Topeka", KY: "Frankfort", LA: "Baton Rouge", ME: "Augusta", MD: "Annapolis",
  MA: "Boston", MI: "Lansing", MN: "Saint Paul", MS: "Jackson", MO: "Jefferson City", MT: "Helena", NE: "Lincoln", NV: "Carson City", NH: "Concord", NJ: "Trenton",
  NM: "Santa Fe", NY: "Albany", NC: "Raleigh", ND: "Bismarck", OH: "Columbus", OK: "Oklahoma City", OR: "Salem", PA: "Harrisburg", RI: "Providence", SC: "Columbia",
  SD: "Pierre", TN: "Nashville", TX: "Austin", UT: "Salt Lake City", VT: "Montpelier", VA: "Richmond", WA: "Olympia", WV: "Charleston", WI: "Madison", WY: "Cheyenne",
};

const GOVERNORS = {
  AL: "Kay Ivey", AK: "Mike Dunleavy", AZ: "Katie Hobbs", AR: "Sarah Huckabee Sanders", CA: "Gavin Newsom", CO: "Jared Polis", CT: "Ned Lamont", DE: "Matt Meyer", FL: "Ron DeSantis", GA: "Brian Kemp",
  HI: "Josh Green", ID: "Brad Little", IL: "JB Pritzker", IN: "Mike Braun", IA: "Kim Reynolds", KS: "Laura Kelly", KY: "Andy Beshear", LA: "Jeff Landry", ME: "Janet Mills", MD: "Wes Moore",
  MA: "Maura Healey", MI: "Gretchen Whitmer", MN: "Tim Walz", MS: "Tate Reeves", MO: "Mike Kehoe", MT: "Greg Gianforte", NE: "Jim Pillen", NV: "Joe Lombardo", NH: "Kelly Ayotte", NJ: "Mikie Sherrill",
  NM: "Michelle Lujan Grisham", NY: "Kathy Hochul", NC: "Josh Stein", ND: "Kelly Armstrong", OH: "Mike DeWine", OK: "Kevin Stitt", OR: "Tina Kotek", PA: "Josh Shapiro", RI: "Dan McKee", SC: "Henry McMaster",
  SD: "Larry Rhoden", TN: "Bill Lee", TX: "Greg Abbott", UT: "Spencer Cox", VT: "Phil Scott", VA: "Abigail Spanberger", WA: "Bob Ferguson", WV: "Patrick Morrisey", WI: "Tony Evers", WY: "Mark Gordon",
};

const GOVERNORS_VERIFIED_AT = "2026-10-20";
const GOVERNORS_SOURCE_URL = "https://www.nga.org/governors/";

export const stateCivicsTable = Object.freeze(Object.entries(CAPITALS).map(([stateCode, capital]) => Object.freeze({
  stateCode, capital, governor: GOVERNORS[stateCode] || null,
  sourceUrl: "https://www.usa.gov/state-capitals",
  governorSourceUrl: GOVERNORS_SOURCE_URL,
  capitalVerifiedAt: "2026-09-23", governorVerifiedAt: GOVERNORS[stateCode] ? GOVERNORS_VERIFIED_AT : null,
})));

// Verified national answers expire automatically; re-check USCIS before extending these dates.
export const nationalCivicsTable = Object.freeze({
  president: { answers: ["Donald J. Trump", "Donald Trump", "Trump"], verifiedAt: "2026-10-20", sourceUrl: "https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates" },
  vicePresident: { answers: ["JD Vance", "Vance"], verifiedAt: "2026-10-20", sourceUrl: "https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates" },
  speakerOfTheHouse: { answers: ["Mike Johnson", "Johnson", "James Michael Johnson"], verifiedAt: "2026-10-20", sourceUrl: "https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates" },
  chiefJustice: { answers: ["John Roberts", "John G. Roberts, Jr.", "Roberts"], verifiedAt: "2026-10-20", sourceUrl: "https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates" },
});

const stateByCode = new Map(stateCivicsTable.map((record) => [record.stateCode, record]));

export function getStateCivicsRecord(stateCode) {
  return stateByCode.get(String(stateCode || "").trim().toUpperCase()) || null;
}

export function currentDynamicAnswers(record, now = Date.now(), maxAgeDays = 31) {
  if (!record?.verifiedAt || !Array.isArray(record.answers)) return [];
  const age = now - Date.parse(`${record.verifiedAt}T00:00:00Z`);
  if (!Number.isFinite(age) || age < 0 || age > maxAgeDays * 86_400_000) return [];
  return record.answers;
}

export function getNationalDynamicAnswers(dynamicAnswerKey, now = Date.now()) {
  return currentDynamicAnswers(nationalCivicsTable[dynamicAnswerKey], now);
}

export function getDynamicCivicsAnswers(dynamicAnswerKey, profile, now = Date.now()) {
  const national = getNationalDynamicAnswers(dynamicAnswerKey, now);
  if (national.length) return national;
  const governorAnswers = currentDynamicAnswers({
    answers: profile?.governor ? [profile.governor] : [],
    verifiedAt: profile?.governorVerifiedAt,
  }, now);
  const profileAnswers = {
    stateSenators: profile?.senators,
    representative: profile?.representative ? [profile.representative] : [],
    stateGovernor: governorAnswers,
    stateCapital: profile?.state?.capital ? [profile.state.capital] : [],
  };
  return Array.isArray(profileAnswers[dynamicAnswerKey]) ? profileAnswers[dynamicAnswerKey].filter(Boolean) : [];
}
