const YES_PATTERN = /\b(yes|yeah|yep|correct|i do|i have|i am|sí|si|claro|correcto)\b/i;
const NO_PATTERN = /\b(no|never|not|don't|do not|haven't|have not|didn't|did not|nope|nunca|jamás)\b/i;

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
  const answer = String(value || "").trim();
  if (!answer) return null;
  if (NO_PATTERN.test(answer)) return false;
  if (YES_PATTERN.test(answer)) return true;
  return null;
}

export function conditionsMatch(conditions = {}, applicantProfile = {}) {
  const requirement = conditions?.requires;
  if (!requirement) return true;
  return applicantProfile[requirement] === true;
}

export function createN400InterviewState(bank, applicantProfile = {}) {
  const firstBlock = bank.interviewArchitecture.blockOrder[0];
  const firstSubBlock = bank.interviewArchitecture.subBlockOrder[firstBlock][0];
  return {
    currentBlock: firstBlock,
    currentSubBlock: firstSubBlock,
    askedQuestionIDs: [],
    askedConceptIDs: [],
    completedSubBlocks: [],
    recentQuestionTexts: [],
    applicantProfile: { ...applicantProfile, answers: { ...(applicantProfile.answers || {}) } },
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
  return {
    id: question.id,
    conceptId: question.concept || question.id,
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

  if (question.id === "P_MARITAL_STATUS") {
    next.married = /\b(married|spouse|husband|wife|casado|casada)\b/.test(normalized)
      && !/\b(divorced|widowed|separated|single|not married|divorciado|divorciada|soltero|soltera)\b/.test(normalized);
  }
  if (question.id === "P_CHILDREN_COUNT" && yesNo !== null) next.has_children = yesNo;
  if (question.id === "P_TRAVEL_ANY" && yesNo !== null) next.has_travel = yesNo;
  if (question.id === "E_GROUP_WEAPON_USE" && yesNo !== null) next.group_weapon_use_yes = yesNo;
  if (["E_ARREST_CITE_DETAIN", "E_CRIME_UNARRESTED"].includes(question.id) && yesNo !== null) {
    next.criminal_history_yes = Boolean(next.criminal_history_yes || yesNo);
  }
  if (question.id === "E_CRIME_DISPOSITION") {
    next.probation_or_parole = /\b(probation|parole|suspended sentence|libertad condicional|sentencia suspendida)\b/.test(normalized);
  }
  if (question.id === "E_SELECTIVE_MALE_18_25" && yesNo !== null) next.selective_service_applicable = yesNo;
  if (question.id === "E_MIL_SERVED" && yesNo !== null) next.served_us_military = yesNo;
  if (question.id === "E_MIL_CURRENT" && yesNo !== null && next.served_us_military) next.former_us_military = !yesNo;
  return next;
}

export function getContextualN400FollowUps(question, answer) {
  const followUps = question.followUps || [];
  if (!followUps.length) return [];
  if (question.answerType === "yes_no") {
    return parseYesNo(answer) === true ? followUps.slice(0, question.block === "ELIGIBILITY" ? 2 : 1) : [];
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
  state.applicantProfile.answers[question.id] = answer;
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
  state.applicantProfile.answers[key] = answer;
  return state;
}

export function createN400FollowUpPrompt(parentQuestion, text, index) {
  return {
    id: `${parentQuestion.id}:follow-up:${index}`,
    parentId: parentQuestion.id,
    conceptId: parentQuestion.conceptId,
    block: parentQuestion.block,
    subBlock: parentQuestion.subBlock,
    english: text,
    answerType: "text",
    type: "n400",
    kind: "followup",
    followUpIndex: index,
  };
}
