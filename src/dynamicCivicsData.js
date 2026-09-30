const CAPITALS = {
  AL: "Montgomery", AK: "Juneau", AZ: "Phoenix", AR: "Little Rock", CA: "Sacramento", CO: "Denver", CT: "Hartford", DE: "Dover", FL: "Tallahassee", GA: "Atlanta",
  HI: "Honolulu", ID: "Boise", IL: "Springfield", IN: "Indianapolis", IA: "Des Moines", KS: "Topeka", KY: "Frankfort", LA: "Baton Rouge", ME: "Augusta", MD: "Annapolis",
  MA: "Boston", MI: "Lansing", MN: "Saint Paul", MS: "Jackson", MO: "Jefferson City", MT: "Helena", NE: "Lincoln", NV: "Carson City", NH: "Concord", NJ: "Trenton",
  NM: "Santa Fe", NY: "Albany", NC: "Raleigh", ND: "Bismarck", OH: "Columbus", OK: "Oklahoma City", OR: "Salem", PA: "Harrisburg", RI: "Providence", SC: "Columbia",
  SD: "Pierre", TN: "Nashville", TX: "Austin", UT: "Salt Lake City", VT: "Montpelier", VA: "Richmond", WA: "Olympia", WV: "Charleston", WI: "Madison", WY: "Cheyenne",
};

// Primary roster of the National Governors Association, checked 2026-09-30.
const GOVERNORS = Object.freeze({
  AL: "Kay Ivey", AK: "Mike Dunleavy", AZ: "Katie Hobbs", AR: "Sarah Huckabee Sanders",
  CA: "Gavin Newsom", CO: "Jared Polis", CT: "Ned Lamont", DE: "Matt Meyer",
  FL: "Ron DeSantis", GA: "Brian Kemp", HI: "Josh Green", ID: "Brad Little",
  IL: "JB Pritzker", IN: "Mike Braun", IA: "Kim Reynolds", KS: "Laura Kelly",
  KY: "Andy Beshear", LA: "Jeff Landry", ME: "Janet Mills", MD: "Wes Moore",
  MA: "Maura Healey", MI: "Gretchen Whitmer", MN: "Tim Walz", MS: "Tate Reeves",
  MO: "Mike Kehoe", MT: "Greg Gianforte", NE: "Jim Pillen", NV: "Joe Lombardo",
  NH: "Kelly Ayotte", NJ: "Mikie Sherrill", NM: "Michelle Lujan Grisham", NY: "Kathy Hochul",
  NC: "Josh Stein", ND: "Kelly Armstrong", OH: "Mike DeWine", OK: "Kevin Stitt",
  OR: "Tina Kotek", PA: "Josh Shapiro", RI: "Dan McKee", SC: "Henry McMaster",
  SD: "Larry Rhoden", TN: "Bill Lee", TX: "Greg Abbott", UT: "Spencer Cox",
  VT: "Phil Scott", VA: "Abigail Spanberger", WA: "Bob Ferguson", WV: "Patrick Morrisey",
  WI: "Tony Evers", WY: "Mark Gordon",
});
export const stateCivicsTable = Object.freeze(Object.entries(CAPITALS).map(([stateCode, capital]) => Object.freeze({
  stateCode, capital, governor: GOVERNORS[stateCode] || null,
  sourceUrl: "https://www.usa.gov/state-capitals",
  capitalVerifiedAt: "2026-09-23", governorVerifiedAt: "2026-09-30", governorSource: "https://www.nga.org/governors/",
})));

// Manually verified against the official offices on 2026-09-30. No scheduled updater.
// Keep available answers until explicitly updated; verification dates remain traceable.
export const nationalCivicsTable = Object.freeze({
  president: { answers: ["Donald J. Trump", "Donald Trump", "Trump"], verifiedAt: "2026-09-30", sourceUrl: "https://www.whitehouse.gov/administration/" },
  vicePresident: { answers: ["JD Vance", "Vance"], verifiedAt: "2026-09-30", sourceUrl: "https://www.whitehouse.gov/administration/" },
  speakerOfTheHouse: { answers: ["Mike Johnson", "Johnson"], verifiedAt: "2026-09-30", sourceUrl: "https://www.speaker.gov/" },
  chiefJustice: { answers: ["John G. Roberts, Jr.", "John Roberts", "Roberts"], verifiedAt: "2026-09-30", sourceUrl: "https://www.supremecourt.gov/about/justices.aspx" },
});

export function currentDynamicAnswers(record, now = Date.now(), maxAgeDays = Infinity) {
  if (!record?.verifiedAt || !Array.isArray(record.answers)) return [];
  const date = /^\d{4}-\d{2}-\d{2}$/.test(record.verifiedAt) ? `${record.verifiedAt}T00:00:00Z` : record.verifiedAt;
  const age = now - Date.parse(date);
  if (!Number.isFinite(age) || age < 0 || age > maxAgeDays * 86_400_000) return [];
  return record.answers.filter((answer) => typeof answer === "string" && answer.trim());
}

export const currentOfficials = nationalCivicsTable;

/** Resolves only verified civic facts. Personal N-400 answers never enter this layer. */
export function resolveDynamicAnswers(key, { officials = currentOfficials, profile = null, now = Date.now() } = {}) {
  if (Object.hasOwn(officials, key)) return currentDynamicAnswers(officials[key], now);
  if (!profile) return [];
  const state = stateCivicsTable.find(item => item.stateCode === profile.state?.code);
  if (key === "stateGovernor" && state?.governor) return currentDynamicAnswers({ answers: [state.governor], verifiedAt: state.governorVerifiedAt }, now);
  const values = {
    stateSenators: profile.senators,
    representative: profile.districtStatus === "confirmed" ? [profile.representative] : [],
    stateGovernor: [profile.governor],
    stateCapital: [profile.state?.capital],
  };
  return currentDynamicAnswers({ answers: values[key] || [], verifiedAt: profile.verifiedAt }, now);
}

export function resolveCivicsQuestion(question, context) {
  if (!question?.isDynamic) return question;
  const record = (context?.officials || currentOfficials)[question.dynamicAnswerKey];
  const state = question.dynamicAnswerKey === "stateGovernor" ? stateCivicsTable.find(item => item.stateCode === context?.profile?.state?.code) : null;
  return { ...question, acceptedAnswers: resolveDynamicAnswers(question.dynamicAnswerKey, context), aliases: [], lastVerified: record?.verifiedAt || state?.governorVerifiedAt || context?.profile?.verifiedAt || null, officialSource: record?.sourceUrl || state?.governorSource || context?.profile?.source || question.officialSource };
}
