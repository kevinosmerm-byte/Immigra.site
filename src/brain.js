// @ts-check
import { civicsQuestionBank } from "./civicsQuestionBank.js";
import { DEFAULT_TEST_VERSION, getCivicsCategory } from "./civicsVersions.js";
import { resolveCivicsQuestion } from "./dynamicCivicsData.js";
import { buildDailyPlan } from "./learning.js";
import { getPracticeSummary } from "./progress.js";
import { studyGoal } from "../shared/studyPreparation.js";

/**
 * @typedef {Object} StudyPlanItem
 * @property {string} id
 * @property {"civics"|"quiz"|"interview"|"reading"|"writing"|"podcasts"|"immigrationHelp"|"uscisTracker"|"coach"} module
 * @property {string} [mode]
 * @property {number[]} questionIds Stable official question IDs, never bank indexes.
 * @property {number} minutes
 * @property {string} reason
 * @property {string} label Localized action text.
 * @property {string} detail
 */

/**
 * @typedef {Object} BrainContext
 * @property {Record<string, any>} userProfile
 * @property {Record<string, any>} immigrationProfile
 * @property {Record<string, any>} n400Profile
 * @property {Record<string, any>|null} civicProfile
 * @property {Record<string, any>} caseProfile
 * @property {Record<string, any>} learningProfile
 * @property {"en"|"es"} language
 * @property {Record<string, any>} preferences
 * @property {string} testVersion
 */

/**
 * @typedef {Object} DailyStudyPlan
 * @property {StudyPlanItem[]} items
 * @property {number} totalMinutes
 * @property {string} focus
 * @property {number|null} daysUntilInterview
 * @property {string|null} interviewDate
 * @property {string|null} interviewTime
 * @property {string} caseStage Confirmed saved stage, preserved independently of preparation.
 * @property {string} preparationStage Derived preparation focus, never a new case event.
 * @property {string} preparationConfidence
 * @property {string} preparationSource
 * @property {string} testVersion
 */

/** @typedef {Omit<StudyPlanItem, "id"|"label"|"detail"|"minutes"|"questionIds"> & {weight:number, questionIds?:number[]}} PlanCandidate */

const DAY = 86_400_000;
/** @type {(value:number,min:number,max:number) => number} */
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
/** @type {(value:any) => any[]} */
const array = value => Array.isArray(value) ? value : [];
/** @type {(value:any) => Record<string,any>} */
const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
/** @type {(value:any) => number} */
const time = value => typeof value === "number" ? value : Date.parse(value);
/** @type {(values:number[]) => number} */
const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
/** @type {(value:any) => boolean} */
const hasDate = value => typeof value === "string" && Number.isFinite(Date.parse(value));

