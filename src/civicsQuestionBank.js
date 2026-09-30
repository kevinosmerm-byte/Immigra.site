import official from "./data/uscis2025Civics.json" with { type: "json" };
import { DEFAULT_TEST_VERSION, TEST_VERSIONS, getCivicsCategory } from "./civicsVersions.js";

const DYNAMIC_KEYS = Object.freeze({
  23: "stateSenators", 29: "representative", 30: "speakerOfTheHouse",
  38: "president", 39: "vicePresident", 57: "chiefJustice",
  61: "stateGovernor", 62: "stateCapital",
});



function answerType(questionId, question, minimumAnswersRequired) {
  if (DYNAMIC_KEYS[questionId]) return "dynamic";
  if (minimumAnswersRequired > 1) return "multiple";
  if (/how many|how long|what year|when/i.test(question)) return "number_or_date";
  if (/who|name/i.test(question)) return "person_or_fact";
  return "fact";
}

/** The only question model consumed by cards, quizzes and interviews. */
export const civicsQuestionBank = Object.freeze(official.questions.map((item) => {
  const dynamicAnswerKey = DYNAMIC_KEYS[item.id] || null;
  const staticAnswers = item.answers;
  return Object.freeze({
    questionId: item.id,
    question: item.question,
    questionSpanish: item.spanish,
    acceptedAnswers: Object.freeze(dynamicAnswerKey ? [] : staticAnswers),
    aliases: Object.freeze([]),
    minimumAnswersRequired: item.minimumAnswersRequired,
    answerType: answerType(item.id, item.question, item.minimumAnswersRequired),
    isDynamic: Boolean(dynamicAnswerKey),
    dynamicAnswerKey,
    testVersion: DEFAULT_TEST_VERSION,
    category: getCivicsCategory(item.id),
    officialSource: TEST_VERSIONS[DEFAULT_TEST_VERSION].officialSource,
    lastVerified: "2026-09-30",
  });
}));

export const getCivicsQuestion = (questionId, testVersion = DEFAULT_TEST_VERSION) => civicsQuestionBank.find((item) => item.questionId === Number(questionId) && item.testVersion === testVersion) || null;
