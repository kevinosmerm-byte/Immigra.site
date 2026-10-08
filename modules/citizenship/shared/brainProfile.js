// Shared allowlist for on-device and encrypted account profiles. Unknown facts
// remain absent. Documents, A-numbers and arbitrary application state are rejected.
export const BRAIN_PROFILE_VERSION = 1;
export const CASE_STAGES = ["PREPARING_N400", "N400_FILED", "RECEIPT_RECEIVED", "BIOMETRICS_PENDING", "BIOMETRICS_COMPLETED", "INTERVIEW_PENDING", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "APPROVED", "OATH_SCHEDULED", "OATH_COMPLETED", "CITIZEN", "ADDITIONAL_EVIDENCE"];
const FLAGS = ["married", "has_children", "has_travel", "group_weapon_use_yes", "criminal_history_yes", "probation_or_parole", "selective_service_applicable", "served_us_military", "former_us_military", "name_changed", "previously_married"];
const CONFIDENCES = ["OFFICIAL_USCIS", "USCIS_NOTICE", "OFFICIAL_GOVERNMENT", "USER_CONFIRMED", "ESTIMATED", "UNVERIFIED"];
const SHARED_APPLICATION_FIELDS = ["interviewDate", "interviewTime", "oathDate", "oathTime", "fieldOffice", "receiptNumber"];
const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const text = (value, limit = 160) => typeof value === "string" ? value.trim().slice(0, limit) : "";
function date(value) {
  const clean = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(clean) && !Number.isNaN(Date.parse(clean)) && new Date(clean).toISOString().slice(0, 10) === clean ? clean : "";
}
function timestamp(value) { const clean = text(value, 40); return clean && !Number.isNaN(Date.parse(clean)) ? new Date(clean).toISOString() : ""; }
function fields(value, strings = [], dates = [], times = []) {
  const input = object(value), result = {};
  for (const key of strings) { const clean = text(input[key]); if (clean) result[key] = clean; }
  for (const key of dates) { const clean = date(input[key]); if (clean) result[key] = clean; }
  for (const key of times) { const clean = text(input[key], 5); if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(clean)) result[key] = clean; }
  return result;
}
function history(value, strings, dates) {
  return Array.isArray(value) ? value.slice(0, 50).map(item => fields(item, strings, dates)).filter(item => Object.keys(item).length) : [];
}
export function sanitizeBrainProfile(value = {}) {
  const input = object(value);
  const userProfile = fields(input.userProfile, ["firstName", "middleName", "lastName", "streetAddress", "city", "state", "zipCode"], ["dateOfBirth"]);
  if (userProfile.zipCode && !/^\d{5}(?:-\d{4})?$/.test(userProfile.zipCode)) delete userProfile.zipCode;
  const addressUpdatedAt = timestamp(input.userProfile?.addressUpdatedAt); if (addressUpdatedAt) userProfile.addressUpdatedAt = addressUpdatedAt;
  const immigrationProfile = fields(input.immigrationProfile, ["eligibilityBasis", "fieldOffice"], ["greenCardSince", "filingDate", "n400FilingDate", "interviewDate", "oathDate"], ["interviewTime", "oathTime"]);
  const receipt = text(input.immigrationProfile?.receiptNumber, 13).toUpperCase();
  if (/^[A-Z]{3}\d{10}$/.test(receipt)) immigrationProfile.receiptNumber = receipt;
  const n400 = object(input.n400Profile);
  const answers = {};
  for (const [key, value] of Object.entries(object(n400.answers)).slice(0, 250)) {
    if (/^(?:P|E)_[A-Z0-9_]+(?::follow-up:\d{1,2})?$/.test(key) && !key.startsWith("P_ANUMBER")) {
      const clean = text(value, 1000); if (clean) answers[key] = clean;
    }
  }
  const flags = {};
  for (const key of FLAGS) if (typeof n400.flags?.[key] === "boolean") flags[key] = n400.flags[key];
  const n400Profile = { answers, flags,
    residenceHistory: history(n400.residenceHistory, ["address", "city", "state", "zipCode"], ["fromDate", "toDate"]),
    travelHistory: history(n400.travelHistory, ["country"], ["departureDate", "returnDate"]),
    employmentHistory: history(n400.employmentHistory, ["employer", "occupation"], ["fromDate", "toDate"]),
  };
  const caseInput = object(input.caseProfile);
  const caseProfile = fields(caseInput, ["fieldOffice", "appointmentLocation", "lastConfirmedStatus"], ["filingDate", "interviewDate", "oathDate", "biometricsDate", "evidenceDeadline", "lastConfirmedStatusDate"], ["interviewTime", "oathTime", "biometricsTime"]);
  if (Object.keys(caseInput).length) caseProfile.formType = "N-400";
  if (CASE_STAGES.includes(caseInput.currentStage)) caseProfile.currentStage = caseInput.currentStage;
  const caseReceipt = text(caseInput.receiptNumber, 13).toUpperCase();
  if (/^[A-Z]{3}\d{10}$/.test(caseReceipt)) caseProfile.receiptNumber = caseReceipt;
  for (const key of ["source", "confidence"]) if (CONFIDENCES.includes(caseInput[key])) caseProfile[key] = caseInput[key];
  const lastCheckedAt = timestamp(caseInput.lastCheckedAt); if (lastCheckedAt) caseProfile.lastCheckedAt = lastCheckedAt;
  caseProfile.events = (Array.isArray(caseInput.events) ? caseInput.events : []).slice(-100).map(item => {
    const event = fields(item, ["id", "eventType", "title"], ["eventDate"]);
    for (const key of ["source", "confidence"]) if (CONFIDENCES.includes(item?.[key])) event[key] = item[key];
    const createdAt = timestamp(item?.createdAt); if (createdAt) event.createdAt = createdAt;
    return event;
  }).filter(event => event.id && event.eventType);
  caseProfile.notices = (Array.isArray(caseInput.notices) ? caseInput.notices : []).filter(item => timestamp(item?.confirmedAt)).slice(-100).map(item => ({
    ...fields(item, ["id", "noticeType", "location", "fieldOffice"], ["noticeDate", "appointmentDate", "deadline"], ["appointmentTime"]),
    confirmedAt: timestamp(item.confirmedAt), source: "USCIS_NOTICE", confidence: "USER_CONFIRMED",
  })).filter(notice => notice.id && notice.noticeType);
  caseProfile.checklistCompletedIds = [...new Set((Array.isArray(caseInput.checklistCompletedIds) ? caseInput.checklistCompletedIds : []).filter(id => typeof id === "string" && /^[a-zA-Z0-9._:-]{1,100}$/.test(id)))].slice(0, 100);
  // Legacy snapshots may have a date only in Journey or only in Profile.
  // Confirmed case facts are canonical when both old domains disagree.
  for (const key of SHARED_APPLICATION_FIELDS) {
    const known = caseProfile[key] ?? immigrationProfile[key];
    if (known !== undefined) { caseProfile[key] = known; immigrationProfile[key] = known; }
  }
  const filingDate = caseProfile.filingDate ?? immigrationProfile.filingDate ?? immigrationProfile.n400FilingDate;
  if (filingDate !== undefined) {
    caseProfile.filingDate = filingDate;
    immigrationProfile.filingDate = filingDate;
    immigrationProfile.n400FilingDate = filingDate;
  }
  const minutes = Number(input.preferences?.availableStudyMinutes);
  const preferences = { availableStudyMinutes: Number.isFinite(minutes) && minutes > 0 ? Math.max(1, Math.min(120, Math.round(minutes))) : 8 };
  if (["en", "es"].includes(input.preferences?.language)) preferences.language = input.preferences.language;
  return { userProfile, immigrationProfile, n400Profile, caseProfile, preferences };
}