/** @param {any} value */
function nowValue(value) {
  const parsed = time(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

/** Distinguish a card viewed/marked learned from demonstrated independent recall. @param {Record<string,any>} state */
export function getQuestionLearningStatus(state) {
  if (!(state.attempts > 0)) return state.recentMistake ? "WEAK" : "NEW";
  if (state.lastCorrect === false || state.recentErrors >= 2 || state.mastery < 0.35) return "WEAK";
  if (state.mastery >= 0.9 && state.consecutiveIndependentCorrect >= 4) return "MASTERED";
  if (state.mastery >= 0.7) return "STRONG";
  return "LEARNING";
}

/** @param {Record<string,any>|undefined} profile @param {number} now */
function deriveLearningProfile(profile, now) {
  const input = object(profile);
  const progress = object(input.quizProgress);
  const viewed = new Set(array(input.civicsViewed));
  const markedMastered = new Set(array(input.civicsMastered));
  const mistakes = new Set(array(input.civicsNeedsPractice));
  const questionStates = civicsQuestionBank.map((question, index) => {
    const previous = object(progress[question.questionId]);
    const attempts = Math.max(0, Number(previous.attempts) || 0);
    const correct = clamp(Number(previous.correct) || 0, 0, attempts);
    const state = {
      ...previous, questionId: question.questionId, category: getCivicsCategory(question.questionId),
      attempts, correct, incorrect: Math.max(0, Number(previous.incorrect) || attempts - correct),
      mastery: clamp(Number(previous.mastery) || 0, 0, 1),
      lapses: Math.max(0, Number(previous.lapses) || 0),
      recentErrors: Math.max(0, Number(previous.recentErrors) || 0),
      viewed: viewed.has(index), markedLearned: markedMastered.has(index), recentMistake: mistakes.has(index),
      lastReviewAt: previous.lastAttemptAt || null, nextReviewAt: previous.nextReviewAt || null,
    };
    return { ...state, status: getQuestionLearningStatus(state) };
  });
  const categories = [...new Set(questionStates.map(state => state.category))];
  const weakTopics = categories.map(category => {
    const states = questionStates.filter(state => state.category === category && (state.attempts > 0 || state.recentMistake));
    return { category, mastery: mean(states.map(state => state.mastery)), attempted: states.length, recentErrors: states.reduce((sum, state) => sum + state.recentErrors + Number(state.recentMistake), 0) };
  }).filter(topic => topic.attempted && (topic.mastery < 0.7 || topic.recentErrors > 0))
    .sort((left, right) => right.recentErrors - left.recentErrors || left.mastery - right.mastery);
  return {
    ...input, practiceEvents: array(input.practiceEvents), quizProgress: progress,
    moduleProgress: object(input.moduleProgress), civicsViewed: [...viewed], civicsMastered: [...markedMastered], civicsNeedsPractice: [...mistakes],
    questionStates, weakTopics,
    n400Progress: object(input.n400Progress),
    weakN400ConceptIds: [...new Set([...array(input.n400Progress?.weakN400ConceptIds), ...array(input.weakN400ConceptIds)])],
    recentN400Mistakes: [...new Set([...array(input.n400Progress?.recentN400Mistakes), ...array(input.recentN400Mistakes)])],
    dueQuestionIds: questionStates.filter(state => hasDate(state.nextReviewAt) && Date.parse(state.nextReviewAt) <= now).map(state => state.questionId),
    summary: getPracticeSummary(array(input.practiceEvents), [...viewed], [...markedMastered]),
  };
}

/**
 * Join the existing stores without persisting a second copy of learning or civic data.
 * @param {Partial<BrainContext> & {now?: string|number}} input
 * @returns {BrainContext}
 */
export function buildBrainContext(input = {}) {
  const civicProfile = input.civicProfile || null;
  const userProfile = { ...object(input.userProfile) };
  if (!userProfile.zipCode && civicProfile?.zipCode) userProfile.zipCode = civicProfile.zipCode;
  if (!userProfile.state && civicProfile?.state) userProfile.state = civicProfile.state.code || civicProfile.state;
  const caseProfile = { ...object(input.caseProfile) };
  const immigrationProfile = { ...object(input.immigrationProfile) };
  for (const field of ["interviewDate", "interviewTime", "oathDate", "fieldOffice", "receiptNumber"]) {
    if (!immigrationProfile[field] && caseProfile[field]) immigrationProfile[field] = caseProfile[field];
  }
  if (!immigrationProfile.n400FilingDate && caseProfile.filingDate) immigrationProfile.n400FilingDate = caseProfile.filingDate;
  // Known user dates can be reused without requiring another journey entry.
  for (const field of ["interviewDate", "interviewTime", "oathDate", "fieldOffice", "receiptNumber"]) {
    if (!caseProfile[field] && immigrationProfile[field]) caseProfile[field] = immigrationProfile[field];
  }
  if (!caseProfile.filingDate && immigrationProfile.n400FilingDate) caseProfile.filingDate = immigrationProfile.n400FilingDate;
  if (!caseProfile.currentStage) caseProfile.currentStage = caseProfile.interviewDate ? "INTERVIEW_SCHEDULED" : caseProfile.filingDate ? "N400_FILED" : "PREPARING_N400";
  const n400Profile = { ...object(input.n400Profile), answers: { ...object(input.n400Profile?.answers) }, flags: { ...object(input.n400Profile?.flags) } };
  const preferences = { ...object(input.preferences) };
  const available = Number(preferences.availableStudyMinutes);
  preferences.availableStudyMinutes = Number.isFinite(available) && available > 0 ? clamp(Math.round(available), 1, 120) : 8;
  return {
    userProfile, immigrationProfile, n400Profile, civicProfile, caseProfile,
    language: input.language === "es" ? "es" : "en", preferences,
    testVersion: DEFAULT_TEST_VERSION,
    learningProfile: deriveLearningProfile(input.learningProfile, nowValue(input.now)),
  };
}

/** @param {string|null} date @param {number} now @param {string} timeZone */
function daysUntil(date, now, timeZone) {
  if (!date || !hasDate(date)) return null;
  // Compare calendar days rather than labeling today's appointment as tomorrow.
  /** @param {number} value */
  const calendarDay = value => {
    const fields = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
    /** @param {string} type */
    const field = type => fields.find(part => part.type === type)?.value;
    return `${field("year")}-${field("month")}-${field("day")}`;
  };
  const appointmentDay = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : calendarDay(Date.parse(date));
  const currentDay = calendarDay(now);
  return Math.round((Date.parse(`${appointmentDay}T00:00:00Z`) - Date.parse(`${currentDay}T00:00:00Z`)) / DAY);
}

/** @param {StudyPlanItem["module"]} module @param {string|null|undefined} mode @param {string} reason @param {string} language */
function itemCopy(module, mode, reason, language) {
  const es = language === "es";
  if (module === "coach") return { label: es ? "Practica cómo expresarte" : "Practice expressing yourself", detail: es ? "Conversa con Sarah o Kevin en el idioma que elijas. Puedes omitir temas o corregirte." : "Talk with Sarah or Kevin in your chosen language. You can skip topics or correct yourself." };
  if (reason === "authorized_help") return { label: es ? "Revisa fuentes y ayuda profesional" : "Review sources and professional help", detail: es ? "Usa fuentes oficiales y prepara preguntas para un abogado o representante autorizado." : "Use official sources and prepare questions for an attorney or authorized representative." };
  if (module === "uscisTracker") {
    if (reason === "oath_preparation") return { label: es ? "Prepara tu ceremonia de juramento" : "Prepare for your oath ceremony", detail: es ? "Revisa tu aviso y los documentos de tu ceremonia." : "Review your notice and ceremony documents." };
    if (reason === "evidence_requested") return { label: es ? "Revisa tu solicitud de evidencia" : "Review your evidence request", detail: es ? "Confirma las instrucciones y la fecha límite en el aviso de USCIS." : "Confirm the instructions and deadline in your USCIS notice." };
    return { label: es ? "Revisa tus próximos pasos" : "Review your next steps", detail: es ? "Consulta tu recorrido y los documentos que necesitas." : "Check your journey and the documents you need." };
  }
  if (module === "immigrationHelp") return { label: es ? "Explora tus próximos pasos como ciudadano" : "Explore your next steps as a citizen", detail: es ? "Encuentra recursos oficiales y orientación para después del juramento." : "Find official resources and guidance after your oath." };
  if (module === "interview" && mode === "n400") return { label: es ? "Practica tu información N-400" : "Practice your N-400 information", detail: es ? "Usa la información que ya confirmaste para ensayar respuestas personales." : "Use the information you already confirmed to rehearse personal answers." };
  if (module === "interview") return { label: es ? "Ensaya tu entrevista" : "Rehearse your interview", detail: es ? "Practica con tu contexto personal y tus áreas de repaso." : "Practice with your personal context and review areas." };
  if (module === "quiz" || module === "civics") {
    const label = reason === "due" ? (es ? "Repasa las preguntas pendientes" : "Review questions due today")
      : reason === "weak_topics" ? (es ? "Refuerza tus preguntas difíciles" : "Strengthen your difficult questions")
        : (es ? "Continúa tu práctica de civismo" : "Continue your civics practice");
    return { label, detail: es ? "Una selección breve basada en tus respuestas y repasos." : "A short selection based on your answers and reviews." };
  }
  if (module === "writing") return { label: es ? "Practica un dictado en inglés" : "Practice an English dictation", detail: es ? "Refuerza tu escritura con una oración breve." : "Strengthen your writing with a short sentence." };
  return { label: es ? "Lee una oración en inglés" : "Read an English sentence", detail: es ? "Practica la lectura en voz alta a tu ritmo." : "Practice reading aloud at your own pace." };
}

/**
 * A deterministic, budgeted plan derived from confirmed journey and existing learning evidence.
 * @param {BrainContext} context
 * @param {{now?: string|number, availableStudyMinutes?: number}} options
 * @returns {DailyStudyPlan}
 */
export function getDailyStudyPlan(context, options = {}) {
  const now = nowValue(options.now);
  const learning = context.learningProfile || {};
  const summary = learning.summary || getPracticeSummary(array(learning.practiceEvents));
  const stage = context.caseProfile?.currentStage || "PREPARING_N400";
  const goal = studyGoal(context.preferences?.studyGoal);
  const interviewDate = context.caseProfile?.interviewDate || context.immigrationProfile?.interviewDate || null;
  const interviewTime = context.caseProfile?.interviewTime || context.immigrationProfile?.interviewTime || null;
  let timeZone = context.preferences?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  try { new Intl.DateTimeFormat("en-US", { timeZone }); } catch { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; }
  const knownInterviewDays = daysUntil(interviewDate, now, timeZone);
  const preInterviewStages = ["PREPARING_N400", "N400_FILED", "RECEIPT_RECEIVED", "BIOMETRICS_PENDING", "BIOMETRICS_COMPLETED", "INTERVIEW_PENDING", "INTERVIEW_SCHEDULED"];
  // A date already confirmed in Profile informs preparation without rewriting a
  // saved journey milestone. Completed stages and evidence requests keep priority.
  const prepareForKnownInterview = goal === "citizenship" && preInterviewStages.includes(stage) && knownInterviewDays !== null && knownInterviewDays >= 0;
  const preparationStage = prepareForKnownInterview ? "INTERVIEW_SCHEDULED" : stage;
  const inferredPreparation = preparationStage !== stage;
  const daysUntilInterview = goal === "citizenship" && ["INTERVIEW_PENDING", "INTERVIEW_SCHEDULED"].includes(preparationStage) ? knownInterviewDays : null;
  const budgetValue = Number(options.availableStudyMinutes ?? context.preferences?.availableStudyMinutes);
  const budget = Number.isFinite(budgetValue) && budgetValue > 0 ? clamp(Math.round(budgetValue), 1, 120) : 8;
  const resolved = civicsQuestionBank.map(question => resolveCivicsQuestion(question, { profile: context.civicProfile }));
  const availableIds = new Set(resolved.filter(question => question.acceptedAnswers?.length).map(question => question.questionId));
  const states = array(learning.questionStates).filter(state => availableIds.has(state.questionId));
  const ranked = buildDailyPlan(states, new Date(now).toISOString(), Math.max(1, Math.min(20, budget * 2)));
  const hasDue = states.some(state => hasDate(state.nextReviewAt) && Date.parse(state.nextReviewAt) <= now);
  const hasWeak = states.some(state => state.status === "WEAK" || state.recentMistake || state.lastCorrect === false);
  const civicsReason = hasDue ? "due" : hasWeak ? "weak_topics" : "foundation";
  const english = /** @type {"reading"|"writing"} */ (["reading", "writing"].sort((left, right) => {
    const a = summary[left] || { attempts: 0, score: null };
    const b = summary[right] || { attempts: 0, score: null };
    return Number(a.attempts > 0) - Number(b.attempts > 0) || (a.score ?? 0) - (b.score ?? 0);
  })[0]);
  /** @type {PlanCandidate} */
  const civics = { module: "quiz", mode: mean(states.filter(state => state.attempts).map(state => state.mastery)) >= 0.7 ? "recall" : "choose", weight: 4, reason: civicsReason, questionIds: ranked.map(item => item.questionId) };
  /** @type {PlanCandidate} */
  const n400 = { module: "interview", mode: "n400", weight: 2, reason: array(learning.weakN400ConceptIds).length ? "n400_review" : Object.keys(object(context.n400Profile?.answers)).length ? "personal_context" : "n400_preparation" };
  /** @type {PlanCandidate} */
  const englishItem = { module: english, weight: 2, reason: "english_preparation" };
  let focus = "foundation";
  /** @type {PlanCandidate[]} */
  let candidates = [civics, n400, englishItem];
  if (["INTERVIEW_PENDING", "INTERVIEW_SCHEDULED"].includes(preparationStage)) {
    focus = "interview_preparation";
    candidates = [{ ...n400, weight: 3 }, { ...civics, weight: 3 }, englishItem];
    if (preparationStage === "INTERVIEW_SCHEDULED" && daysUntilInterview !== null && daysUntilInterview >= 0 && daysUntilInterview <= 14) {
      focus = "upcoming_interview";
      if (context.preferences?.liveInterviewAvailable === true) {
        candidates = [{ module: "interview", mode: "full", weight: 4, reason: "upcoming_interview" }, { ...civics, weight: 2 }, { ...n400, weight: 2 }];
      } else {
        candidates = hasWeak || hasDue
          ? [{ ...civics, weight: 4 }, { ...n400, weight: 2 }, englishItem]
          : [{ ...n400, weight: 4, reason: "upcoming_interview" }, { ...civics, weight: 2 }, englishItem];
      }
    }
  } else if (["INTERVIEW_COMPLETED", "APPROVED", "OATH_SCHEDULED"].includes(stage)) {
    focus = "oath_preparation";
    candidates = [{ module: "uscisTracker", weight: 7, reason: "oath_preparation" }, { ...englishItem, weight: 1, reason: "maintenance" }];
  } else if (["OATH_COMPLETED", "CITIZEN"].includes(stage)) {
    focus = "citizen_resources";
    candidates = [{ module: "immigrationHelp", weight: 1, reason: "citizen_resources" }];
  } else if (stage === "ADDITIONAL_EVIDENCE") {
    focus = "evidence_requested";
    candidates = [{ module: "uscisTracker", weight: 5, reason: "evidence_requested" }, { ...civics, weight: 2 }, { ...n400, weight: 1 }];
  }
  if (goal !== "citizenship") {
    focus = "communication_preparation";
    candidates = [
      { module: "coach", weight: 5, reason: "spoken_communication" },
      { module: "immigrationHelp", weight: 3, reason: "authorized_help" },
    ];
  }
  // Never prescribe zero-minute tasks or turn a one-minute preference into a long plan.
  candidates = candidates.slice(0, Math.min(candidates.length, budget));
  const weight = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  const allocations = candidates.map(candidate => Math.max(1, Math.floor(budget * candidate.weight / weight)));
  let remaining = budget - allocations.reduce((sum, minutes) => sum + minutes, 0);
  for (let index = 0; remaining > 0; index = (index + 1) % candidates.length) { allocations[index] += 1; remaining -= 1; }
  for (let index = allocations.length - 1; remaining < 0; index = (index - 1 + allocations.length) % allocations.length) {
    if (allocations[index] > 1) { allocations[index] -= 1; remaining += 1; }
  }
  const items = candidates.map((candidate, index) => ({
    ...candidate, id: `${candidate.module}:${candidate.mode || candidate.reason}`, minutes: allocations[index],
    questionIds: array(candidate.questionIds).slice(0, Math.max(1, allocations[index] * 2)),
    ...itemCopy(candidate.module, candidate.mode, candidate.reason, context.language),
  })).map(({ weight: _weight, ...item }) => item);
  return {
    items, totalMinutes: budget, focus, daysUntilInterview, interviewDate, interviewTime,
    caseStage: stage, preparationStage,
    preparationConfidence: inferredPreparation ? "ESTIMATED" : context.caseProfile?.confidence || "USER_CONFIRMED",
    preparationSource: inferredPreparation ? "CONFIRMED_INTERVIEW_DATE" : context.caseProfile?.source || "CASE_PROFILE",
    testVersion: context.testVersion || DEFAULT_TEST_VERSION,
  };
}

/** @param {BrainContext} context @param {DailyStudyPlan} plan */
export function getNextAction(context, plan = getDailyStudyPlan(context)) {
  return plan.items[0] || { module: "civics", minutes: 1, reason: "foundation", questionIds: [], ...itemCopy("civics", null, "foundation", context.language) };
}
