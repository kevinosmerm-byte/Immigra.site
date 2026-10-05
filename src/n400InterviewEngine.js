const YES_PATTERN = /\b(yes|yeah|yep|correct|si|claro|correcto)\b|^(?:i do|i have|i am)[.!]?$/i;
const NO_PATTERN = /\b(no|never|not|don't|do not|haven't|have not|didn't|did not|nope|nunca|jamas)\b/i;
const UNKNOWN_PATTERN = /\b(not sure|unsure|uncertain|maybe|don't know|do not know|can't remember|cannot remember|no sé|no se|no recuerdo|no estoy segur[oa]|quizas|quizás|tal vez)\b/i;
const PROFILE_FLAGS = ["married", "has_children", "has_travel", "group_weapon_use_yes", "criminal_history_yes", "probation_or_parole", "selective_service_applicable", "served_us_military", "former_us_military", "name_changed", "previously_married"];
const QUESTION_INTENTS = {
  P_ID_FULL_NAME: "LEGAL_NAME", P_BIRTH_DATE: "DATE_OF_BIRTH", P_LPR_DATE: "PERMANENT_RESIDENCE_DATE",
  P_ADDRESS_CURRENT: "CURRENT_ADDRESS", P_ADDRESS_CITY_STATE: "CURRENT_CITY_STATE",
  P_TRAVEL_ANY: "TRAVEL_HISTORY", P_TRAVEL_LAST: "MOST_RECENT_TRIP",
};

function supplied(value) {
  return typeof value === "boolean" || (typeof value === "string" && Boolean(value.trim()));
}

function savedAnswers(profile = {}) {
  return Object.fromEntries(Object.entries(profile.answers || {}).filter(([key, value]) => (
    /^[PE]_/.test(key) && !key.startsWith("P_ANUMBER") && supplied(value)
  )));
}

/** Reuse confirmed facts; absent histories and uncertain answers remain unknown. */
export function getN400ApplicantProfile(context = {}) {
  const user = context.userProfile || {};
  const immigration = context.immigrationProfile || {};
  const n400 = context.n400Profile || {};
  const answers = savedAnswers(n400);
  const state = typeof user.state === "object" ? user.state?.name || user.state?.code : user.state;
  const mapped = {
    P_ID_FULL_NAME: user.firstName && user.lastName ? [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") : undefined,
    P_BIRTH_DATE: user.dateOfBirth,
    P_LPR_DATE: immigration.greenCardSince,
    P_ADDRESS_CURRENT: user.streetAddress ? [user.streetAddress, user.city, state, user.zipCode].filter(Boolean).join(", ") : undefined,
    P_ADDRESS_CITY_STATE: user.city && state ? `${user.city}, ${state}` : undefined,
  };
  const residences = Array.isArray(n400.residenceHistory) ? n400.residenceHistory : [];
  const previousResidence = [...residences].reverse().find(item => item?.toDate);
  if (previousResidence?.address) mapped.P_ADDRESS_PREVIOUS = [previousResidence.address, previousResidence.city, previousResidence.state, previousResidence.zipCode].filter(Boolean).join(", ");
  const jobs = Array.isArray(n400.employmentHistory) ? n400.employmentHistory : [];
  const currentJob = [...jobs].reverse().find(item => item && !item.toDate);
  if (currentJob?.employer) mapped.P_EMPLOYMENT_CURRENT = currentJob.employer;
  if (currentJob?.occupation) mapped.P_EMPLOYMENT_OCCUPATION = currentJob.occupation;
  const trips = Array.isArray(n400.travelHistory) ? n400.travelHistory : [];
  const lastTrip = [...trips].sort((a, b) => String(b?.departureDate || "").localeCompare(String(a?.departureDate || "")))[0];
  if (lastTrip?.departureDate) mapped.P_TRAVEL_LAST = lastTrip.departureDate;
  if (lastTrip?.country) mapped.P_TRAVEL_DEST = lastTrip.country;
  // A provided required-period answer takes precedence over historical trips.
  if (typeof n400.flags?.has_travel === "boolean") mapped.P_TRAVEL_ANY = n400.flags.has_travel ? "Yes" : "No";
  else if (trips.length) mapped.P_TRAVEL_ANY = "Yes";
  for (const [key, value] of Object.entries(mapped)) if (!supplied(answers[key]) && supplied(value)) answers[key] = value;
  let profile = { answers };
  for (const key of PROFILE_FLAGS) if (typeof n400.flags?.[key] === "boolean") profile[key] = n400.flags[key];
  for (const [id, answer] of Object.entries(answers)) profile = deriveProfile({ id, answerType: "yes_no" }, answer, profile);
  return profile;
}

function unique(values) {
  return [...new Set(values)];
}

function cloneState(state) {
  return {
    ...state,
    askedQuestionIDs: [...state.askedQuestionIDs],
    askedConceptIDs: [...state.askedConceptIDs],
    completedSubBlocks: [...state.completedSubBlocks],
    recentQuestionTexts: [...(state.recentQuestionTexts || [])],
    applicantProfile: {
      ...state.applicantProfile,
      answers: { ...(state.applicantProfile.answers || {}) },
    },
  };
}

export function parseYesNo(value) {
  if (typeof value === "boolean") return value;
  const answer = String(value || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!answer || UNKNOWN_PATTERN.test(answer)) return null;
  if (NO_PATTERN.test(answer) && YES_PATTERN.test(answer)) return null;
  if (NO_PATTERN.test(answer)) return false;
  if (YES_PATTERN.test(answer)) return true;
  return null;
}

export function conditionsMatch(conditions = {}, applicantProfile = {}) {
  const requirement = conditions?.requires;
  if (!requirement) return true;
  return applicantProfile[requirement] === true;
}

export function createN400InterviewState(bank, applicantProfile = {}, brainContext = {}) {
  const firstBlock = bank.interviewArchitecture.blockOrder[0];
  const firstSubBlock = bank.interviewArchitecture.subBlockOrder[firstBlock][0];
  const sharedProfile = getN400ApplicantProfile(brainContext);
  const combined = { ...sharedProfile, ...applicantProfile, answers: { ...sharedProfile.answers, ...(applicantProfile.answers || {}) } };
  return {
    currentBlock: firstBlock,
    currentSubBlock: firstSubBlock,
    askedQuestionIDs: [],
    askedConceptIDs: [],
    completedSubBlocks: [],
    recentQuestionTexts: [],
    applicantProfile: combined,
    priorityConceptIDs: [...(brainContext.learningProfile?.weakN400ConceptIds || []), ...(brainContext.learningProfile?.recentN400Mistakes || [])].filter(value => typeof value === "string"),
    caseStage: brainContext.caseProfile?.currentStage || null,
    previousAnswer: undefined,
    followUpDepth: 0,
    complete: false,
  };
}

function chooseWording(question, state) {
  const wordings = [question.canonicalPracticePrompt, ...(question.alternatePhrasings || [])].filter(Boolean);
  const index = (state.askedQuestionIDs.length + question.id.length) % wordings.length;
  return wordings[index];
}

function asPrompt(question, state) {
  const known = state.applicantProfile.answers[question.id];
  return {
    id: question.id,
    conceptId: question.concept || question.id,
    intent: QUESTION_INTENTS[question.id] || (question.concept || question.id).toUpperCase(),
    block: question.block,
    subBlock: question.subBlock,
    english: chooseWording(question, state),
    canonicalPracticePrompt: question.canonicalPracticePrompt,
    alternatePhrasings: question.alternatePhrasings || [],
    followUps: question.followUps || [],
    vocabulary: question.vocabulary || [],
    answerType: question.answerType,
    conditions: question.conditions || {},
    sourceRefs: question.sourceRefs || [],
    knownAnswer: supplied(known) ? typeof known === "boolean" ? known ? "Yes" : "No" : known : null,
    type: "n400",
    kind: "concept",
  };
}

export function selectNextN400Question(bank, interviewState) {
  const state = cloneState(interviewState);
  const architecture = bank.interviewArchitecture;
  let transition = "";

  while (!state.complete) {
    const candidates = bank.questions.filter((question) => (
      question.block === state.currentBlock
      && question.subBlock === state.currentSubBlock
      && !state.askedConceptIDs.includes(question.concept || question.id)
      && conditionsMatch(question.conditions, state.applicantProfile)
    ));

    if (candidates.length) {
      // Focus weak concepts only inside the current block; preserve the bank's order otherwise.
      const priorities = state.priorityConceptIDs || [];
      candidates.sort((a, b) => Number(priorities.includes(b.concept) || priorities.includes(b.id)) - Number(priorities.includes(a.concept) || priorities.includes(a.id)));
      return { state, question: asPrompt(candidates[0], state), transition };
    }

    state.completedSubBlocks = unique([...state.completedSubBlocks, `${state.currentBlock}.${state.currentSubBlock}`]);
    const subBlocks = architecture.subBlockOrder[state.currentBlock];
    const nextSubBlockIndex = subBlocks.indexOf(state.currentSubBlock) + 1;

    if (nextSubBlockIndex < subBlocks.length) {
      state.currentSubBlock = subBlocks[nextSubBlockIndex];
      if (state.currentBlock === "ELIGIBILITY" && state.currentSubBlock === "OATH_CONSTITUTION") {
        transition ||= architecture.transitionScripts.ELIGIBILITY_TO_OATH?.[0] || "";
      }
      continue;
    }

    const nextBlockIndex = architecture.blockOrder.indexOf(state.currentBlock) + 1;
    if (nextBlockIndex < architecture.blockOrder.length) {
      state.currentBlock = architecture.blockOrder[nextBlockIndex];
      state.currentSubBlock = architecture.subBlockOrder[state.currentBlock][0];
      transition ||= architecture.transitionScripts.PERSONAL_TO_ELIGIBILITY?.[0] || "";
      continue;
    }

    state.complete = true;
  }

  return { state, question: null, transition };
}

function deriveProfile(question, answer, profile) {
  const next = { ...profile };
  const yesNo = question.answerType === "yes_no" ? parseYesNo(answer) : null;
  const normalized = String(answer || "").trim().toLowerCase();

  if (question.id === "P_MARITAL_STATUS" && !UNKNOWN_PATTERN.test(normalized)) {
    if (/\b(divorced|widowed|separated|single|not married|divorciado|divorciada|soltero|soltera|viudo|viuda|separado|separada)\b/.test(normalized)) next.married = false;
    else if (/\b(married|casado|casada)\b/.test(normalized)) next.married = true;
  }
  if (question.id === "P_CHILDREN_COUNT" && yesNo !== null) next.has_children = yesNo;
  if (question.id === "P_PRIOR_MARRIAGES" && yesNo !== null) next.previously_married = yesNo;
  if (question.id === "P_TRAVEL_ANY" && yesNo !== null) next.has_travel = yesNo;
  if (question.id === "E_GROUP_WEAPON_USE" && yesNo !== null) next.group_weapon_use_yes = yesNo;
  if (["E_ARREST_CITE_DETAIN", "E_CRIME_UNARRESTED"].includes(question.id) && yesNo !== null) {
    const answers = next.answers || {};
    const otherId = question.id === "E_ARREST_CITE_DETAIN" ? "E_CRIME_UNARRESTED" : "E_ARREST_CITE_DETAIN";
    const otherAnswer = parseYesNo(answers[otherId]);
    if (yesNo || otherAnswer === true) next.criminal_history_yes = true;
    else if (otherAnswer === false) next.criminal_history_yes = false;
  }
  if (question.id === "E_CRIME_DISPOSITION" && !UNKNOWN_PATTERN.test(normalized)) {
    if (/\b(no probation|no parole|not on probation|not on parole|sin libertad condicional)\b/.test(normalized)) next.probation_or_parole = false;
    else if (/\b(probation|parole|suspended sentence|libertad condicional|sentencia suspendida)\b/.test(normalized)) next.probation_or_parole = true;
  }
  if (question.id === "E_SELECTIVE_MALE_18_25" && yesNo !== null) next.selective_service_applicable = yesNo;
  if (question.id === "E_MIL_SERVED" && yesNo !== null) next.served_us_military = yesNo;
  if (question.id === "E_MIL_CURRENT" && yesNo !== null && next.served_us_military) next.former_us_military = !yesNo;
  return next;
}

export function getContextualN400FollowUps(question, answer, applicantProfile = {}) {
  const followUps = question.followUps || [];
  if (!followUps.length) return [];
  if (question.answerType === "yes_no") {
    if (parseYesNo(answer) !== true) return [];
    if (question.id === "P_TRAVEL_ANY" && applicantProfile.has_travel === false) return [];
    return followUps.slice(0, question.block === "ELIGIBILITY" ? 2 : 1);
  }
  return question.block === "PERSONAL" && String(answer || "").trim() ? followUps.slice(0, 1) : [];
}

export function recordN400Answer(interviewState, question, answer) {
  const state = cloneState(interviewState);
  const conceptId = question.conceptId || question.id;
  state.askedQuestionIDs = unique([...state.askedQuestionIDs, question.id]);
  state.askedConceptIDs = unique([...state.askedConceptIDs, conceptId]);
  state.recentQuestionTexts = [...state.recentQuestionTexts, question.english].slice(-12);
  state.previousAnswer = answer;
  state.followUpDepth = 0;
  // A skipped prompt must not erase an already confirmed fact.
  if (String(answer || "").trim()) state.applicantProfile.answers[question.id] = answer;
  state.applicantProfile = {
    ...deriveProfile(question, answer, state.applicantProfile),
    answers: state.applicantProfile.answers,
  };
  return state;
}

export function recordN400FollowUpAnswer(interviewState, question, answer) {
  const state = cloneState(interviewState);
  state.followUpDepth += 1;
  state.previousAnswer = answer;
  const key = `${question.parentId}:follow-up:${question.followUpIndex}`;
  state.askedQuestionIDs = unique([...state.askedQuestionIDs, key]);
  state.recentQuestionTexts = [...state.recentQuestionTexts, question.english].slice(-12);
  if (String(answer || "").trim()) state.applicantProfile.answers[key] = answer;
  return state;
}

export function createN400FollowUpPrompt(parentQuestion, text, index, applicantProfile = {}) {
  const id = `${parentQuestion.id}:follow-up:${index}`;
  return {
    id,
    parentId: parentQuestion.id,
    conceptId: parentQuestion.conceptId,
    intent: `${parentQuestion.intent || parentQuestion.conceptId}:FOLLOW_UP:${index}`,
    block: parentQuestion.block,
    subBlock: parentQuestion.subBlock,
    english: text,
    answerType: "text",
    type: "n400",
    kind: "followup",
    followUpIndex: index,
    knownAnswer: applicantProfile.answers?.[id] || null,
  };
}

/** Called only after an explicit user confirmation; never persist the session wholesale. */
export function confirmN400ProfileAnswer(profile = {}, question, answer) {
  if (!question?.id || !/^[PE]_/.test(question.id) || question.id.startsWith("P_ANUMBER") || !String(answer || "").trim()) return null;
  if (question.answerType === "yes_no" && parseYesNo(answer) === null) return null;
  const answers = { ...savedAnswers(profile), [question.id]: String(answer).trim() };
  const applicant = getN400ApplicantProfile({ n400Profile: { ...profile, answers } });
  const flags = Object.fromEntries(PROFILE_FLAGS.filter(key => typeof applicant[key] === "boolean").map(key => [key, applicant[key]]));
  return { ...profile, answers, flags };
}
