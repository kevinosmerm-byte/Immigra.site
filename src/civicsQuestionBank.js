import { civicsQuestions } from "./questions.js";
import { civicsAnswers } from "./civicsAnswers.js";
import { DEFAULT_TEST_VERSION, TEST_VERSIONS, getCivicsCategory } from "./civicsVersions.js";

const MULTI_ANSWER_COUNTS = Object.freeze({ 10: 2, 48: 2, 65: 3, 67: 2, 69: 2, 126: 3 });
const DYNAMIC_KEYS = Object.freeze({
  23: "stateSenators", 29: "representative", 30: "speakerOfTheHouse",
  38: "president", 39: "vicePresident", 57: "chiefJustice",
  61: "stateGovernor", 62: "stateCapital",
});

const ALIASES = Object.freeze({
  1: ["republic", "representative democracy"],
  2: ["constitution", "us constitution"],
  7: ["twenty seven", "27"],
  9: ["declaration of independence"],
  18: ["congress", "legislative branch"],
  21: ["one hundred", "100"],
  24: ["four hundred thirty five", "435"],
  108: ["ussr", "soviet union"],
  119: ["washington dc", "dc"],
});

function answerType(questionId, question) {
  if (DYNAMIC_KEYS[questionId]) return "dynamic";
  if (MULTI_ANSWER_COUNTS[questionId]) return "multiple";
  if (/how many|how long|what year|when/i.test(question)) return "number_or_date";
  if (/who|name/i.test(question)) return "person_or_fact";
  return "fact";
}

/** The only question model consumed by cards, quizzes and interviews. */
export const civicsQuestionBank = Object.freeze(civicsQuestions.map((item, index) => {
  const dynamicAnswerKey = DYNAMIC_KEYS[item.id] || null;
  const staticAnswers = (civicsAnswers[index] || []).filter((answer) => answer !== "Answers will vary");
  return Object.freeze({
    questionId: item.id,
    question: item.english,
    questionSpanish: item.spanish,
    acceptedAnswers: Object.freeze(dynamicAnswerKey ? [] : staticAnswers),
    aliases: Object.freeze(ALIASES[item.id] || []),
    minimumAnswersRequired: MULTI_ANSWER_COUNTS[item.id] || 1,
    answerType: answerType(item.id, item.english),
    isDynamic: Boolean(dynamicAnswerKey),
    dynamicAnswerKey,
    testVersion: DEFAULT_TEST_VERSION,
    category: getCivicsCategory(item.id),
    officialSource: TEST_VERSIONS[DEFAULT_TEST_VERSION].officialSource,
    lastVerified: null,
  });
}));

export const getCivicsQuestion = (questionId, testVersion = DEFAULT_TEST_VERSION) => civicsQuestionBank.find((item) => item.questionId === Number(questionId) && item.testVersion === testVersion) || null;