export function mergeBrainProfile(current, patch = {}) {
  const input = object(patch), previous = sanitizeBrainProfile(current);
  const next = { ...previous };
  for (const key of ["userProfile", "immigrationProfile", "caseProfile", "preferences"]) {
    if (input[key]) next[key] = { ...previous[key], ...object(input[key]) };
  }
  if (input.n400Profile) next.n400Profile = {
    ...previous.n400Profile, ...object(input.n400Profile),
    answers: { ...previous.n400Profile.answers, ...object(input.n400Profile.answers) },
    flags: { ...previous.n400Profile.flags, ...object(input.n400Profile.flags) },
  };
  // An explicit edit (including a blank/null clear) updates both views before
  // sanitization. Fields absent from a patch never clear previously supplied facts.
  const casePatch = object(input.caseProfile), immigrationPatch = object(input.immigrationProfile);
  for (const key of SHARED_APPLICATION_FIELDS) {
    const source = Object.hasOwn(casePatch, key) ? casePatch : Object.hasOwn(immigrationPatch, key) ? immigrationPatch : null;
    if (source) { next.caseProfile = { ...next.caseProfile, [key]: source[key] }; next.immigrationProfile = { ...next.immigrationProfile, [key]: source[key] }; }
  }
  const filingEdit = Object.hasOwn(casePatch, "filingDate") ? casePatch.filingDate
    : Object.hasOwn(immigrationPatch, "filingDate") ? immigrationPatch.filingDate
    : Object.hasOwn(immigrationPatch, "n400FilingDate") ? immigrationPatch.n400FilingDate : undefined;
  if (Object.hasOwn(casePatch, "filingDate") || Object.hasOwn(immigrationPatch, "filingDate") || Object.hasOwn(immigrationPatch, "n400FilingDate")) {
    next.caseProfile = { ...next.caseProfile, filingDate: filingEdit };
    next.immigrationProfile = { ...next.immigrationProfile, filingDate: filingEdit, n400FilingDate: filingEdit };
  }
  const safe = sanitizeBrainProfile(next);
  const mappings = {
    userProfile: { firstName: ["P_ID_FULL_NAME"], middleName: ["P_ID_FULL_NAME"], lastName: ["P_ID_FULL_NAME"], dateOfBirth: ["P_BIRTH_DATE"], streetAddress: ["P_ADDRESS_CURRENT"], city: ["P_ADDRESS_CURRENT", "P_ADDRESS_CITY_STATE"], state: ["P_ADDRESS_CURRENT", "P_ADDRESS_CITY_STATE"], zipCode: ["P_ADDRESS_CURRENT"] },
    immigrationProfile: { greenCardSince: ["P_LPR_DATE"] },
  };
  const invalidated = new Set();
  for (const [domain, fields] of Object.entries(mappings)) for (const [field, ids] of Object.entries(fields)) {
    if (Object.hasOwn(object(input[domain]), field) && previous[domain][field] !== safe[domain][field]) for (const id of ids) invalidated.add(id);
  }
  const flagAnswers = {
    married: ["P_MARITAL_STATUS"], has_children: ["P_CHILDREN_COUNT"], has_travel: ["P_TRAVEL_ANY"],
    group_weapon_use_yes: ["E_GROUP_WEAPON_USE"], criminal_history_yes: ["E_ARREST_CITE_DETAIN", "E_CRIME_UNARRESTED"],
    probation_or_parole: ["E_CRIME_DISPOSITION"], selective_service_applicable: ["E_SELECTIVE_MALE_18_25"],
    served_us_military: ["E_MIL_SERVED"], former_us_military: ["E_MIL_CURRENT"],
    // Historical name changes concern names already used. The separate
    // P_ID_NAME_CHANGE prompt asks about a future legal name-change request.
    name_changed: ["P_ID_OTHER_NAMES"], previously_married: ["P_PRIOR_MARRIAGES"],
  };
  for (const [flag, ids] of Object.entries(flagAnswers)) {
    if (Object.hasOwn(object(input.n400Profile?.flags), flag) && previous.n400Profile.flags[flag] !== safe.n400Profile.flags[flag]) for (const id of ids) invalidated.add(id);
  }
  const historyAnswers = {
    residenceHistory: ["P_ADDRESS_PREVIOUS", "P_ADDRESS_HISTORY_MORE"],
    employmentHistory: ["P_EMPLOYMENT_CURRENT", "P_EMPLOYMENT_OCCUPATION", "P_EMPLOYMENT_PREVIOUS"],
    travelHistory: ["P_TRAVEL_ANY", "P_TRAVEL_LAST", "P_TRAVEL_DEST", "P_TRAVEL_LENGTH", "P_TRAVEL_MORE"],
  };
  for (const [history, ids] of Object.entries(historyAnswers)) {
    if (Object.hasOwn(object(input.n400Profile), history) && JSON.stringify(previous.n400Profile[history]) !== JSON.stringify(safe.n400Profile[history])) for (const id of ids) invalidated.add(id);
  }
  // Confirmed free-form practice facts are kept until their corresponding
  // structured fact is actually edited. A stale full N-400 snapshot cannot
  // restore an older name/address after a Profile or Civic editor changes it.
  for (const key of Object.keys(safe.n400Profile.answers)) {
    // Remembering one practice answer can derive a new flag in the same patch.
    // That newly confirmed answer is newer than the previous stored fact;
    // copied answers equal to the previous snapshot remain eligible to expire.
    const freshlyConfirmed = Object.hasOwn(object(input.n400Profile?.answers), key)
      && safe.n400Profile.answers[key] !== previous.n400Profile.answers[key];
    if (!freshlyConfirmed && [...invalidated].some(id => key === id || key.startsWith(`${id}:follow-up:`))) delete safe.n400Profile.answers[key];
  }
  return safe;
}

// Editors submit the fields they actually changed, so a form's unchanged case
// copy cannot override a newly edited immigration date in the same snapshot.
export function diffBrainProfile(current, draft) {
  const previous = sanitizeBrainProfile(current), patch = {};
  for (const domain of ["userProfile", "immigrationProfile", "n400Profile", "caseProfile", "preferences"]) {
    const changes = Object.fromEntries(Object.entries(object(draft?.[domain])).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(previous[domain][key])));
    if (Object.keys(changes).length) patch[domain] = changes;
  }
  return patch;
}
